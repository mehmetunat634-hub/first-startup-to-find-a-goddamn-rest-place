'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'

interface TaggedPost {
  id: string
  userId: string
  caption: string
  videoUrl: string
  thumbnailUrl: string | null
  price: number
  taggedUsers: string
  categoryTags: string
  likes: number
  comments: number
  createdAt: string
  user?: {
    username: string
    displayName: string
  }
}

interface LastSeenPostsSectionProps {
  userId: string
  username: string
}

export default function LastSeenPostsSection({ userId, username }: LastSeenPostsSectionProps) {
  const router = useRouter()
  const [posts, setPosts] = useState<TaggedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchTaggedPosts = async () => {
      try {
        const response = await fetch(`/api/video-calls/posts/tagged/${userId}`)
        if (response.ok) {
          const data = await response.json()
          setPosts(data.posts || [])
        }
      } catch (error) {
        console.error('Error fetching tagged posts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTaggedPosts()
  }, [userId])

  const handleLike = (postId: string) => {
    const newLikedPosts = new Set(likedPosts)
    if (newLikedPosts.has(postId)) {
      newLikedPosts.delete(postId)
    } else {
      newLikedPosts.add(postId)
    }
    setLikedPosts(newLikedPosts)
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

  if (loading) {
    return (
      <section className="last-seen-posts-section">
        <h2>Last Seen Posts</h2>
        <div>Loading...</div>
      </section>
    )
  }

  if (posts.length === 0) {
    return (
      <section className="last-seen-posts-section">
        <h2>Last Seen Posts</h2>
        <div className="empty-state">
          <p>No posts yet where you&apos;ve been tagged</p>
        </div>
      </section>
    )
  }

  return (
    <section className="last-seen-posts-section">
      <h2>Last Seen Posts</h2>
      <div className="last-seen-posts-grid">
        {posts.map(post => (
          <div key={post.id} className="last-seen-post-card">
            <div className="post-thumbnail">
              <video
                src={post.videoUrl}
                poster={post.thumbnailUrl || undefined}
                className="thumbnail-video"
                onMouseEnter={(e) => e.currentTarget.play()}
                onMouseLeave={(e) => {
                  e.currentTarget.pause()
                  e.currentTarget.currentTime = 0
                }}
              />
              <div className="post-overlay">
                <button
                  className="like-button"
                  onClick={() => handleLike(post.id)}
                  title="Like"
                >
                  <Heart
                    size={20}
                    fill={likedPosts.has(post.id) ? 'currentColor' : 'none'}
                    color={likedPosts.has(post.id) ? '#e74c3c' : 'white'}
                  />
                </button>
              </div>
            </div>

            <div className="post-info">
              <div className="post-header">
                <button
                  className="post-creator-link"
                  onClick={() => router.push(`/profile/${post.user?.username}`)}
                >
                  <strong>{post.user?.displayName}</strong>
                </button>
                <span className="post-time">{formatDate(post.createdAt)}</span>
              </div>

              {post.caption && <p className="post-caption-text">{post.caption.substring(0, 100)}...</p>}

              <div className="post-stats">
                <span>{post.likes} likes</span>
                {post.price > 0 && <span className="post-price">${post.price.toFixed(2)}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
