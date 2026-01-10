import { NextRequest, NextResponse } from 'next/server'
import { togglePostLike, getPostLikeCount } from '@/app/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId
    const body = await request.json()
    const { userId } = body

    if (!postId || !userId) {
      return NextResponse.json(
        { error: 'Post ID and User ID required' },
        { status: 400 }
      )
    }

    // Toggle like
    const isLiked = togglePostLike(postId, userId)
    const likeCount = getPostLikeCount(postId)

    return NextResponse.json({
      success: true,
      isLiked,
      likeCount,
    })
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    )
  }
}
