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
  );

  CREATE TABLE IF NOT EXISTS video_sessions (
    id TEXT PRIMARY KEY,
    user1_id TEXT NOT NULL,
    user2_id TEXT,
    status TEXT DEFAULT 'waiting',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES users(id),
    FOREIGN KEY (user2_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS video_signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    from_user_id TEXT NOT NULL,
    to_user_id TEXT NOT NULL,
    signal_type TEXT,
    signal_data TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES video_sessions(id),
    FOREIGN KEY (from_user_id) REFERENCES users(id),
    FOREIGN KEY (to_user_id) REFERENCES users(id)
  );
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

// Video call session functions
export interface VideoSession {
  id: string
  user1_id: string
  user2_id: string | null
  status: 'waiting' | 'active' | 'ended'
  createdAt: string
  updatedAt: string
}

export interface VideoSignal {
  id: number
  session_id: string
  from_user_id: string
  to_user_id: string
  signal_type: string
  signal_data: string
  createdAt: string
}

export function createVideoSession(userId: string): VideoSession {
  const sessionId = Math.random().toString(36).substr(2, 12)
  const stmt = db.prepare(`
    INSERT INTO video_sessions (id, user1_id, status)
    VALUES (?, ?, 'waiting')
  `)
  stmt.run(sessionId, userId)
  return getVideoSessionById(sessionId)!
}

export function getVideoSessionById(sessionId: string): VideoSession | null {
  const stmt = db.prepare('SELECT * FROM video_sessions WHERE id = ?')
  return stmt.get(sessionId) as VideoSession | null
}

export function findWaitingSession(excludeUserId: string): VideoSession | null {
  const stmt = db.prepare(`
    SELECT * FROM video_sessions
    WHERE status = 'waiting' AND user1_id != ?
    ORDER BY createdAt ASC
    LIMIT 1
  `)
  return stmt.get(excludeUserId) as VideoSession | null
}

export function matchVideoSession(sessionId: string, userId: string): VideoSession | null {
  const stmt = db.prepare(`
    UPDATE video_sessions
    SET user2_id = ?, status = 'active', updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `)
  stmt.run(userId, sessionId)
  return getVideoSessionById(sessionId)
}

export function endVideoSession(sessionId: string): void {
  const stmt = db.prepare(`
    UPDATE video_sessions
    SET status = 'ended', updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `)
  stmt.run(sessionId)
}

export function addVideoSignal(
  sessionId: string,
  fromUserId: string,
  toUserId: string,
  signalType: string,
  signalData: string
): VideoSignal {
  const stmt = db.prepare(`
    INSERT INTO video_signals (session_id, from_user_id, to_user_id, signal_type, signal_data)
    VALUES (?, ?, ?, ?, ?)
  `)
  const result = stmt.run(sessionId, fromUserId, toUserId, signalType, signalData)

  const getStmt = db.prepare('SELECT * FROM video_signals WHERE id = ?')
  return getStmt.get(result.lastInsertRowid) as VideoSignal
}

export function getVideoSignalsForUser(sessionId: string, userId: string): VideoSignal[] {
  const stmt = db.prepare(`
    SELECT * FROM video_signals
    WHERE session_id = ? AND to_user_id = ?
    ORDER BY createdAt ASC
  `)
  return stmt.all(sessionId, userId) as VideoSignal[]
}

export function deleteVideoSignals(sessionId: string): void {
  const stmt = db.prepare('DELETE FROM video_signals WHERE session_id = ?')
  stmt.run(sessionId)
}
