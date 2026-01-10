'use client'

import { useState } from 'react'
import { X, Edit2, Eye } from 'lucide-react'

interface PendingItemDetailModalProps {
  isOpen: boolean
  item: {
    id: string
    title: string | null
    description: string | null
    price: number | null
    categoryTags: string
    user1_id: string
    user2_id: string
    user1_status: 'pending' | 'approved' | 'rejected'
    user2_status: 'pending' | 'approved' | 'rejected'
  }
  currentUserId: string
  onClose: () => void
  onSave: (data: { title: string; description: string; price: number; categoryTags: string }) => Promise<void>
}

export default function PendingItemDetailModal({
  isOpen,
  item,
  currentUserId,
  onClose,
  onSave,
}: PendingItemDetailModalProps) {
  const isUser1 = item.user1_id === currentUserId
  const isUser2 = item.user2_id === currentUserId
  const canEdit = isUser1 && item.user1_status === 'pending'
  const canApproveAsUser2 = isUser2 && item.user1_status === 'approved' && item.user2_status === 'pending'
  const [title, setTitle] = useState(item.title || '')
  const [description, setDescription] = useState(item.description || '')
  const [price, setPrice] = useState(item.price?.toString() || '')
  const [categoryTags, setCategoryTags] = useState(() => {
    try {
      const tags = JSON.parse(item.categoryTags || '[]')
      return tags.join(', ')
    } catch {
      return ''
    }
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setError('')

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    if (!description.trim()) {
      setError('Description is required')
      return
    }

    if (!price || isNaN(Number(price)) || Number(price) < 0) {
      setError('Please enter a valid price')
      return
    }

    setSaving(true)
    try {
      // Parse category tags
      const tags = categoryTags
        .split(',')
        .map((tag: string) => tag.trim().toLowerCase().replace(/^#/, ''))
        .filter((tag: string) => tag.length > 0)
      const tagsJson = JSON.stringify(tags)

      await onSave({
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        categoryTags: tagsJson,
      })
      onClose()
    } catch (err) {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleApproveAsUser2 = async () => {
    setError('')
    setSaving(true)
    try {
      // Call with empty data but set user2_status to approved
      const response = await fetch(`/api/video-calls/pending-items/${item.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user2_status: 'approved',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to approve')
      }

      onClose()
    } catch (err) {
      setError('Failed to approve. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{canEdit ? 'Complete Details' : 'View Details'}</h2>
          <button onClick={onClose} className="modal-close" aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {!canEdit && !isUser1 && !canApproveAsUser2 && (
            <div className="modal-info modal-warning">
              <p>
                ℹ️ <strong>Note:</strong> Only the person who recorded can edit these details. You can view the information but cannot make changes.
              </p>
            </div>
          )}

          {canApproveAsUser2 && (
            <div className="modal-info modal-success">
              <p>
                ℹ️ <strong>Review & Approve:</strong> The other user has submitted the details. Please review and approve to proceed with publishing.
              </p>
            </div>
          )}

          {!canEdit && isUser1 && (
            <div className="modal-info modal-success">
              <p>
                ✅ <strong>Already Approved:</strong> You&apos;ve already submitted your details. Waiting for the other user&apos;s approval.
              </p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              placeholder="Give your recording a title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              maxLength={100}
              disabled={!canEdit}
            />
            <small className="form-help">{title.length}/100</small>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              placeholder="Describe what this recording is about"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input"
              rows={4}
              maxLength={500}
              disabled={!canEdit}
            />
            <small className="form-help">{description.length}/500</small>
          </div>

          <div className="form-group">
            <label htmlFor="categoryTags">Category Tags (Optional)</label>
            <input
              id="categoryTags"
              type="text"
              placeholder="e.g., gaming, entertainment, tutorial"
              value={categoryTags}
              onChange={(e) => setCategoryTags(e.target.value)}
              className="form-input"
              maxLength={200}
              disabled={!canEdit}
            />
            <small className="form-help">
              Enter tags separated by commas (e.g., #gaming, #tutorial). Users can find your content by these tags.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="price">Price ($)</label>
            <input
              id="price"
              type="number"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="form-input"
              min="0"
              step="0.01"
              disabled={!canEdit}
            />
            <small className="form-help">This will be split 50/50 between both users</small>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-approval-status">
            <h3 className="approval-title">Approval Status</h3>
            <div className="approval-status-grid">
              <div className="approval-status-item">
                <span className="approval-status-label">Your Status:</span>
                <span className={`approval-status-badge approval-${item.user1_status}`}>
                  {item.user1_status === 'pending' ? 'Not Yet Approved' : item.user1_status}
                </span>
              </div>
              <div className="approval-status-item">
                <span className="approval-status-label">Other User:</span>
                <span className={`approval-status-badge approval-${item.user2_status}`}>
                  {item.user2_status === 'pending' ? 'Pending' : item.user2_status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary" disabled={saving}>
            {canEdit ? 'Cancel' : 'Close'}
          </button>
          {canEdit && (
            <button
              onClick={handleSave}
              className="btn btn-primary"
              disabled={saving || !title.trim() || !description.trim() || !price}
            >
              {saving ? 'Saving...' : 'Save & Submit'}
            </button>
          )}
          {canApproveAsUser2 && (
            <button
              onClick={handleApproveAsUser2}
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Approving...' : 'Approve'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
