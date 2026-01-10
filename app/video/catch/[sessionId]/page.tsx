'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import SimplePeer from 'simple-peer'
import Navbar from '../../../components/Navbar'
import { PhoneOff } from 'lucide-react'

export default function CatchVideoCallPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string>('')
  const [sessionId, setSessionId] = useState<string>('')
  const [otherUserId, setOtherUserId] = useState<string>('')
  const [callStatus, setCallStatus] = useState<'connecting' | 'active' | 'ended'>('connecting')
  const [callDuration, setCallDuration] = useState(0)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerRef = useRef<SimplePeer.Instance | null>(null)
  const signalPollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const loggedIn = localStorage.getItem('isLoggedIn')
      if (!loggedIn) {
        router.push('/')
        return
      }

      const userData = localStorage.getItem('user')
      if (userData) {
        const parsed = JSON.parse(userData)
        setUserId(parsed.id)
      }

      const sessionIdParam = params.sessionId as string
      setSessionId(sessionIdParam)

      // Fetch session details to get the other user's ID (will be fetched after userId is set)
      // This will be done in a separate effect below

      // Request camera access immediately
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        })
        localStreamRef.current = stream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
      } catch (error) {
        console.error('Error accessing camera:', error)
        alert('Unable to access camera. Please check permissions.')
      }

      setIsLoggedIn(true)
      setLoading(false)
    }

    checkAuth()

    // Capture ref values for cleanup
    const remoteRef = remoteVideoRef.current

    // Cleanup on unmount
    return () => {
      // Stop all media tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          track.stop()
        })
        localStreamRef.current = null
      }

      // Destroy WebRTC peer connection
      if (peerRef.current) {
        peerRef.current.destroy()
        peerRef.current = null
      }

      // Clear remote video stream
      if (remoteRef) {
        remoteRef.srcObject = null
      }

      // Clear all intervals
      if (signalPollIntervalRef.current) {
        clearInterval(signalPollIntervalRef.current)
        signalPollIntervalRef.current = null
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
        durationIntervalRef.current = null
      }
    }
  }, [router, params.sessionId])

  // Fetch session details to get the other user's ID
  useEffect(() => {
    if (!userId || !sessionId) return

    const fetchSessionDetails = async () => {
      try {
        const response = await fetch(`/api/video-calls/session/${sessionId}`)
        if (response.ok) {
          const sessionData = await response.json()
          const otherUid = sessionData.user1_id === userId ? sessionData.user2_id : sessionData.user1_id
          if (otherUid) {
            setOtherUserId(otherUid)
          }
        }
      } catch (error) {
        console.error('Error fetching session details:', error)
      }
    }

    fetchSessionDetails()
  }, [userId, sessionId])

  // Start WebRTC connection
  useEffect(() => {
    if (!sessionId || !userId || !localStreamRef.current) return

    const startWebRTCConnection = () => {
      if (peerRef.current) return

      const peer = new SimplePeer({
        initiator: false,
        trickle: true,
        stream: localStreamRef.current!,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        },
      })

      peer.on('stream', (stream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream
        }
        setCallStatus('active')
      })

      peer.on('signal', (data) => {
        if (otherUserId) {
          fetch('/api/video-calls/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              fromUserId: userId,
              toUserId: otherUserId,
              signalType: data.type,
              signalData: JSON.stringify(data),
            }),
          }).catch(console.error)
        }
      })

      peer.on('error', (err) => {
        console.error('WebRTC error:', err)
      })

      peerRef.current = peer
    }

    startWebRTCConnection()

    // Poll for signals
    signalPollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/video-calls/signal?sessionId=${sessionId}&userId=${userId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })

        if (response.ok) {
          const data = await response.json()
          const signals = data.signals || []
          signals.forEach((signal: any) => {
            if (peerRef.current) {
              try {
                peerRef.current.signal(JSON.parse(signal.signal_data))
              } catch (error) {
                console.error('Error signaling:', error)
              }
            }
          })
        }
      } catch (error) {
        console.error('Error fetching signals:', error)
      }
    }, 500)

    return () => {
      if (signalPollIntervalRef.current) {
        clearInterval(signalPollIntervalRef.current)
        signalPollIntervalRef.current = null
      }
    }
  }, [sessionId, userId, otherUserId])

  // Start call duration timer
  useEffect(() => {
    if (callStatus !== 'active') return

    durationIntervalRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1)
    }, 1000)

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
        durationIntervalRef.current = null
      }
    }
  }, [callStatus])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleEndCall = async () => {
    if (sessionId) {
      try {
        await fetch('/api/video-calls/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })
      } catch (error) {
        console.error('Error ending call:', error)
      }
    }
    router.push('/explore')
  }

  if (!isLoggedIn || loading) {
    return (
      <div className="home-container">
        <Navbar />
        <main className="home-main">
          <div className="video-loading">Setting up video call...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="home-container">
      <Navbar />
      <main className="home-main">
        <div className="video-call-container">
          {callStatus === 'connecting' ? (
            <div className="video-welcome-screen">
              <div className="waiting-content">
                <div className="waiting-icon">🌹</div>
                <h2>Caught!</h2>
                <p>Connecting to video call...</p>
                <div className="loading-spinner"></div>
              </div>
            </div>
          ) : (
            <div className="video-call-active">
              <div className="video-grid">
                <div className="video-container local">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="video-element"
                  />
                  <div className="video-label">You (Catcher)</div>
                </div>

                <div className="video-container remote">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="video-element"
                  />
                  <div className="video-label">Thrower</div>
                </div>
              </div>

              <div className="video-controls">
                <div className="call-duration">{formatDuration(callDuration)}</div>
                <button className="end-call-button" onClick={handleEndCall}>
                  <PhoneOff size={24} />
                  End Call
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
