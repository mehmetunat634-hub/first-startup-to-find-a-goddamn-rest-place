import { NextRequest, NextResponse } from 'next/server'
import { updatePendingItem } from '@/app/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const itemId = params.itemId
    const body = await request.json()
    const { title, description, price, user1_status, user2_status } = body

    if (!itemId) {
      return NextResponse.json(
        { error: 'Pending item ID required' },
        { status: 400 }
      )
    }

    // Update pending item with provided data
    const updatedItem = updatePendingItem(itemId, {
      title: title || undefined,
      description: description || undefined,
      price: price !== undefined ? price : undefined,
      user1_status: user1_status || undefined,
      user2_status: user2_status || undefined,
    })

    if (!updatedItem) {
      return NextResponse.json(
        { error: 'Pending item not found' },
        { status: 404 }
      )
    }

    console.log(`✅ Pending item updated: ${itemId}`)

    return NextResponse.json({
      success: true,
      pendingItem: updatedItem,
    })
  } catch (error) {
    console.error('Error updating pending item:', error)
    return NextResponse.json(
      { error: 'Failed to update pending item' },
      { status: 500 }
    )
  }
}
