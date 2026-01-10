'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../components/Navbar'
import VideoCall from '../components/VideoCall'
import Chatbox from '../components/Chatbox'

export default function VideoCallPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Array<{ id: number; text: string; sender: string; timestamp: Date }>>([])

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    if (!isLoggedIn) {
      router.push('/')
    }
  }, [router])

  const handleSendMessage = (text: string) => {
    const newMessage = {
      id: Date.now(),
      text,
      sender: 'You',
      timestamp: new Date()
    }
    setMessages([...messages, newMessage])
  }

  return (
    <div className="home-container">
      <Navbar />
      <main className="home-main">
        <div className="video-call-container">
          <VideoCall />
          <Chatbox messages={messages} onSendMessage={handleSendMessage} />
        </div>
      </main>
    </div>
  )
}
