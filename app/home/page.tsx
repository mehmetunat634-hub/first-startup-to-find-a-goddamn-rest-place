'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../components/Navbar'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    if (!isLoggedIn) {
      router.push('/')
    }
  }, [router])

  return (
    <div className="home-container">
      <Navbar />
      <main className="home-main">
        {/* Main content area */}
      </main>
    </div>
  )
}
