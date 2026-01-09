'use client'

import { useState, useEffect } from 'react'

const SLIDESHOW_IMAGES = [
  'https://img.freepik.com/free-photo/closeup-scarlet-macaw-from-side-view-scarlet-macaw-closeup-head_488145-3540.jpg?semt=ais_hybrid&w=740&q=80',
  'https://img.tamindir.com/2022/05/476722/bermuda-video-chat-3.jpg',
]

export default function ImageSlideshow() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        (prevIndex + 1) % SLIDESHOW_IMAGES.length
      )
    }, 5000) // Change image every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const handleImageLoad = () => {
    setIsLoaded(true)
  }

  return (
    <div className="slideshow-container">
      {SLIDESHOW_IMAGES.map((image, index) => (
        <div
          key={index}
          className={`slideshow-slide ${
            index === currentImageIndex ? 'active' : ''
          }`}
        >
          <img
            src={image}
            alt={`Slide ${index + 1}`}
            onLoad={handleImageLoad}
          />
        </div>
      ))}

      <div className="slideshow-indicators">
        {SLIDESHOW_IMAGES.map((_, index) => (
          <button
            key={index}
            className={`indicator ${index === currentImageIndex ? 'active' : ''}`}
            onClick={() => setCurrentImageIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
