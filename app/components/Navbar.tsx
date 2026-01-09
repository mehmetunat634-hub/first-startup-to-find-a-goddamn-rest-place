'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Newspaper, Compass, Settings, LogOut, User, Video } from 'lucide-react'

export default function Navbar() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [isPro, setIsPro] = useState(false)

  // Get username from localStorage on mount
  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      setUsername(userData.username)
      // Mock pro status - check if username exists in pro list or random
      const proUsers = ['mehmetunat634', 'john', 'jane']
      setIsPro(proUsers.includes(userData.username.toLowerCase()))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('isLoggedIn')
    router.push('/')
  }

  const handleSettings = () => {
    router.push('/settings')
  }

  const handleProfileClick = () => {
    if (username) {
      router.push(`/profile/${username}`)
    }
  }

  const handleVideoCall = () => {
    router.push('/video-call')
  }

  const handleFeed = () => {
    router.push('/feed')
  }

  const handleExplore = () => {
    // TODO: Implement explore page
    router.push('/explore')
  }

  return (
    <nav className="navbar">
      <div className="navbar-top">
        <div className="navbar-logo">instagram</div>

        <div className="navbar-links">
          <button className="navbar-link" onClick={handleExplore}>
            <Compass className="navbar-link-icon" size={24} />
            <span className="navbar-link-text">Explore</span>
          </button>
          <button className="navbar-link" onClick={handleFeed}>
            <Newspaper className="navbar-link-icon" size={24} />
            <span className="navbar-link-text">Feed</span>
          </button>
          <button className="navbar-link" onClick={handleVideoCall}>
            <Video className="navbar-link-icon" size={24} />
            <span className="navbar-link-text">Video Call</span>
          </button>
        </div>
      </div>

      <button className="navbar-profile" onClick={handleProfileClick}>
        <div className="profile-avatar">
          {username.charAt(0).toUpperCase()}
        </div>
        <div className="profile-info">
          <div className="profile-greeting">Hello</div>
          <div className="profile-username-row">
            <span className="profile-username">{username}</span>
            {isPro && <span className="pro-badge">Pro</span>}
          </div>
        </div>
      </button>

      <div className="navbar-bottom">
        <button
          className="navbar-settings"
          onClick={handleSettings}
          title="Settings"
        >
          <Settings className="settings-icon" size={20} />
          <span className="settings-text">Settings</span>
        </button>
        <button
          className="navbar-logout"
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut className="logout-icon" size={20} />
        </button>
      </div>
    </nav>
  )
}
