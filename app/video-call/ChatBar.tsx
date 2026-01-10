'use client'

import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { Message } from '@/app/lib/db'

interface ChatBarProps {
  sessionId: string
  userId: string
  remoteUserDisplayName: string
}

export default function ChatBar({
  sessionId,
  userId,
  remoteUserDisplayName,
}: ChatBarProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch messages every second
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/video-calls/messages/${sessionId}`)
        if (response.ok) {
          const data = await response.json()
          setMessages(data)
        }
      } catch (error) {
        console.error('Error fetching messages:', error)
      }
    }

    fetchMessages()
    const interval = setInterval(fetchMessages, 1000)
    return () => clearInterval(interval)
  }, [sessionId])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    setLoading(true)
    try {
      await fetch('/api/video-calls/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userId,
          content: inputValue,
        }),
      })
      setInputValue('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="chat-bar">
      <div className="messages-list">
        {messages.length === 0 ? (
          <div className="messages-empty">No messages yet</div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`message ${msg.from_user_id === userId ? 'sent' : 'received'}`}
            >
              <div className="message-header">
                <span className="sender">
                  {msg.from_user_id === userId ? 'You' : remoteUserDisplayName}
                </span>
                <span className="time">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="message-content">{msg.content}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="message-input">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={loading}
        />
        <button onClick={handleSendMessage} disabled={loading} title="Send message">
          <Send size={20} />
        </button>
      </div>
    </div>
  )
}
