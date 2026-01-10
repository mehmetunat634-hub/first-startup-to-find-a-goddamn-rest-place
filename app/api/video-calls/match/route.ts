import { NextRequest, NextResponse } from 'next/server'
import { getVideoSessionById, findWaitingSession, matchVideoSession, getUserById } from '@/app/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, userId } = body

    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'Session ID and User ID required' },
        { status: 400 }
      )
    }

    const session = getVideoSessionById(sessionId)
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // If already matched, return the other user's info and initiator flag
    if (session.status === 'active' && session.user2_id) {
      const otherUserId = session.user1_id === userId ? session.user2_id : session.user1_id
      const otherUser = getUserById(otherUserId)
      const initiator = session.user1_id === userId // user1 is the initiator
      return NextResponse.json({ matched: true, initiator, otherUser })
    }

    // If still waiting, look for other waiting sessions
    if (session.status === 'waiting') {
      const waitingSession = findWaitingSession(userId)
      if (waitingSession) {
        // Match with this session
        const matched = matchVideoSession(waitingSession.id, userId)
        const otherUser = getUserById(waitingSession.user1_id)
        const initiator = false // Current user is user2 (joiner), so not initiator
        return NextResponse.json({ matched: true, sessionId: waitingSession.id, initiator, otherUser })
      }
    }

    return NextResponse.json({ matched: false })
  } catch (error) {
    console.error('Error finding match:', error)
    return NextResponse.json(
      { error: 'Failed to find match' },
      { status: 500 }
    )
  }
}
