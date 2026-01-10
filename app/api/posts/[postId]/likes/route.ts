import { NextRequest, NextResponse } from 'next/server'
import { getPostLikeCount, isPostLikedByUser } from '@/app/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID required' },
        { status: 400 }
      )
    }

    const likeCount = getPostLikeCount(postId)
    const isLiked = userId ? isPostLikedByUser(postId, userId) : false

    return NextResponse.json({
      success: true,
      likeCount,
      isLiked,
    })
  } catch (error) {
    console.error('Error fetching likes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch likes' },
      { status: 500 }
    )
  }
}
