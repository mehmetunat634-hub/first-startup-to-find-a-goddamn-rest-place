import { NextRequest, NextResponse } from 'next/server'
import { markSignalAsProcessed } from '@/app/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { signalId } = body

    if (!signalId) {
      return NextResponse.json(
        { error: 'Signal ID required' },
        { status: 400 }
      )
    }

    // Mark signal as processed
    markSignalAsProcessed(signalId)
    console.log(`✅ Signal ${signalId} marked as processed`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking signal as processed:', error)
    return NextResponse.json(
      { error: 'Failed to mark signal as processed' },
      { status: 500 }
    )
  }
}
