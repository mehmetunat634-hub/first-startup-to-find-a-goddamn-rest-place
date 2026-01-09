'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar'
import { ArrowLeft, MapPin, Link as LinkIcon, Calendar } from 'lucide-react'

interface UserProfile {
  username: string
  displayName: string
  firstName: string
  lastName: string
  bio: string
  location: string
  website: string
  joinDate: string
  followers: number
  following: number
  posts: number
  avatar: string
  coverImage: string
}

// Mock user data
const mockProfiles: { [key: string]: UserProfile } = {
  john: {
    username: 'john',
    displayName: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    bio: 'Photography enthusiast and coffee lover ☕📸',
    location: 'New York, USA',
    website: 'https://johndoe.com',
    joinDate: 'March 2021',
    followers: 1250,
    following: 345,
    posts: 87,
    avatar: 'J',
    coverImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  jane: {
    username: 'jane',
    displayName: 'Jane Smith',
    firstName: 'Jane',
    lastName: 'Smith',
    bio: 'Designer | Traveler | Coffee addict',
    location: 'Los Angeles, CA',
    website: 'https://janesmith.design',
    joinDate: 'June 2020',
    followers: 5432,
    following: 234,
    posts: 234,
    avatar: 'J',
    coverImage: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  alex: {
    username: 'alex',
    displayName: 'Alex Johnson',
    firstName: 'Alex',
    lastName: 'Johnson',
    bio: 'Tech & lifestyle content creator',
    location: 'San Francisco, CA',
    website: 'https://alexjohnson.tech',
    joinDate: 'January 2019',
    followers: 8900,
    following: 567,
    posts: 456,
    avatar: 'A',
    coverImage: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
  mehmetunat634: {
    username: 'mehmetunat634',
    displayName: 'Mehmet Ünal',
    firstName: 'Mehmet',
    lastName: 'Ünal',
    bio: 'Developer | Coffee enthusiast | Open source contributor',
    location: 'Istanbul, Turkey',
    website: 'https://mehmetunal.dev',
    joinDate: 'April 2020',
    followers: 3200,
    following: 456,
    posts: 234,
    avatar: 'M',
    coverImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  sarah: {
    username: 'sarah',
    displayName: 'Sarah Wilson',
    firstName: 'Sarah',
    lastName: 'Wilson',
    bio: 'Fashion blogger | Style guru 👗',
    location: 'London, UK',
    website: 'https://sarahwilson.style',
    joinDate: 'February 2021',
    followers: 12400,
    following: 789,
    posts: 567,
    avatar: 'S',
    coverImage: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  },
  mike: {
    username: 'mike',
    displayName: 'Mike Chen',
    firstName: 'Mike',
    lastName: 'Chen',
    bio: 'Food & travel vlogger 🍕✈️',
    location: 'Tokyo, Japan',
    website: 'https://mikechen.food',
    joinDate: 'August 2019',
    followers: 45600,
    following: 234,
    posts: 789,
    avatar: 'M',
    coverImage: 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)',
  },
  emma: {
    username: 'emma',
    displayName: 'Emma Davis',
    firstName: 'Emma',
    lastName: 'Davis',
    bio: 'Fitness coach | Wellness advocate 💪',
    location: 'Sydney, Australia',
    website: 'https://emmadavis.fitness',
    joinDate: 'May 2020',
    followers: 8700,
    following: 342,
    posts: 423,
    avatar: 'E',
    coverImage: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  },
}

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const loggedIn = localStorage.getItem('isLoggedIn')
    if (!loggedIn) {
      router.push('/')
      return
    }
    setIsLoggedIn(true)

    // Simulate fetching profile data
    const username = params.username as string
    const usernameWithoutAt = username.replace('@', '')

    // Simulate API call delay
    setTimeout(() => {
      const mockProfile =
        mockProfiles[usernameWithoutAt.toLowerCase()] ||
        {
          username: usernameWithoutAt,
          displayName: usernameWithoutAt.charAt(0).toUpperCase() + usernameWithoutAt.slice(1),
          firstName: usernameWithoutAt.charAt(0).toUpperCase() + usernameWithoutAt.slice(1),
          lastName: 'User',
          bio: 'Instagram user',
          location: 'Earth',
          website: `https://${usernameWithoutAt}.com`,
          joinDate: 'Unknown',
          followers: Math.floor(Math.random() * 10000),
          following: Math.floor(Math.random() * 1000),
          posts: Math.floor(Math.random() * 500),
          avatar: usernameWithoutAt.charAt(0).toUpperCase(),
          coverImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }

      setProfile(mockProfile)
      setLoading(false)
    }, 500)
  }, [params.username, router])

  if (!isLoggedIn || loading) {
    return (
      <div className="home-container">
        <Navbar />
        <main className="home-main">
          <div className="profile-loading">Loading profile...</div>
        </main>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="home-container">
        <Navbar />
        <main className="home-main">
          <div className="profile-error">Profile not found</div>
        </main>
      </div>
    )
  }

  return (
    <div className="home-container">
      <Navbar />
      <main className="home-main">
        <div className="profile-container">
          {/* Profile Header */}
          <div className="profile-header">
            <button className="back-button" onClick={() => router.back()}>
              <ArrowLeft size={24} />
            </button>
            <div className="profile-header-info">
              <h2>{profile.displayName}</h2>
              <p className="profile-header-username">@{profile.username}</p>
            </div>
          </div>

          {/* Profile Info */}
          <div className="profile-content">
            {/* Avatar and Basic Info */}
            <div className="profile-top-section">
              <div className="profile-avatar-large">
                {profile.avatar}
              </div>
              <div className="profile-stats">
                <div className="stat">
                  <div className="stat-number">{profile.posts}</div>
                  <div className="stat-label">Posts</div>
                </div>
                <div className="stat">
                  <div className="stat-number">{profile.followers.toLocaleString()}</div>
                  <div className="stat-label">Followers</div>
                </div>
                <div className="stat">
                  <div className="stat-number">{profile.following}</div>
                  <div className="stat-label">Following</div>
                </div>
              </div>
            </div>

            {/* User Details */}
            <div className="profile-details">
              <div className="profile-name-row">
                <div className="profile-name-item">
                  <span className="profile-label">First Name</span>
                  <span className="profile-name-value">{profile.firstName}</span>
                </div>
                <div className="profile-name-item">
                  <span className="profile-label">Last Name</span>
                  <span className="profile-name-value">{profile.lastName}</span>
                </div>
              </div>

              <h1 className="profile-display-name">{profile.displayName}</h1>
              <p className="profile-username">@{profile.username}</p>

              <p className="profile-bio">{profile.bio}</p>

              <div className="profile-meta">
                <div className="meta-item">
                  <MapPin size={18} />
                  <span>{profile.location}</span>
                </div>
                <div className="meta-item">
                  <LinkIcon size={18} />
                  <a href={profile.website} target="_blank" rel="noopener noreferrer">
                    {profile.website}
                  </a>
                </div>
                <div className="meta-item">
                  <Calendar size={18} />
                  <span>Joined {profile.joinDate}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="profile-actions">
              <button className="action-button primary">Follow</button>
            </div>

            {/* Posts Section */}
            <div className="profile-posts">
              <h3 className="posts-title">Last Seen Posts</h3>
              <div className="posts-grid">
                {[1, 2, 3, 4, 5, 6].map((post) => (
                  <div key={post} className="post-card">
                    <div className="post-card-content">
                      <div
                        style={{
                          background: `linear-gradient(135deg, hsl(${
                            post * 60
                          }, 70%, 60%) 0%, hsl(${post * 60 + 30}, 70%, 50%) 100%)`,
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold' }}>
                          Post {post}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
