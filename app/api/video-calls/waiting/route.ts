import { NextResponse } from 'next/server'
import { getAllWaitingSessions, getUserById } from '@/app/lib/db'

export async function GET() {
  try {
    const sessions = getAllWaitingSessions()

    // Enrich sessions with user information
    const enrichedSessions = sessions.map((session) => {
      const user = getUserById(session.user1_id)
      return {
        sessionId: session.id,
        user: user ? {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          firstName: user.firstName,
          lastName: user.lastName,
          bio: user.bio,
        } : null,
        createdAt: session.createdAt,
      }
    }).filter(s => s.user !== null)

    return NextResponse.json(enrichedSessions)
  } catch (error) {
    console.error('Error fetching waiting sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch waiting sessions' },
      { status: 500 }
    )
  }
}
