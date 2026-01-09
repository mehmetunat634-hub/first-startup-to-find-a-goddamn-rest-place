'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { Heart, MessageCircle, Share2 } from 'lucide-react'

interface UserInfo {
  id: string
  username: string
  displayName: string
  email: string
  bio: string
  firstName: string
  lastName: string
}

interface FeedPost {
  id: string
  userId: string
  caption: string
  videoUrl: string
  thumbnailUrl: string | null
  price: number
  taggedUsers: string
  likes: number
  comments: number
  createdAt: string
  updatedAt: string
  user?: UserInfo
}

export default function FeedPage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [username, setUsername] = useState('')

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
        setUsername(parsed.username)
      }

      // Fetch posts
      try {
        const response = await fetch('/api/posts?limit=50&offset=0')
        if (response.ok) {
          const data = await response.json()
          setPosts(data.posts)
        }
      } catch (error) {
        console.error('Error fetching posts:', error)
      }

      setIsLoggedIn(true)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handleLike = (postId: string) => {
    const newLikedPosts = new Set(likedPosts)
    if (newLikedPosts.has(postId)) {
      newLikedPosts.delete(postId)
    } else {
      newLikedPosts.add(postId)
    }
    setLikedPosts(newLikedPosts)

    // Update the post likes in the UI
    setPosts(posts.map(post =>
      post.id === postId
        ? { ...post, likes: newLikedPosts.has(postId) ? post.likes + 1 : post.likes - 1 }
        : post
    ))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSecs < 60) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString()
  }

  const parseTaggedUsers = (taggedUsersJson: string) => {
    try {
      return JSON.parse(taggedUsersJson) as string[]
    } catch {
      return []
    }
  }

  if (!isLoggedIn || loading) {
    return (
      <div className="home-container">
        <Navbar />
        <main className="home-main">
          <div className="feed-loading">Loading feed...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="home-container">
      <Navbar />
      <main className="home-main">
        <div className="feed-container">
          {posts.length === 0 ? (
            <div className="feed-empty">
              <p>No posts yet. Start following users to see their posts!</p>
            </div>
          ) : (
            <div className="feed-grid">
              {posts.map(post => (
                <article key={post.id} className="feed-post">
                  {/* Post Header */}
                  <div className="post-header">
                    <div className="post-user-info">
                      <div className="post-avatar">
                        {post.user?.displayName.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="post-user-details">
                        <p className="post-username">
                          <button
                            className="username-link"
                            onClick={() => router.push(`/profile/${post.user?.username}`)}
                          >
                            {post.user?.displayName || 'Unknown'}
                          </button>
                        </p>
                        <p className="post-time">{formatDate(post.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Post Video */}
                  <div className="post-video-container">
                    <video
                      src={post.videoUrl}
                      poster={post.thumbnailUrl || undefined}
                      controls
                      className="post-video"
                      style={{ width: '100%', display: 'block' }}
                    />
                    {post.price > 0 && (
                      <div className="post-buy-section">
                        <div className="buy-info">
                          <span className="video-price">${post.price.toFixed(2)}</span>
                          <p className="buy-label">Exclusive Content</p>
                        </div>
                        <button className="buy-button">
                          🛒 Buy Video
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Post Actions */}
                  <div className="post-actions">
                    <button
                      className={`action-button ${likedPosts.has(post.id) ? 'liked' : ''}`}
                      onClick={() => handleLike(post.id)}
                      title="Like"
                    >
                      <Heart size={24} fill={likedPosts.has(post.id) ? 'currentColor' : 'none'} />
                    </button>
                    <button className="action-button" title="Comment">
                      <MessageCircle size={24} />
                    </button>
                    <button className="action-button" title="Share">
                      <Share2 size={24} />
                    </button>
                  </div>

                  {/* Post Stats */}
                  <div className="post-stats">
                    <p className="likes-count">
                      <strong>{post.likes}</strong> {post.likes === 1 ? 'like' : 'likes'}
                    </p>
                  </div>

                  {/* Post Caption */}
                  {post.caption && (
                    <div className="post-caption">
                      <p>
                        <button
                          className="caption-username"
                          onClick={() => router.push(`/profile/${post.user?.username}`)}
                        >
                          {post.user?.displayName}
                        </button>
                        {' '}{post.caption}
                      </p>
                    </div>
                  )}

                  {/* Tagged Users */}
                  {parseTaggedUsers(post.taggedUsers).length > 0 && (
                    <div className="post-tagged-users">
                      <p className="tagged-label">👥 Tagged: </p>
                      <div className="tagged-users-list">
                        {parseTaggedUsers(post.taggedUsers).map((username) => (
                          <button
                            key={username}
                            className="tagged-user-link"
                            onClick={() => router.push(`/profile/${username}`)}
                          >
                            @{username}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Post Comments Section */}
                  <div className="post-comments-section">
                    <p className="view-comments">
                      View all {post.comments} {post.comments === 1 ? 'comment' : 'comments'}
                    </p>
                    <div className="post-comment-input">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        className="comment-input"
                      />
                      <button className="post-button">Post</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
