import { NextRequest, NextResponse } from 'next/server'
import { getPostCommentsWithUsers, createPostComment, canUserCommentOnPost } from '@/app/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID required' },
        { status: 400 }
      )
    }

    const comments = getPostCommentsWithUsers(postId)

    return NextResponse.json({
      success: true,
      comments,
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId
    const body = await request.json()
    const { userId, content } = body

    if (!postId || !userId || !content) {
      return NextResponse.json(
        { error: 'Post ID, User ID, and content required' },
        { status: 400 }
      )
    }

    if (content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content cannot be empty' },
        { status: 400 }
      )
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: 'Comment must be 500 characters or less' },
        { status: 400 }
      )
    }

    // Check if user can comment on this post
    if (!canUserCommentOnPost(postId, userId)) {
      return NextResponse.json(
        { error: 'You must purchase this post to comment on it' },
        { status: 403 }
      )
    }

    // Create comment
    const comment = createPostComment(postId, userId, content.trim())

    return NextResponse.json({
      success: true,
      comment,
    })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
