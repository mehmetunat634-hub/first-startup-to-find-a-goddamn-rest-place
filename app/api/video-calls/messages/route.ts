import { NextRequest, NextResponse } from 'next/server'
import { createMessage, getVideoSessionById } from '@/app/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, content } = body

    if (!sessionId || !content) {
      return NextResponse.json(
        { error: 'Session ID and content required' },
        { status: 400 }
      )
    }

    // Get session to extract user IDs - we'll get fromUserId from request headers or client
    const session = getVideoSessionById(sessionId)
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // For now, we need to get userId from the request body since we don't have auth middleware
    const { userId } = body
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    // Determine the other user ID
    const toUserId = session.user1_id === userId ? session.user2_id : session.user1_id
    if (!toUserId) {
      return NextResponse.json(
        { error: 'Session not active' },
        { status: 400 }
      )
    }

    // Create the message
    const message = createMessage(sessionId, userId, toUserId, content)

    return NextResponse.json(message)
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    )
  }
}
