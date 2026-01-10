import { NextRequest, NextResponse } from 'next/server'
import { updatePendingItem, getPendingItemById, createPost } from '@/app/lib/db'

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

    // Get current item to merge updates
    const currentItem = getPendingItemById(itemId)
    if (!currentItem) {
      return NextResponse.json(
        { error: 'Pending item not found' },
        { status: 404 }
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
        { error: 'Failed to update pending item' },
        { status: 500 }
      )
    }

    // Check if both users have approved
    const newUser1Status = user1_status || currentItem.user1_status
    const newUser2Status = user2_status || currentItem.user2_status

    if (newUser1Status === 'approved' && newUser2Status === 'approved' && !currentItem.published_post_id) {
      // Automatically publish the post
      try {
        const taggedUsers = JSON.stringify([currentItem.user1_id, currentItem.user2_id])
        const post = createPost(
          currentItem.user1_id, // userId - post owner
          updatedItem.title || 'Untitled Recording', // caption
          currentItem.recording_path, // videoUrl
          undefined, // thumbnailUrl
          updatedItem.price || 0, // price
          taggedUsers, // taggedUsers
          currentItem.session_id, // recordingSessionId
          true, // approvedByUser1
          true, // approvedByUser2
          (updatedItem.price || 0) * 0.5, // revenueSplitUser1 - 50%
          (updatedItem.price || 0) * 0.5  // revenueSplitUser2 - 50%
        )

        // Update pending item with published_post_id
        updatePendingItem(itemId, {
          published_post_id: post.id,
        })

        console.log(`✅ Pending item published as post: ${post.id}`)
      } catch (publishError) {
        console.error('Error publishing post:', publishError)
        // Don't fail the update, just log the error
      }
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
