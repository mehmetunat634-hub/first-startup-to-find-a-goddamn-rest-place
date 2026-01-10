'use client'

import { useState } from 'react'

export default function VideoCall() {
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)

  return (
    <div className="video-call-main">
      <div className="video-display">
        <div className="video-placeholder">
          <div className="video-avatar">
            <span>👤</span>
          </div>
          <p className="video-status">Video Call Active</p>
        </div>
      </div>

      <div className="video-controls">
        <button
          className={`control-button ${isMuted ? 'active' : ''}`}
          onClick={() => setIsMuted(!isMuted)}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇' : '🎤'}
        </button>

        <button
          className={`control-button ${isVideoOff ? 'active' : ''}`}
          onClick={() => setIsVideoOff(!isVideoOff)}
          title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
        >
          {isVideoOff ? '📹' : '📷'}
        </button>

        <button
          className="control-button end-call"
          onClick={() => window.history.back()}
          title="End call"
        >
          📞
        </button>
      </div>
    </div>
  )
}
