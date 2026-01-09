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

const DATA_DIR = path.join(process.cwd(), '.data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch (error) {
    // Directory might already exist
  }
}

async function getUsers(): Promise<User[]> {
  try {
    await ensureDataDir()
    const data = await fs.readFile(USERS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    // File doesn't exist yet
    return []
  }
}

async function saveUsers(users: User[]) {
  await ensureDataDir()
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2))
}

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

    const users = await getUsers()

    // Check if user already exists
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      )
    }

    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    // Create new user
    const newUser: User = {
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password, // In production, hash this!
      displayName,
      firstName: firstName || displayName,
      lastName: lastName || 'User',
      bio: bio || 'Instagram user',
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    await saveUsers(users)

    // Return user data without password
    const { password: _, ...userWithoutPassword } = newUser
    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}
