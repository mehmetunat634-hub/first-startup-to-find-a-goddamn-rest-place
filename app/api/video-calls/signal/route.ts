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
    const signal = addVideoSignal(sessionId, fromUserId, toUserId, signalType, signalData)
    console.log(`✅ Signal stored: ${signal.id} from ${fromUserId} to ${toUserId}`)

    return NextResponse.json({ success: true, signalId: signal.id })
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

    // Get ONLY unprocessed signals for this user (processed = 0)
    const signals = getVideoSignalsForUser(sessionId, userId)

    if (signals.length > 0) {
      console.log(`📥 Retrieved ${signals.length} unprocessed signals for user ${userId}`)
    }

    return NextResponse.json({ signals })
  } catch (error) {
    console.error('Error fetching signals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch signals' },
      { status: 500 }
    )
  }
}
