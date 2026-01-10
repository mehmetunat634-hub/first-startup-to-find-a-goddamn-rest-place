import { NextRequest, NextResponse } from 'next/server'
import { getPostsTaggingUser, getUserById, removeUserPassword } from '@/app/lib/db'

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

    // Get posts where this user is tagged
    const posts = getPostsTaggingUser(userId)

    // Enrich posts with user information
    const postsWithUsers = posts.map(post => {
      const user = getUserById(post.userId)
      return {
        ...post,
        user: user ? removeUserPassword(user) : undefined,
      }
    })

    return NextResponse.json({
      success: true,
      posts: postsWithUsers,
    })
  } catch (error) {
    console.error('Error fetching tagged posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tagged posts' },
      { status: 500 }
    )
  }
}
