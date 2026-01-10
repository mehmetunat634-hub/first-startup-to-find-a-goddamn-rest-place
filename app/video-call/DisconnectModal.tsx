'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface DisconnectModalProps {
  isOpen: boolean
  pendingItemId: string
  onClose: () => void
  onSave: (data: { title: string; description: string; price: number; categoryTags: string }) => Promise<void>
}

export default function DisconnectModal({
  isOpen,
  pendingItemId,
  onClose,
  onSave,
}: DisconnectModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [categoryTags, setCategoryTags] = useState('')
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

    // Parse category tags (split by comma and clean)
    const tags = categoryTags
      .split(',')
      .map(tag => tag.trim().toLowerCase().replace(/^#/, ''))
      .filter(tag => tag.length > 0)
    const tagsJson = JSON.stringify(tags)

    setSaving(true)
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        categoryTags: tagsJson,
      })
      // Reset form on success
      setTitle('')
      setDescription('')
      setPrice('')
      setCategoryTags('')
    } catch (err) {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Complete Your Recording</h2>
          <button
            onClick={onClose}
            className="modal-close"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-subtitle">
            The call has ended and your recording is ready. Fill in the details below to complete the process.
          </p>

          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              placeholder="Give your recording a title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              maxLength={100}
            />
            <small className="form-help">{title.length}/100</small>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              placeholder="Describe what this recording is about"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input"
              rows={4}
              maxLength={500}
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
            />
            <small className="form-help">
              Enter tags separated by commas (e.g., #gaming, #tutorial). These help users find your content.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="price">Price ($) *</label>
            <input
              id="price"
              type="number"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="form-input"
              min="0"
              step="0.01"
            />
            <small className="form-help">
              This will be split 50/50 between both users
            </small>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-info">
            <p>
              💡 <strong>Note:</strong> Your other user will also need to approve these details before it can be published.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button
            onClick={onClose}
            className="btn btn-secondary"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary"
            disabled={saving || !title.trim() || !description.trim() || !price}
          >
            {saving ? 'Saving...' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
