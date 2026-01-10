import { NextRequest, NextResponse } from 'next/server'
import { createPendingItem, getPendingItemsBySessionId } from '@/app/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, recordingPath, user1Id, user2Id } = body

    if (!sessionId || !recordingPath || !user1Id || !user2Id) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, recordingPath, user1Id, user2Id' },
        { status: 400 }
      )
    }

    // Check if pending item already exists for this session
    const existing = getPendingItemsBySessionId(sessionId)
    if (existing) {
      return NextResponse.json(
        { error: 'Pending item already exists for this session' },
        { status: 400 }
      )
    }

    // Create pending item
    const pendingItem = createPendingItem(
      sessionId,
      user1Id,
      user2Id,
      recordingPath
    )

    console.log(`✅ Pending item created: ${pendingItem.id}`)

    return NextResponse.json({
      success: true,
      pendingItem,
    })
  } catch (error) {
    console.error('Error creating pending item:', error)
    return NextResponse.json(
      { error: 'Failed to create pending item' },
      { status: 500 }
    )
  }
}
