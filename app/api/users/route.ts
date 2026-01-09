import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

interface User {
  username: string
  email: string
  password: string
  displayName: string
  firstName: string
  lastName: string
  bio: string
  createdAt: string
}

interface UserWithoutPassword {
  username: string
  email: string
  displayName: string
  firstName: string
  lastName: string
  bio: string
  createdAt: string
}

const USERS_FILE = path.join(process.cwd(), '.data', 'users.json')

async function getUsers(): Promise<User[]> {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const users = await getUsers()

    // Return all users without passwords
    const usersWithoutPasswords: UserWithoutPassword[] = users.map(user => {
      const { password: _, ...userWithoutPassword } = user
      return userWithoutPassword as UserWithoutPassword
    })

    return NextResponse.json(usersWithoutPasswords)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
