import { NextRequest, NextResponse } from 'next/server'
import { createUser, getUserByUsername, getUserByEmail, removeUserPassword } from '@/app/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, password, displayName, firstName, lastName, bio } = body

    // Validation
    if (!username || !email || !password || !displayName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists
    if (getUserByUsername(username)) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      )
    }

    if (getUserByEmail(email)) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    // Create new user
    const newUser = createUser({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      displayName,
      firstName: firstName || displayName,
      lastName: lastName || 'User',
      bio: bio || 'Instagram user',
    })

    if (!newUser) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    return NextResponse.json(removeUserPassword(newUser), { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}
