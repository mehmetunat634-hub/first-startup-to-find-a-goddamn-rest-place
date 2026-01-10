import { NextRequest, NextResponse } from 'next/server'
import { getPendingItemsByUserId } from '@/app/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    const pendingItems = getPendingItemsByUserId(userId)

    return NextResponse.json({
      success: true,
      pendingItems,
    })
  } catch (error) {
    console.error('Error fetching pending items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending items' },
      { status: 500 }
    )
  }
}
