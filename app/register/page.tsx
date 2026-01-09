'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface FormData {
  username: string
  email: string
  password: string
  confirmPassword: string
  displayName: string
  firstName: string
  lastName: string
}

interface FormErrors {
  username?: string
  email?: string
  password?: string
  confirmPassword?: string
  displayName?: string
  general?: string
}

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    firstName: '',
    lastName: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSuccessMessage('')

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Call register API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName,
          firstName: formData.firstName || formData.displayName,
          lastName: formData.lastName,
          bio: 'Instagram user',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setErrors({
          general: errorData.error || 'Registration failed. Please try again.',
        })
        return
      }

      setSuccessMessage('Registration successful! Redirecting to login...')
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        displayName: '',
        firstName: '',
        lastName: '',
      })

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (error) {
      console.error('Registration error:', error)
      setErrors({
        general: 'An error occurred during registration. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="register-page">
      <form onSubmit={handleSubmit} className="login-form-container">
        <div className="logo">instagram</div>

        <div className="register-subtitle">
          Create your account and start connecting
        </div>

        {errors.general && <div className="error-message">{errors.general}</div>}
        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            placeholder="Choose a username"
            value={formData.username}
            onChange={handleChange}
            disabled={isLoading}
          />
          {errors.username && (
            <div className="error-message">{errors.username}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="your.email@example.com"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
          />
          {errors.email && <div className="error-message">{errors.email}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="displayName">Display Name</label>
          <input
            type="text"
            id="displayName"
            name="displayName"
            placeholder="Your display name"
            value={formData.displayName}
            onChange={handleChange}
            disabled={isLoading}
          />
          {errors.displayName && (
            <div className="error-message">{errors.displayName}</div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              placeholder="First name (optional)"
              value={formData.firstName}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              placeholder="Last name (optional)"
              value={formData.lastName}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="At least 6 characters"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            autoComplete="new-password"
          />
          {errors.password && (
            <div className="error-message">{errors.password}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={isLoading}
            autoComplete="new-password"
          />
          {errors.confirmPassword && (
            <div className="error-message">{errors.confirmPassword}</div>
          )}
        </div>

        <button type="submit" className="login-button" disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'Sign up'}
        </button>

        <div className="signup-prompt">
          Already have an account? <Link href="/">Log in</Link>
        </div>
      </form>
    </div>
  )
}
