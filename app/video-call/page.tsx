'use client'

import { Suspense } from 'react'
import VideoCallContent from './content'

export const dynamic = 'force-dynamic'

function VideoCallPageLoadingFallback() {
  return (
    <div className="home-container">
      <main className="home-main">
        <div className="profile-loading">Loading video call...</div>
      </main>
    </div>
  )
}

export default function VideoCallPage() {
  return (
    <Suspense fallback={<VideoCallPageLoadingFallback />}>
      <VideoCallContent />
    </Suspense>
  )
}
