#!/usr/bin/env node

/**
 * Database seeding script
 * Run this after starting the dev server: npm run dev
 * Then in another terminal: node scripts/seed-db.js
 */

const http = require('http')

function seedDatabase() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/seed',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': 0,
    },
  }

  const req = http.request(options, (res) => {
    let data = ''

    res.on('data', (chunk) => {
      data += chunk
    })

    res.on('end', () => {
      try {
        const json = JSON.parse(data)
        console.log('\n✅ Database seeded successfully!\n')
        console.log('📊 Statistics:')
        console.log(`   - Users created: ${json.stats.usersCreated}`)
        console.log(`   - Total users: ${json.stats.totalUsers}`)
        console.log(`   - Posts created: ${json.stats.postsCreated}`)
        console.log('\n👥 Sample users created:')
        json.createdUsers.forEach((user) => {
          console.log(`   - @${user.username} (${user.displayName})`)
        })
        console.log('\n✨ You can now visit http://localhost:3000/feed to see the posts!\n')
      } catch (error) {
        console.error('❌ Error parsing response:', error)
      }
    })
  })

  req.on('error', (error) => {
    console.error('❌ Error connecting to server:', error.message)
    console.log('\n💡 Make sure the dev server is running:')
    console.log('   npm run dev\n')
  })

  req.end()
}

console.log('🌱 Seeding database...')
seedDatabase()
