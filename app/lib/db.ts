import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'dev.db')
const db = new Database(dbPath)

// Enable foreign keys
db.pragma('foreign_keys = ON')

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    displayName TEXT NOT NULL,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    bio TEXT DEFAULT '',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

export interface User {
  id: string
  username: string
  email: string
  password: string
  displayName: string
  firstName: string
  lastName: string
  bio: string
  createdAt: string
  updatedAt: string
}

export interface UserPublic {
  id: string
  username: string
  email: string
  displayName: string
  firstName: string
  lastName: string
  bio: string
  createdAt: string
  updatedAt: string
}

// User operations
export function createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
  const id = Math.random().toString(36).substr(2, 9)
  const stmt = db.prepare(`
    INSERT INTO users (id, username, email, password, displayName, firstName, lastName, bio)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  stmt.run(
    id,
    user.username,
    user.email,
    user.password,
    user.displayName,
    user.firstName,
    user.lastName,
    user.bio
  )

  return getUserById(id)
}

export function getUserById(id: string): User | null {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?')
  return stmt.get(id) as User | null
}

export function getUserByUsername(username: string): User | null {
  const stmt = db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)')
  return stmt.get(username) as User | null
}

export function getUserByEmail(email: string): User | null {
  const stmt = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)')
  return stmt.get(email) as User | null
}

export function getAllUsers(): User[] {
  const stmt = db.prepare('SELECT * FROM users')
  return stmt.all() as User[]
}

export function updateUser(username: string, data: Partial<Omit<User, 'id' | 'username' | 'email' | 'password' | 'createdAt'>>) {
  const user = getUserByUsername(username)
  if (!user) return null

  const updates: string[] = []
  const values: any[] = []

  if (data.displayName) {
    updates.push('displayName = ?')
    values.push(data.displayName)
  }
  if (data.firstName) {
    updates.push('firstName = ?')
    values.push(data.firstName)
  }
  if (data.lastName) {
    updates.push('lastName = ?')
    values.push(data.lastName)
  }
  if (data.bio !== undefined) {
    updates.push('bio = ?')
    values.push(data.bio)
  }

  if (updates.length === 0) return user

  updates.push('updatedAt = CURRENT_TIMESTAMP')
  values.push(user.id)

  const stmt = db.prepare(`
    UPDATE users
    SET ${updates.join(', ')}
    WHERE id = ?
  `)

  stmt.run(...values)
  return getUserById(user.id)
}

export function userExists(usernameOrEmail: string): boolean {
  const stmt = db.prepare(`
    SELECT 1 FROM users
    WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)
    LIMIT 1
  `)
  return stmt.get(usernameOrEmail, usernameOrEmail) ? true : false
}

export function getUserForLogin(usernameOrEmail: string): User | null {
  const stmt = db.prepare(`
    SELECT * FROM users
    WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)
    LIMIT 1
  `)
  return stmt.get(usernameOrEmail, usernameOrEmail) as User | null
}

export function removeUserPassword(user: User): UserPublic {
  const { password: _, ...userWithoutPassword } = user
  return userWithoutPassword as UserPublic
}
