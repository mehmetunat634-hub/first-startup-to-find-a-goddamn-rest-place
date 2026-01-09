import { NextRequest, NextResponse } from 'next/server'
import { createVideoSession, matchVideoSession, findSessionWithTargetUser, getVideoSessionById } from '@/app/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { targetUsername: string } }
) {
  try {
    const body = await request.json()
    const { userId } = body
    const targetUsername = params.targetUsername as string

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Check if there's already an active or waiting session with this user
    const existingSession = findSessionWithTargetUser(userId, targetUsername)
    if (existingSession) {
      return NextResponse.json({
        sessionId: existingSession.id,
        status: existingSession.status,
        isExisting: true,
      })
    }

    // Create a new video session
    const session = createVideoSession(userId)

    return NextResponse.json({
      sessionId: session.id,
      status: session.status,
      isExisting: false,
    })
  } catch (error) {
    console.error('Error creating targeted video session:', error)
    return NextResponse.json(
      { error: 'Failed to create video session' },
      { status: 500 }
    )
  }
}
