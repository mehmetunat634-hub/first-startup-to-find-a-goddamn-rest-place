'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { ArrowLeft, Bell, Lock, User, Eye, Trash2 } from 'lucide-react'

interface UserProfile {
  username: string
  email: string
  displayName: string
  firstName: string
  lastName: string
  avatar: string
  bio: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    privacyPublic: true,
    allowMessages: true,
  })

  useEffect(() => {
    // Check if user is logged in
    const loggedIn = localStorage.getItem('isLoggedIn')
    if (!loggedIn) {
      router.push('/')
      return
    }
    setIsLoggedIn(true)

    // Fetch user data from localStorage and API
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsed = JSON.parse(userData)
      setUser({
        username: parsed.username,
        email: parsed.email || `${parsed.username}@instagram.com`,
        displayName: parsed.displayName || parsed.username.charAt(0).toUpperCase() + parsed.username.slice(1),
        firstName: parsed.firstName || parsed.displayName || parsed.username.charAt(0).toUpperCase() + parsed.username.slice(1),
        lastName: parsed.lastName || 'User',
        avatar: parsed.username.charAt(0).toUpperCase(),
        bio: parsed.bio || 'Instagram user',
      })
    }

    setLoading(false)
  }, [router])

  if (!isLoggedIn || loading) {
    return (
      <div className="home-container">
        <Navbar />
        <main className="home-main">
          <div className="profile-loading">Loading settings...</div>
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="home-container">
        <Navbar />
        <main className="home-main">
          <div className="profile-error">User data not found</div>
        </main>
      </div>
    )
  }

  const handleSettingChange = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleUsernameClick = () => {
    router.push(`/profile/${user.username}`)
  }

  const handleSaveChanges = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/users/${user.username}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: user.displayName,
          firstName: user.firstName,
          lastName: user.lastName,
          bio: user.bio,
        }),
      })

      if (!response.ok) {
        alert('Failed to save changes')
        return
      }

      const updatedUser = await response.json()
      localStorage.setItem('user', JSON.stringify(updatedUser))
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('An error occurred while saving settings')
    }
  }

  return (
    <div className="home-container">
      <Navbar />
      <main className="home-main">
        <div className="profile-container">
          {/* Settings Header */}
          <div className="profile-header">
            <button className="back-button" onClick={() => router.back()}>
              <ArrowLeft size={24} />
            </button>
            <div className="profile-header-info">
              <h2>Settings</h2>
              <p className="profile-header-username">Manage your account</p>
            </div>
          </div>

          {/* Settings Content */}
          <div className="settings-content">
            {/* User Info Section */}
            <div className="settings-section">
              <h3 className="settings-section-title">Account Information</h3>
              <div className="settings-user-profile">
                <div className="settings-avatar-section">
                  <div className="settings-avatar-large">
                    {user.avatar}
                  </div>
                </div>
                <div className="settings-user-info">
                  <div className="settings-user-item">
                    <span className="settings-label">Display Name</span>
                    <button
                      className="settings-user-link"
                      onClick={handleUsernameClick}
                    >
                      {user.displayName}
                    </button>
                  </div>
                  <div className="settings-user-item">
                    <span className="settings-label">Username</span>
                    <button
                      className="settings-user-link"
                      onClick={handleUsernameClick}
                    >
                      @{user.username}
                    </button>
                  </div>
                  <div className="settings-user-item">
                    <span className="settings-label">Email</span>
                    <span className="settings-value">{user.email}</span>
                  </div>
                </div>
              </div>
              <div className="settings-user-details">
                <div className="settings-details-row">
                  <div className="settings-user-item">
                    <span className="settings-label">First Name</span>
                    <input
                      type="text"
                      value={user.firstName}
                      onChange={(e) => setUser({ ...user, firstName: e.target.value })}
                      className="settings-input"
                    />
                  </div>
                  <div className="settings-user-item">
                    <span className="settings-label">Last Name</span>
                    <input
                      type="text"
                      value={user.lastName}
                      onChange={(e) => setUser({ ...user, lastName: e.target.value })}
                      className="settings-input"
                    />
                  </div>
                </div>
                <div className="settings-user-item">
                  <span className="settings-label">Bio</span>
                  <textarea
                    value={user.bio}
                    onChange={(e) => setUser({ ...user, bio: e.target.value })}
                    className="settings-textarea"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="settings-section">
              <h3 className="settings-section-title">
                <Lock size={20} />
                Privacy & Safety
              </h3>
              <div className="settings-list">
                <div className="settings-item">
                  <div className="settings-item-info">
                    <p className="settings-item-title">Private Account</p>
                    <p className="settings-item-description">
                      Only approved followers can see your posts
                    </p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={!settings.privacyPublic}
                      onChange={() => handleSettingChange('privacyPublic')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="settings-item">
                  <div className="settings-item-info">
                    <p className="settings-item-title">Allow Messages</p>
                    <p className="settings-item-description">
                      Allow anyone to send you direct messages
                    </p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.allowMessages}
                      onChange={() => handleSettingChange('allowMessages')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="settings-section">
              <h3 className="settings-section-title">
                <Bell size={20} />
                Notifications
              </h3>
              <div className="settings-list">
                <div className="settings-item">
                  <div className="settings-item-info">
                    <p className="settings-item-title">Email Notifications</p>
                    <p className="settings-item-description">
                      Receive email updates about your account
                    </p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={() => handleSettingChange('emailNotifications')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="settings-item">
                  <div className="settings-item-info">
                    <p className="settings-item-title">Push Notifications</p>
                    <p className="settings-item-description">
                      Receive push notifications on your device
                    </p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.pushNotifications}
                      onChange={() => handleSettingChange('pushNotifications')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="settings-section danger">
              <h3 className="settings-section-title">Danger Zone</h3>
              <div className="settings-list">
                <button className="settings-danger-button">
                  <Trash2 size={20} />
                  <span>Delete Account</span>
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="settings-actions">
              <button className="action-button primary" onClick={handleSaveChanges}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
