import { NextRequest, NextResponse } from 'next/server'
import { addVideoSignal, getVideoSignalsForUser, getVideoSessionById } from '@/app/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, fromUserId, toUserId, signalType, signalData } = body

    if (!sessionId || !fromUserId || !toUserId || !signalType || !signalData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const session = getVideoSessionById(sessionId)
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Store the signal
    addVideoSignal(sessionId, fromUserId, toUserId, signalType, signalData)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending signal:', error)
    return NextResponse.json(
      { error: 'Failed to send signal' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const userId = searchParams.get('userId')

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

    // Get signals for this user
    const signals = getVideoSignalsForUser(sessionId, userId)

    return NextResponse.json({ signals })
  } catch (error) {
    console.error('Error fetching signals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch signals' },
      { status: 500 }
    )
  }
}
