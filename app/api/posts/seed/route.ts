import { NextRequest, NextResponse } from 'next/server'
import { getAllUsers, createPost } from '@/app/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Get all users
    const users = getAllUsers()

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'No users found to create posts for' },
        { status: 400 }
      )
    }

    // Sample post data
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
    ]

    // Create posts from different users
    const createdPosts = []
    for (let i = 0; i < samplePosts.length; i++) {
      const user = users[i % users.length]
      const post = createPost(
        user.id,
        samplePosts[i].caption,
        samplePosts[i].imageUrl
      )
      createdPosts.push(post)
    }

    return NextResponse.json({
      message: 'Posts seeded successfully',
      count: createdPosts.length,
      posts: createdPosts,
    })
  } catch (error) {
    console.error('Error seeding posts:', error)
    return NextResponse.json(
      { error: 'Failed to seed posts' },
      { status: 500 }
    )
  }
}
