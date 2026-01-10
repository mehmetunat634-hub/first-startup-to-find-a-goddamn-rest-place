'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { Flower, ArrowRight, Video } from 'lucide-react'

interface WaitingUser {
  sessionId: string
  user: {
    id: string
    username: string
    displayName: string
    firstName: string
    lastName: string
    bio: string
  }
  createdAt: string
}

export default function ExplorePage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [waitingUsers, setWaitingUsers] = useState<WaitingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [currentUsername, setCurrentUsername] = useState<string>('')
  const [catchingSession, setCatchingSession] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is logged in
    const loggedIn = localStorage.getItem('isLoggedIn')
    if (!loggedIn) {
      router.push('/')
      return
    }

    const userData = localStorage.getItem('user')
    if (userData) {
      const parsed = JSON.parse(userData)
      setCurrentUserId(parsed.id)
      setCurrentUsername(parsed.username)
    }

    setIsLoggedIn(true)

    // Fetch waiting sessions
    const fetchWaitingUsers = async () => {
      try {
        const response = await fetch('/api/video-calls/waiting')
        if (response.ok) {
          const data = await response.json()
          // Filter out own session if exists
          const filtered = data.filter(
            (session: WaitingUser) => session.user.username !== currentUsername
          )
          setWaitingUsers(filtered)
        }
      } catch (error) {
        console.error('Error fetching waiting sessions:', error)
      } finally {
        setLoading(false)
      }
    }

    // Fetch immediately and then poll every 3 seconds
    fetchWaitingUsers()
    const interval = setInterval(fetchWaitingUsers, 3000)

    return () => clearInterval(interval)
  }, [router, currentUsername])

  const handleCatch = async (sessionId: string, targetUsername: string) => {
    try {
      setCatchingSession(sessionId)

      const response = await fetch('/api/video-calls/catch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userId: currentUserId }),
      })

      if (response.ok) {
        const data = await response.json()
        // Navigate to the active call page
        router.push(`/video/catch/${sessionId}`)
      } else {
        setCatchingSession(null)
        alert('Someone caught them first! Try another one.')
      }
    } catch (error) {
      console.error('Error catching session:', error)
      setCatchingSession(null)
      alert('Error catching session')
    }
  }

  if (!isLoggedIn || loading) {
    return (
      <div className="home-container">
        <Navbar />
        <main className="home-main">
          <div className="explore-loading">Loading catching board...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="home-container">
      <Navbar />
      <main className="home-main">
        <div className="explore-container">
          <div className="explore-header">
            <h1>🌹 Catch The Flower 🌹</h1>
            <p>People are waiting! Catch them before someone else does</p>
          </div>

          {waitingUsers.length === 0 ? (
            <div className="no-users-message">
              <div className="empty-state">
                <Flower size={48} />
                <p>No flowers being thrown right now...</p>
                <p className="small-text">Be the first to throw your flower!</p>
                <button
                  className="throw-flower-button"
                  onClick={() => router.push('/video-call')}
                >
                  <Video size={20} />
                  Throw Your Flower
                </button>
              </div>
            </div>
          ) : (
            <div className="catch-grid">
              {waitingUsers.map((waiting) => (
                <div key={waiting.sessionId} className="catch-card">
                  <div className="flower-indicator">🌹</div>

                  <div className="catch-card-content">
                    <div className="catch-card-header">
                      <div className="user-avatar">
                        {waiting.user.displayName.charAt(0)}
                      </div>
                      <div className="user-info">
                        <h3 className="user-display-name">
                          {waiting.user.displayName}
                        </h3>
                        <p className="user-username">@{waiting.user.username}</p>
                      </div>
                    </div>

                    <div className="catch-card-body">
                      <p className="user-bio">{waiting.user.bio}</p>
                      <div className="waiting-badge">
                        <div className="pulse"></div>
                        Waiting to be caught...
                      </div>
                    </div>

                    <button
                      className="catch-button"
                      onClick={() =>
                        handleCatch(waiting.sessionId, waiting.user.username)
                      }
                      disabled={catchingSession === waiting.sessionId}
                    >
                      {catchingSession === waiting.sessionId ? (
                        <>
                          <div className="catching-spinner"></div>
                          Catching...
                        </>
                      ) : (
                        <>
                          <Flower size={18} />
                          Catch Now
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

