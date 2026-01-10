import { NextResponse } from 'next/server'
import { matchVideoSession, getVideoSessionById } from '@/app/lib/db'

export async function POST(request: Request) {
  try {
    const { sessionId, userId } = await request.json()

    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'sessionId and userId are required' },
        { status: 400 }
      )
    }

    // Join the waiting session
    const session = matchVideoSession(sessionId, userId)

    if (!session) {
      return NextResponse.json(
        { error: 'Failed to catch session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      sessionId: session.id,
      status: session.status,
      message: 'Caught successfully!',
    })
  } catch (error) {
    console.error('Error catching session:', error)
    return NextResponse.json(
      { error: 'Failed to catch session' },
      { status: 500 }
    )
  }
}
