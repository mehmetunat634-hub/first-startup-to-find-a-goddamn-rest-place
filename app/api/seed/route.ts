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
    caption: 'Beautiful sunset cinematic video 🌅 Stunning colors',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4',
    thumbnailUrl: 'https://peach.blender.org/wp-content/uploads/image-1-1024x574.png?x11217',
    price: 9.99,
  },
  {
    caption: 'Adventure travel vlog - mountain hiking 🏔️',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/ElephantsDream.mp4',
    thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Elephants_Dream_%282006%29.svg/1200px-Elephants_Dream_%282006%29.svg.png',
    price: 14.99,
  },
  {
    caption: 'City exploration vlog 🌆 Urban photography',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600&h=600&fit=crop',
    price: 7.99,
  },
  {
    caption: 'Nature documentary - wildlife 🌿',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/ForBiggerEscapes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=600&fit=crop',
    price: 12.99,
  },
  {
    caption: 'Lifestyle vlog - living best life 💫',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/ForBiggerFun.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=600&fit=crop',
    price: 5.99,
  },
  {
    caption: 'Travel video - destinations 👥',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/ForBiggerJoyrides.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=600&h=600&fit=crop',
    price: 11.99,
  },
  {
    caption: 'Sunset cinematic footage 🌟',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/Sintel.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1514306688772-bab81ba36269?w=600&h=600&fit=crop',
    price: 8.99,
  },
  {
    caption: 'Friend group adventure 📸',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/SubaruOutbackOnStreetAndDirt.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=600&fit=crop',
    price: 6.99,
  },
  {
    caption: 'Motivational video - sunshine story ☀️',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/VolkswagenGTIReview.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=600&fit=crop',
    price: 4.99,
  },
  {
    caption: 'Vlog - weekend adventures ✨',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/WeatherKids.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&h=600&fit=crop',
    price: 3.99,
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
        samplePosts[i].videoUrl,
        samplePosts[i].thumbnailUrl,
        samplePosts[i].price,
        '[]'
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
