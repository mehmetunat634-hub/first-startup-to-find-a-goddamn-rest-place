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
  price?: number
  taggedUsers: string
  categoryTags: string
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
  const [refreshing, setRefreshing] = useState(false)
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [filteredPosts, setFilteredPosts] = useState<FeedPost[]>([])
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [username, setUsername] = useState('')
  const [userId, setUserId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [commentText, setCommentText] = useState<Record<string, string>>({})
  const [postComments, setPostComments] = useState<Record<string, any[]>>({})

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts?limit=50&offset=0')
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchPosts()
    setRefreshing(false)
  }

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
        setUserId(parsed.id)
      }

      // Fetch posts
      await fetchPosts()
      setIsLoggedIn(true)
      setLoading(false)
    }

    checkAuth()

    // Refetch posts every 5 seconds to catch newly published items
    const interval = setInterval(() => {
      fetchPosts()
    }, 5000)

    return () => clearInterval(interval)
  }, [router])

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        const data = await response.json()
        const newLikedPosts = new Set(likedPosts)

        if (data.isLiked) {
          newLikedPosts.add(postId)
        } else {
          newLikedPosts.delete(postId)
        }
        setLikedPosts(newLikedPosts)

        // Update the post likes in the UI
        setPosts(posts.map(post =>
          post.id === postId
            ? { ...post, likes: data.likeCount }
            : post
        ))
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
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

  const filterPosts = (query: string, allPosts: FeedPost[]) => {
    if (!query.trim()) {
      return allPosts
    }

    const lowerQuery = query.toLowerCase().trim()

    return allPosts.filter(post => {
      // Search for @username mentions
      if (lowerQuery.startsWith('@')) {
        const usernameQuery = lowerQuery.substring(1)
        const taggedUsers = parseTaggedUsers(post.taggedUsers)
        return taggedUsers.some(user => user.toLowerCase().includes(usernameQuery))
      }

      // Search for keywords in caption (split by spaces)
      const keywords = lowerQuery.split(/\s+/).filter(k => k.length > 0)
      const caption = (post.caption || '').toLowerCase()
      const creatorName = (post.user?.displayName || '').toLowerCase()

      // All keywords must be found in either caption or creator name
      return keywords.every(keyword =>
        caption.includes(keyword) || creatorName.includes(keyword)
      )
    })
  }

  // Update filtered posts whenever search query or posts change
  useEffect(() => {
    const filtered = filterPosts(searchQuery, posts)
    setFilteredPosts(filtered)
  }, [searchQuery, posts])

  const fetchCommentsForPost = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setPostComments({ ...postComments, [postId]: data.comments || [] })
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const toggleCommentsSection = async (postId: string) => {
    const newExpanded = new Set(expandedComments)
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId)
    } else {
      newExpanded.add(postId)
      // Fetch comments when expanding
      await fetchCommentsForPost(postId)
    }
    setExpandedComments(newExpanded)
  }

  const handleCommentSubmit = async (postId: string) => {
    const content = commentText[postId]?.trim()
    if (!content) {
      return
    }

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, content }),
      })

      if (response.ok) {
        // Clear input and refetch comments for this post
        setCommentText({ ...commentText, [postId]: '' })
        await fetchCommentsForPost(postId)
      } else {
        const error = await response.json()
        console.error('Error posting comment:', error.error)
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
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
          <div className="feed-controls">
            <div className="feed-search-container">
              <input
                type="text"
                placeholder="Search posts... (e.g., @username or keywords)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="feed-search-input"
              />
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="feed-refresh-button"
            >
              {refreshing ? 'Refreshing...' : '🔄 Refresh Feed'}
            </button>
          </div>

          {posts.length === 0 ? (
            <div className="feed-empty">
              <p>No posts yet. Start following users to see their posts!</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="feed-empty">
              <p>No posts match your search. Try different keywords or @usernames.</p>
            </div>
          ) : (
            <div className="feed-grid">
              {filteredPosts.map(post => (
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
                    {(() => {
                      const price = post.price ?? 0
                      return price > 0 ? (
                        <div className="post-buy-section">
                          <div className="buy-info">
                            <span className="video-price">${typeof price === 'number' ? price.toFixed(2) : '0.00'}</span>
                            <p className="buy-label">Exclusive Content</p>
                          </div>
                          <button className="buy-button">
                            🛒 Buy Video
                          </button>
                        </div>
                      ) : null
                    })()}
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

                  {/* Category Tags */}
                  {(() => {
                    try {
                      const tags = JSON.parse(post.categoryTags)
                      return tags.length > 0 ? (
                        <div className="post-category-tags">
                          <p className="category-label">#️⃣ Categories: </p>
                          <div className="category-tags-list">
                            {tags.map((tag: string) => (
                              <button
                                key={tag}
                                className="category-tag-link"
                                onClick={() => {
                                  // TODO: Implement tag search/filter
                                }}
                              >
                                #{tag}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null
                    } catch {
                      return null
                    }
                  })()}

                  {/* Post Comments Section */}
                  <div className="post-comments-section">
                    <button
                      className="view-comments-button"
                      onClick={() => toggleCommentsSection(post.id)}
                    >
                      View all {post.comments} {post.comments === 1 ? 'comment' : 'comments'}
                    </button>

                    {expandedComments.has(post.id) && (
                      <div className="comments-expanded">
                        {/* Display existing comments */}
                        <div className="comments-list">
                          {postComments[post.id]?.length ? (
                            postComments[post.id].map((comment: any) => (
                              <div key={comment.id} className="comment-item">
                                <div className="comment-user-info">
                                  <div className="comment-avatar">
                                    {comment.user?.displayName?.charAt(0).toUpperCase() || 'U'}
                                  </div>
                                  <div className="comment-details">
                                    <p className="comment-username">
                                      {comment.user?.displayName || 'Unknown'}
                                    </p>
                                    <p className="comment-time">
                                      {formatDate(comment.created_at)}
                                    </p>
                                  </div>
                                </div>
                                <p className="comment-content">{comment.content}</p>
                              </div>
                            ))
                          ) : (
                            <p className="no-comments">No comments yet</p>
                          )}
                        </div>

                        {/* Comment input */}
                        <div className="post-comment-input">
                          <input
                            type="text"
                            placeholder="Add a comment..."
                            value={commentText[post.id] || ''}
                            onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                            onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit(post.id)}
                            className="comment-input"
                          />
                          <button
                            onClick={() => handleCommentSubmit(post.id)}
                            className="post-button"
                          >
                            Post
                          </button>
                        </div>
                      </div>
                    )}
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
