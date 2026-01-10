'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import SimplePeer, { Instance as PeerInstance } from 'simple-peer'
import Navbar from '../components/Navbar'
import ChatBar from './ChatBar'
import { Phone, PhoneOff, SkipForward, UserPlus, Video, VideoOff, Loader } from 'lucide-react'

interface RemoteUser {
  id: string
  username: string
  displayName: string
}

export default function VideoCallContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [username, setUsername] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [matchedUser, setMatchedUser] = useState<RemoteUser | null>(null)
  const [isInCall, setIsInCall] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [initiator, setInitiator] = useState(false)
  const [caughtSessionId, setCaughtSessionId] = useState<string | null>(null)

  // Video and WebRTC refs
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerRef = useRef<PeerInstance | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const matchPollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const signalPollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const sessionIdRef = useRef<string | null>(null)

  // Handle find match - defined early to be used in auto-start effect
  const handleFindMatch = useCallback(async () => {
    if (!userId) {
      alert('User not authenticated')
      return
    }

    setIsSearching(true)

    try {
      const response = await fetch('/api/video-calls/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()
      if (data.session) {
        setSessionId(data.session.id)
      }
    } catch (error) {
      console.error('Error creating session:', error)
      alert('Failed to start video call session')
      setIsSearching(false)
    }
  }, [userId])

  // Sync sessionId to ref for cleanup access
  useEffect(() => {
    sessionIdRef.current = sessionId
  }, [sessionId])

  // Initialize and get user info
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
        setUsername(parsed.username)
      }

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

      // Check if this is a caught session
      const caughtSessionIdParam = searchParams?.get('sessionId')
      if (caughtSessionIdParam) {
        setCaughtSessionId(caughtSessionIdParam)
        setSessionId(caughtSessionIdParam)
        setIsInCall(true) // Skip the welcome screen and go straight to call
      }

      setIsLoggedIn(true)
      setLoading(false)
    }

    checkAuth()
  }, [router, searchParams])

  // Bind local stream to video element after component mounts
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current
      console.log('✅ Local stream connected to video element')
    }
  }, [])

  // Fetch caught session details to get the other user's info
  useEffect(() => {
    if (!caughtSessionId || !userId || matchedUser) return

    const fetchCaughtSessionDetails = async () => {
      try {
        const response = await fetch(`/api/video-calls/session/${caughtSessionId}`)
        if (response.ok) {
          const sessionData = await response.json()
          const otherUserId = sessionData.user1_id === userId ? sessionData.user2_id : sessionData.user1_id

          if (otherUserId) {
            // Fetch the other user's details
            const userResponse = await fetch(`/api/users/${otherUserId}`)
            if (userResponse.ok) {
              const userData = await userResponse.json()
              setMatchedUser({
                id: userData.id,
                username: userData.username,
                displayName: userData.displayName,
              })
            }
          }
        }
      } catch (error) {
        console.error('Error fetching caught session details:', error)
      }
    }

    fetchCaughtSessionDetails()
  }, [caughtSessionId, userId, matchedUser])

  // Cleanup on unmount - end session, stop camera, cleanup WebRTC
  useEffect(() => {
    const remoteRef = remoteVideoRef.current

    // Cleanup when component unmounts or when navigating away
    return () => {
      // End active session if exists (uses ref to get current sessionId)
      if (sessionIdRef.current) {
        fetch('/api/video-calls/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sessionIdRef.current }),
        }).catch(console.error)
      }

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
      if (matchPollIntervalRef.current) {
        clearInterval(matchPollIntervalRef.current)
        matchPollIntervalRef.current = null
      }
      if (signalPollIntervalRef.current) {
        clearInterval(signalPollIntervalRef.current)
        signalPollIntervalRef.current = null
      }
    }
  }, [])

  // Handle call duration timer
  useEffect(() => {
    if (!isInCall) return

    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isInCall])

  // Start WebRTC connection
  const startWebRTCConnection = useCallback((remoteUserId: string, isInitiator: boolean) => {
    if (!localStreamRef.current || !sessionId) return

    // Create peer connection
    const peer = new SimplePeer({
      initiator: isInitiator,
      trickle: true,
      streams: [localStreamRef.current],
      config: {
        iceServers: [
          { urls: ['stun:stun.l.google.com:19302'] },
          { urls: ['stun:stun1.l.google.com:19302'] },
        ],
      },
    })

    peer.on('stream', (stream: MediaStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream
      }
    })

    peer.on('signal', (data: any) => {
      // Send signal data to remote user
      fetch('/api/video-calls/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          fromUserId: userId,
          toUserId: remoteUserId,
          signalType: 'webrtc',
          signalData: JSON.stringify(data),
        }),
      }).catch(console.error)
    })

    peer.on('error', (error: Error) => {
      console.error('WebRTC error:', error)
    })

    peer.on('connect', () => {
      console.log('WebRTC Connected')
    })

    peer.on('close', () => {
      console.log('WebRTC Closed')
    })

    peerRef.current = peer

    // Poll for incoming signals from remote user
    signalPollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/video-calls/signal?sessionId=${sessionId}&userId=${userId}`
        )
        const data = await response.json()

        if (data.signals && data.signals.length > 0) {
          console.log(`📡 Processing ${data.signals.length} signals...`)
          for (const signal of data.signals) {
            try {
              const signalData = JSON.parse(signal.signal_data)
              console.log(`📨 Received signal from ${signal.from_user_id}: ${signal.signal_type}`)
              peer.signal(signalData)

              // Mark signal as processed to prevent re-processing
              await fetch('/api/video-calls/signal/mark-processed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ signalId: signal.id }),
              }).catch(err => console.error('Error marking signal processed:', err))
            } catch (error) {
              console.error('Error processing signal:', error)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching signals:', error)
      }
    }, 1000) // Poll every 1000ms (reduced from 500ms to reduce network spam)
  }, [sessionId, userId])

  // Poll for match
  useEffect(() => {
    if (!sessionId || isInCall) return

    matchPollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch('/api/video-calls/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, userId }),
        })

        const data = await response.json()
        if (data.matched && data.otherUser) {
          setMatchedUser({
            id: data.otherUser.id,
            username: data.otherUser.username,
            displayName: data.otherUser.displayName,
          })
          setInitiator(data.initiator ?? false)
          setIsInCall(true)
          setIsSearching(false)
          if (matchPollIntervalRef.current) clearInterval(matchPollIntervalRef.current)
          startWebRTCConnection(data.otherUser.id, data.initiator ?? false)
        }
      } catch (error) {
        console.error('Error checking match:', error)
      }
    }, 1000) // Poll every second

    return () => {
      if (matchPollIntervalRef.current) clearInterval(matchPollIntervalRef.current)
    }
  }, [sessionId, isInCall, userId, startWebRTCConnection])

  // Start WebRTC connection when matched user is set (for caught sessions)
  useEffect(() => {
    if (matchedUser && sessionId && userId && isInCall && !peerRef.current) {
      startWebRTCConnection(matchedUser.id, initiator)
    }
  }, [matchedUser, sessionId, userId, isInCall, initiator, startWebRTCConnection])

  const handleSkip = async () => {
    if (!sessionId) return

    // End current session
    try {
      await fetch('/api/video-calls/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
    } catch (error) {
      console.error('Error ending session:', error)
    }

    // Reset state and find new match
    setMatchedUser(null)
    setIsInCall(false)
    setCallDuration(0)
    if (peerRef.current) {
      peerRef.current.destroy()
      peerRef.current = null
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null
    }

    // Start new session
    handleFindMatch()
  }

  const handleEndCall = async () => {
    if (!sessionId) return

    try {
      await fetch('/api/video-calls/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
    } catch (error) {
      console.error('Error ending session:', error)
    }

    // Cleanup
    setMatchedUser(null)
    setIsInCall(false)
    setSessionId(null)
    setCallDuration(0)
    setIsSearching(false)

    if (peerRef.current) {
      peerRef.current.destroy()
      peerRef.current = null
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null
    }

    if (matchPollIntervalRef.current) clearInterval(matchPollIntervalRef.current)
    if (signalPollIntervalRef.current) clearInterval(signalPollIntervalRef.current)
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled
      })
      setVideoEnabled(!videoEnabled)
    }
  }

  const toggleAudio = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled
      })
      setAudioEnabled(!audioEnabled)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  if (!isLoggedIn || loading) {
    return (
      <div className="home-container">
        <Navbar />
        <main className="home-main">
          <div className="profile-loading">Loading video call...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="home-container">
      <Navbar />
      <main className="home-main">
        <div className="video-call-container">
          {!isInCall ? (
            <div className="video-call-welcome">
              <div className="video-call-icon">
                <Video size={64} />
              </div>
              <h1 className="video-call-title">Random Video Call</h1>
              <p className="video-call-subtitle">
                Connect with random users with live video
              </p>

              {/* Local camera preview */}
              <div className="local-preview-welcome">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    borderRadius: '12px',
                    height: '250px',
                    objectFit: 'cover',
                    backgroundColor: '#000',
                    display: localStreamRef.current ? 'block' : 'none'
                  }}
                />
              </div>

              <button
                className="video-call-button"
                onClick={handleFindMatch}
                disabled={isSearching}
              >
                {isSearching ? (
                  <>
                    <Loader size={20} />
                    Searching...
                  </>
                ) : (
                  <>
                    <UserPlus size={20} />
                    Find Match
                  </>
                )}
              </button>
              <div className="video-call-info">
                <p>✓ Free for everyone</p>
                <p>✓ Live video connection</p>
                <p>✓ Skip anytime</p>
              </div>
            </div>
          ) : (
            <div className="video-call-active">
              {/* Main video container */}
              <div className="video-call-main">
                {/* Left side: Video + Chat */}
                <div className="video-section">
                  {/* Remote User Video */}
                  <div className="video-call-remote">
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {matchedUser && (
                      <div className="remote-info-overlay">
                        <h2>{matchedUser.displayName}</h2>
                        <div className="status-indicator">
                          <span className="status-dot"></span>
                          Connected
                        </div>
                        {isInCall && (
                          <div className="call-duration">
                            {formatDuration(callDuration)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Chat Bar - overlaid on left side */}
                  <ChatBar
                    sessionId={sessionId!}
                    userId={userId}
                    remoteUserDisplayName={matchedUser?.displayName || 'User'}
                  />
                </div>

                {/* Right side: Local User Video (circular PIP) */}
                <div className="video-call-local-pip-circular">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              </div>

              {/* Call Controls - bottom center */}
              <div className="video-call-controls">
                <button
                  className="control-button toggle"
                  onClick={toggleAudio}
                  title={audioEnabled ? 'Mute Audio' : 'Unmute Audio'}
                >
                  {audioEnabled ? <Phone size={24} /> : <PhoneOff size={24} />}
                </button>
                <button
                  className="control-button toggle"
                  onClick={toggleVideo}
                  title={videoEnabled ? 'Disable Video' : 'Enable Video'}
                >
                  {videoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
                </button>
                <button
                  className="control-button decline"
                  onClick={handleEndCall}
                  title="End Call"
                >
                  <PhoneOff size={24} />
                </button>
                <button
                  className="control-button skip"
                  onClick={handleSkip}
                  title="Skip to Next"
                >
                  <SkipForward size={24} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
