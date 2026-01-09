import { NextRequest, NextResponse } from 'next/server'
import { endVideoSession, deleteVideoSignals, getVideoSessionById } from '@/app/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }

    const session = getVideoSessionById(sessionId)
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // End the session and clean up signals
    endVideoSession(sessionId)
    deleteVideoSignals(sessionId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error ending video session:', error)
    return NextResponse.json(
      { error: 'Failed to end session' },
      { status: 500 }
    )
  }
}
