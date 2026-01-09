'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { Phone, PhoneOff, SkipForward, UserPlus, Video } from 'lucide-react'

interface RandomUser {
  id: string
  username: string
  displayName: string
  avatar: string
  status: 'online' | 'offline'
}

const mockUsers: RandomUser[] = [
  {
    id: '1',
    username: 'john',
    displayName: 'John Doe',
    avatar: 'J',
    status: 'online',
  },
  {
    id: '2',
    username: 'jane',
    displayName: 'Jane Smith',
    avatar: 'J',
    status: 'online',
  },
  {
    id: '3',
    username: 'alex',
    displayName: 'Alex Johnson',
    avatar: 'A',
    status: 'online',
  },
  {
    id: '4',
    username: 'sarah',
    displayName: 'Sarah Wilson',
    avatar: 'S',
    status: 'online',
  },
  {
    id: '5',
    username: 'mike',
    displayName: 'Mike Chen',
    avatar: 'M',
    status: 'online',
  },
  {
    id: '6',
    username: 'emma',
    displayName: 'Emma Davis',
    avatar: 'E',
    status: 'online',
  },
  {
    id: '7',
    username: 'mehmetunat634',
    displayName: 'Mehmet Ünal',
    avatar: 'M',
    status: 'online',
  },
  {
    id: '8',
    username: 'david',
    displayName: 'David Martinez',
    avatar: 'D',
    status: 'online',
  },
  {
    id: '9',
    username: 'lisa',
    displayName: 'Lisa Anderson',
    avatar: 'L',
    status: 'online',
  },
  {
    id: '10',
    username: 'kevin',
    displayName: 'Kevin Brown',
    avatar: 'K',
    status: 'online',
  },
]

export default function VideoCallPage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [matchedUser, setMatchedUser] = useState<RandomUser | null>(null)
  const [isInCall, setIsInCall] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [username, setUsername] = useState('')
  const [availableUsers, setAvailableUsers] = useState<RandomUser[]>([])

  useEffect(() => {
    // Check if user is logged in
    const loggedIn = localStorage.getItem('isLoggedIn')
    if (!loggedIn) {
      router.push('/')
      return
    }
    setIsLoggedIn(true)

    // Get username from localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsed = JSON.parse(userData)
      setUsername(parsed.username)
    }

    // Fetch users from API
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users')
        if (response.ok) {
          const users = await response.json()
          // Convert API users to RandomUser format
          const randomUsers: RandomUser[] = users.map((user: any, index: number) => ({
            id: String(index),
            username: user.username,
            displayName: user.displayName,
            avatar: user.username.charAt(0).toUpperCase(),
            status: 'online' as const,
          }))
          setAvailableUsers(randomUsers)
        } else {
          // Fall back to mock users if API fails
          setAvailableUsers(mockUsers)
        }
      } catch (error) {
        console.error('Error fetching users:', error)
        // Fall back to mock users on error
        setAvailableUsers(mockUsers)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [router])

  // Handle call timer
  useEffect(() => {
    if (!isInCall) return

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isInCall])

  const getRandomUser = () => {
    if (availableUsers.length === 0) return null

    const randomIndex = Math.floor(Math.random() * availableUsers.length)
    const user = availableUsers[randomIndex]

    // Don't match with yourself
    if (user.username === username) {
      // Try to find another user
      const otherUsers = availableUsers.filter(u => u.username !== username)
      if (otherUsers.length === 0) return null
      const randomOtherIndex = Math.floor(Math.random() * otherUsers.length)
      return otherUsers[randomOtherIndex]
    }

    return user
  }

  const handleFindMatch = () => {
    const randomUser = getRandomUser()
    if (!randomUser) {
      alert('No users available for matching')
      return
    }
    setMatchedUser(randomUser)
    setIsInCall(true)
    setCallDuration(0)
  }

  const handleSkip = () => {
    const randomUser = getRandomUser()
    if (!randomUser) {
      alert('No users available for matching')
      return
    }
    setMatchedUser(randomUser)
    setCallDuration(0)
  }

  const handleEndCall = () => {
    setMatchedUser(null)
    setIsInCall(false)
    setCallDuration(0)
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
          {!matchedUser ? (
            <div className="video-call-welcome">
              <div className="video-call-icon">
                <Video size={64} />
              </div>
              <h1 className="video-call-title">Random Video Call</h1>
              <p className="video-call-subtitle">
                Connect with random users from around the world
              </p>
              <button className="video-call-button" onClick={handleFindMatch}>
                <UserPlus size={20} />
                Find Match
              </button>
              <div className="video-call-info">
                <p>✓ Free for everyone</p>
                <p>✓ Anonymous matching</p>
                <p>✓ Skip anytime</p>
              </div>
            </div>
          ) : (
            <div className="video-call-active">
              {/* Remote User */}
              <div className="video-call-remote">
                <div className="remote-video-container">
                  <div className="remote-avatar">
                    {matchedUser.avatar}
                  </div>
                  <div className="remote-info">
                    <h2>{matchedUser.displayName}</h2>
                    <div className="status-indicator">
                      <span className="status-dot"></span>
                      {matchedUser.status}
                    </div>
                  </div>
                  {isInCall && (
                    <div className="call-duration">
                      {formatDuration(callDuration)}
                    </div>
                  )}
                </div>
              </div>

              {/* Local User */}
              <div className="video-call-local">
                <div className="local-video-container">
                  <div className="local-avatar">You</div>
                </div>
              </div>

              {/* Call Controls */}
              <div className="video-call-controls">
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
                  title="Skip"
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
