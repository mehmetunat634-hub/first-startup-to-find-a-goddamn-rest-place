'use client'

import { useEffect, useState } from 'react'
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface PendingItem {
  id: string
  session_id: string
  user1_id: string
  user2_id: string
  recording_path: string
  title: string | null
  description: string | null
  price: number | null
  user1_status: 'pending' | 'approved' | 'rejected'
  user2_status: 'pending' | 'approved' | 'rejected'
  publish_platform: string | null
  published_post_id: string | null
  created_at: string
  updated_at: string
}

interface PendingItemsSectionProps {
  userId: string
  username: string
}

export default function PendingItemsSection({ userId, username }: PendingItemsSectionProps) {
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<PendingItem | null>(null)

  useEffect(() => {
    const fetchPendingItems = async () => {
      try {
        const response = await fetch(`/api/video-calls/pending-items/user/${userId}`)
        if (response.ok) {
          const data = await response.json()
          setPendingItems(data.pendingItems || [])
        }
      } catch (error) {
        console.error('Error fetching pending items:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPendingItems()
  }, [userId])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={16} className="status-icon-approved" />
      case 'rejected':
        return <XCircle size={16} className="status-icon-rejected" />
      case 'pending':
        return <Clock size={16} className="status-icon-pending" />
      default:
        return <AlertCircle size={16} className="status-icon-pending" />
    }
  }

  const getStatusText = (user1Status: string, user2Status: string) => {
    if (user1Status === 'approved' && user2Status === 'approved') {
      return 'Both Approved'
    } else if (user1Status === 'rejected' || user2Status === 'rejected') {
      return 'Rejected'
    } else {
      return 'Awaiting Approval'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <section className="pending-items-section">
        <h2 className="section-title">Pending Items</h2>
        <div className="loading-spinner">Loading...</div>
      </section>
    )
  }

  if (pendingItems.length === 0) {
    return (
      <section className="pending-items-section">
        <h2 className="section-title">Pending Items</h2>
        <div className="empty-state">
          <AlertCircle size={48} />
          <p>No pending items yet</p>
          <p className="small-text">When you complete a video call, a pending item will appear here</p>
        </div>
      </section>
    )
  }

  return (
    <section className="pending-items-section">
      <h2 className="section-title">Pending Items ({pendingItems.length})</h2>

      <div className="pending-items-grid">
        {pendingItems.map((item) => {
          const isUser1 = item.user1_id === userId
          const userStatus = isUser1 ? item.user1_status : item.user2_status
          const otherUserStatus = isUser1 ? item.user2_status : item.user1_status

          return (
            <div
              key={item.id}
              className="pending-item-card"
              onClick={() => setSelectedItem(item)}
            >
              <div className="pending-item-header">
                <h3 className="pending-item-title">
                  {item.title || 'Untitled Recording'}
                </h3>
                <div className="pending-item-status">
                  {getStatusIcon(userStatus)}
                  <span className="status-text">{getStatusText(item.user1_status, item.user2_status)}</span>
                </div>
              </div>

              {item.description && (
                <p className="pending-item-description">{item.description}</p>
              )}

              <div className="pending-item-meta">
                {item.price !== null && (
                  <div className="meta-item">
                    <span className="meta-label">Price:</span>
                    <span className="meta-value">${item.price.toFixed(2)}</span>
                  </div>
                )}
                <div className="meta-item">
                  <span className="meta-label">Created:</span>
                  <span className="meta-value">{formatDate(item.created_at)}</span>
                </div>
              </div>

              <div className="pending-item-approval">
                <div className="approval-user">
                  <span className="approval-label">Your Status:</span>
                  <span className={`approval-badge approval-${userStatus}`}>
                    {userStatus === 'pending' ? 'Not Approved' : userStatus}
                  </span>
                </div>
                <div className="approval-user">
                  <span className="approval-label">Other User:</span>
                  <span className={`approval-badge approval-${otherUserStatus}`}>
                    {otherUserStatus === 'pending' ? 'Pending' : otherUserStatus}
                  </span>
                </div>
              </div>

              <button className="pending-item-action">
                {userStatus === 'pending' ? 'Complete Details' : 'View Details'}
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
