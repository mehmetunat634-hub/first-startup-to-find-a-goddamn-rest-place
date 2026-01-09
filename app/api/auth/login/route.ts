import { NextRequest, NextResponse } from 'next/server'
import { getUserForLogin, removeUserPassword } from '@/app/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username/email and password are required' },
        { status: 400 }
      )
    }

    const user = getUserForLogin(username)

    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: 'Invalid username/email or password' },
        { status: 401 }
      )
    }

    return NextResponse.json(removeUserPassword(user))
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
