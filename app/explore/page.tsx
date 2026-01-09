'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { Video, User } from 'lucide-react'

interface UserCard {
  id: string
  username: string
  displayName: string
  firstName: string
  lastName: string
  bio: string
}

export default function ExplorePage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [users, setUsers] = useState<UserCard[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [currentUsername, setCurrentUsername] = useState<string>('')
  const [callingSessions, setCallingSessions] = useState<Set<string>>(new Set())

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

    // Fetch all users
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users')
        if (response.ok) {
          const data = await response.json()
          // Filter out the current user
          const filteredUsers = data.filter(
            (user: UserCard) => user.username !== currentUsername
          )
          setUsers(filteredUsers)
        }
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setLoading(false)
      }
    }

    if (currentUsername) {
      fetchUsers()
    }
  }, [router, currentUsername])

  const handleVideoCallQuery = async (targetUsername: string) => {
    try {
      setCallingSessions((prev) => new Set(prev).add(targetUsername))

      const response = await fetch(`/api/video-calls/to/${targetUsername}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId }),
      })

      if (response.ok) {
        const data = await response.json()
        // Navigate to the video call page with the target username
        router.push(`/video/to/${targetUsername}`)
      } else {
        setCallingSessions((prev) => {
          const newSet = new Set(prev)
          newSet.delete(targetUsername)
          return newSet
        })
        alert('Failed to initiate video call')
      }
    } catch (error) {
      console.error('Error initiating video call:', error)
      setCallingSessions((prev) => {
        const newSet = new Set(prev)
        newSet.delete(targetUsername)
        return newSet
      })
      alert('Error initiating video call')
    }
  }

  if (!isLoggedIn || loading) {
    return (
      <div className="home-container">
        <Navbar />
        <main className="home-main">
          <div className="explore-loading">Loading users...</div>
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
            <h1>Explore & Connect</h1>
            <p>Browse and select who you want to call</p>
          </div>

          {users.length === 0 ? (
            <div className="no-users-message">
              <p>No users available at the moment</p>
            </div>
          ) : (
            <div className="users-grid">
              {users.map((user) => (
                <div key={user.id} className="user-card">
                  <div className="user-card-header">
                    <div className="user-avatar">{user.displayName.charAt(0)}</div>
                    <div className="user-info">
                      <h3 className="user-display-name">{user.displayName}</h3>
                      <p className="user-username">@{user.username}</p>
                    </div>
                  </div>

                  <div className="user-card-body">
                    <p className="user-bio">{user.bio}</p>
                    <div className="user-meta">
                      <span className="user-name">
                        {user.firstName} {user.lastName}
                      </span>
                    </div>
                  </div>

                  <div className="user-card-actions">
                    <button
                      className="call-button"
                      onClick={() => handleVideoCallQuery(user.username)}
                      disabled={callingSessions.has(user.username)}
                    >
                      <Video size={18} />
                      {callingSessions.has(user.username)
                        ? 'Calling...'
                        : 'Start Video Call'}
                    </button>
                    <button
                      className="profile-button"
                      onClick={() => router.push(`/profile/${user.username}`)}
                    >
                      <User size={18} />
                      Profile
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
