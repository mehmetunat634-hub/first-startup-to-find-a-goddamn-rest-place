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
    processed BOOLEAN DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES video_sessions(id),
    FOREIGN KEY (from_user_id) REFERENCES users(id),
    FOREIGN KEY (to_user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    from_user_id TEXT NOT NULL,
    to_user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES video_sessions(id),
    FOREIGN KEY (from_user_id) REFERENCES users(id),
    FOREIGN KEY (to_user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    caption TEXT DEFAULT '',
    videoUrl TEXT NOT NULL,
    thumbnailUrl TEXT,
    price REAL DEFAULT 0,
    taggedUsers TEXT DEFAULT '[]',
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
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

export function findSessionWithTargetUser(fromUserId: string, toUserId: string): VideoSession | null {
  const stmt = db.prepare(`
    SELECT * FROM video_sessions
    WHERE ((user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?))
    AND status IN ('waiting', 'active')
    ORDER BY createdAt DESC
    LIMIT 1
  `)
  return stmt.get(fromUserId, toUserId, toUserId, fromUserId) as VideoSession | null
}

export function getAllWaitingSessions(): VideoSession[] {
  const stmt = db.prepare(`
    SELECT * FROM video_sessions
    WHERE status = 'waiting'
    ORDER BY createdAt DESC
  `)
  return stmt.all() as VideoSession[]
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

// Message functions
export interface Message {
  id: string
  session_id: string
  from_user_id: string
  to_user_id: string
  content: string
  createdAt: string
}

export function createMessage(
  sessionId: string,
  fromUserId: string,
  toUserId: string,
  content: string
): Message {
  const id = Math.random().toString(36).substr(2, 12)
  const stmt = db.prepare(`
    INSERT INTO messages (id, session_id, from_user_id, to_user_id, content)
    VALUES (?, ?, ?, ?, ?)
  `)
  stmt.run(id, sessionId, fromUserId, toUserId, content)
  return getMessageById(id)!
}

export function getMessageById(messageId: string): Message | null {
  const stmt = db.prepare('SELECT * FROM messages WHERE id = ?')
  return stmt.get(messageId) as Message | null
}

export function getMessagesForSession(sessionId: string, limit: number = 50): Message[] {
  const stmt = db.prepare(`
    SELECT * FROM messages
    WHERE session_id = ?
    ORDER BY createdAt ASC
    LIMIT ?
  `)
  return stmt.all(sessionId, limit) as Message[]
}

export function deleteSessionMessages(sessionId: string): void {
  const stmt = db.prepare('DELETE FROM messages WHERE session_id = ?')
  stmt.run(sessionId)
}

// Post functions
export interface Post {
  id: string
  userId: string
  caption: string
  videoUrl: string
  thumbnailUrl: string | null
  price: number
  taggedUsers: string
  likes: number
  comments: number
  createdAt: string
  updatedAt: string
}

export interface PostWithUser extends Post {
  user?: UserPublic
}

export function createPost(
  userId: string,
  caption: string,
  videoUrl: string,
  thumbnailUrl?: string,
  price: number = 0,
  taggedUsers: string = '[]'
): Post {
  const postId = Math.random().toString(36).substr(2, 12)
  const stmt = db.prepare(`
    INSERT INTO posts (id, userId, caption, videoUrl, thumbnailUrl, price, taggedUsers)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  stmt.run(postId, userId, caption, videoUrl, thumbnailUrl || null, price, taggedUsers)
  return getPostById(postId)!
}

export function getPostById(postId: string): Post | null {
  const stmt = db.prepare('SELECT * FROM posts WHERE id = ?')
  return stmt.get(postId) as Post | null
}

export function getPostsByUserId(userId: string): Post[] {
  const stmt = db.prepare(`
    SELECT * FROM posts
    WHERE userId = ?
    ORDER BY createdAt DESC
  `)
  return stmt.all(userId) as Post[]
}

export function getAllPosts(limit: number = 50, offset: number = 0): Post[] {
  const stmt = db.prepare(`
    SELECT * FROM posts
    ORDER BY createdAt DESC
    LIMIT ? OFFSET ?
  `)
  return stmt.all(limit, offset) as Post[]
}

export function updatePostLikes(postId: string, increment: boolean = true): Post | null {
  const post = getPostById(postId)
  if (!post) return null

  const newLikes = increment ? post.likes + 1 : Math.max(0, post.likes - 1)
  const stmt = db.prepare(`
    UPDATE posts
    SET likes = ?, updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `)
  stmt.run(newLikes, postId)
  return getPostById(postId)
}

export function getPostsWithUsers(limit: number = 50, offset: number = 0): PostWithUser[] {
  const posts = getAllPosts(limit, offset)
  return posts.map(post => {
    const user = getUserById(post.userId)
    return {
      ...post,
      user: user ? removeUserPassword(user) : undefined,
    }
  })
}
