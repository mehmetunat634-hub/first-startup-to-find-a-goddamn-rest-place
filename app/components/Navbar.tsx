'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const router = useRouter()
  const [username, setUsername] = useState('')

  // Get username from localStorage on mount
  useState(() => {
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      setUsername(userData.username)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('isLoggedIn')
    router.push('/')
  }

  const handleSettings = () => {
    alert('Settings page coming soon!')
  }

  return (
    <nav className="navbar">
      <div className="navbar-top">
        <div className="navbar-logo">instagram</div>

        <div className="navbar-links">
          <a href="#" className="navbar-link">
            <span className="navbar-link-icon">🏠</span>
            <span className="navbar-link-text">Feed</span>
          </a>
          <a href="#" className="navbar-link">
            <span className="navbar-link-icon">🔍</span>
            <span className="navbar-link-text">Explore</span>
          </a>
        </div>
      </div>

      <div className="navbar-bottom">
        <button
          className="navbar-settings"
          onClick={handleSettings}
          title="Settings"
        >
          <span className="settings-icon">⚙️</span>
          <span className="settings-text">Settings</span>
        </button>
        <button
          className="navbar-logout"
          onClick={handleLogout}
          title="Logout"
        >
          <span className="logout-icon">🚪</span>
        </button>
      </div>
    </nav>
  )
}
