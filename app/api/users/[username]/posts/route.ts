import { NextRequest, NextResponse } from 'next/server'
import { getUserByUsername, getPostsByUserId } from '@/app/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username as string
    const usernameWithoutAt = username.replace('@', '')

    // Get user by username
    const user = getUserByUsername(usernameWithoutAt)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get posts by user ID
    const posts = getPostsByUserId(user.id)

    return NextResponse.json({
      username: user.username,
      posts,
    })
  } catch (error) {
    console.error('Error fetching user posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user posts' },
      { status: 500 }
    )
  }
}
