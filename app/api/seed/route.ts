import { NextResponse } from 'next/server'
import { createUser, createPost, getAllUsers } from '@/app/lib/db'
import bcrypt from 'bcryptjs'

const sampleUsers = [
  {
    username: 'sarah_johnson',
    displayName: 'Sarah Johnson',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah@example.com',
    password: 'password123',
    bio: '📸 Photography enthusiast | Adventure seeker',
  },
  {
    username: 'mike_chen',
    displayName: 'Mike Chen',
    firstName: 'Mike',
    lastName: 'Chen',
    email: 'mike@example.com',
    password: 'password123',
    bio: '🎨 Designer | Coffee lover | Tech geek',
  },
  {
    username: 'emma_wilson',
    displayName: 'Emma Wilson',
    firstName: 'Emma',
    lastName: 'Wilson',
    email: 'emma@example.com',
    password: 'password123',
    bio: '🌿 Sustainability advocate | Travel blog',
  },
  {
    username: 'alex_martinez',
    displayName: 'Alex Martinez',
    firstName: 'Alex',
    lastName: 'Martinez',
    email: 'alex@example.com',
    password: 'password123',
    bio: '⚽ Fitness enthusiast | Gym life',
  },
  {
    username: 'lisa_patel',
    displayName: 'Lisa Patel',
    firstName: 'Lisa',
    lastName: 'Patel',
    email: 'lisa@example.com',
    password: 'password123',
    bio: '👨‍💻 Software engineer | Open source contributor',
  },
  {
    username: 'james_taylor',
    displayName: 'James Taylor',
    firstName: 'James',
    lastName: 'Taylor',
    email: 'james@example.com',
    password: 'password123',
    bio: '🎵 Music producer | Always creating',
  },
]

const samplePosts = [
  {
    caption: 'Beautiful sunset by the beach! 🌅',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=600&fit=crop',
  },
  {
    caption: 'Morning coffee and good vibes ☕✨',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=600&fit=crop',
  },
  {
    caption: 'Adventure awaits! 🏔️',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=600&fit=crop',
  },
  {
    caption: 'Exploring the city 🌆',
    imageUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600&h=600&fit=crop',
  },
  {
    caption: 'Nature is healing 🌿',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=600&fit=crop',
  },
  {
    caption: 'Living my best life! 💫',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=600&fit=crop',
  },
  {
    caption: 'The best view is together 👥',
    imageUrl: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=600&h=600&fit=crop',
  },
  {
    caption: 'Chasing dreams and sunsets 🌟',
    imageUrl: 'https://images.unsplash.com/photo-1514306688772-bab81ba36269?w=600&h=600&fit=crop',
  },
  {
    caption: 'Good times + crazy friends = amazing memories 📸',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=600&fit=crop',
  },
  {
    caption: 'Create your own sunshine 🌞',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=600&fit=crop',
  },
  {
    caption: 'Weekend vibes ✨',
    imageUrl: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&h=600&fit=crop',
  },
  {
    caption: 'Sunset never gets old 🌅',
    imageUrl: 'https://images.unsplash.com/photo-1495104466306-5d01b126b358?w=600&h=600&fit=crop',
  },
]

export async function POST() {
  try {
    // Get existing users to avoid duplicates
    const existingUsers = getAllUsers()
    const existingUsernames = new Set(existingUsers.map(u => u.username))

    const createdUsers = []
    const usersToCreate = sampleUsers.filter(u => !existingUsernames.has(u.username))

    // Create users
    for (const userTemplate of usersToCreate) {
      const hashedPassword = bcrypt.hashSync(userTemplate.password, 10)

      const user = createUser({
        username: userTemplate.username,
        email: userTemplate.email,
        password: hashedPassword,
        displayName: userTemplate.displayName,
        firstName: userTemplate.firstName,
        lastName: userTemplate.lastName,
        bio: userTemplate.bio,
      })
      createdUsers.push(user)
    }

    // Get all users (including newly created ones)
    const allUsers = getAllUsers()

    // Create posts - distribute them among users
    const createdPosts = []
    for (let i = 0; i < samplePosts.length; i++) {
      const user = allUsers[i % allUsers.length]
      const post = createPost(
        user.id,
        samplePosts[i].caption,
        samplePosts[i].imageUrl
      )
      createdPosts.push(post)
    }

    return NextResponse.json({
      message: 'Database seeded successfully',
      stats: {
        usersCreated: createdUsers.length,
        totalUsers: allUsers.length,
        postsCreated: createdPosts.length,
      },
      createdUsers: createdUsers.map((u) => ({
        id: u?.id || '',
        username: u?.username || '',
        displayName: u?.displayName || '',
      })),
    })
  } catch (error) {
    console.error('Error seeding database:', error)
    return NextResponse.json(
      { error: 'Failed to seed database', details: String(error) },
      { status: 500 }
    )
  }
}
