import { NextRequest, NextResponse } from 'next/server'
import { getAllUsers, removeUserPassword } from '@/app/lib/db'

export async function GET(request: NextRequest) {
  try {
    const users = getAllUsers()

    // Return all users without passwords
    const usersWithoutPasswords = users.map(removeUserPassword)

    return NextResponse.json(usersWithoutPasswords)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
