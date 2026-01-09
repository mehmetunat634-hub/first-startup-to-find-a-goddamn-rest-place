'use client'

import { useState } from 'react'

interface FormData {
  email: string
  password: string
}

interface FormErrors {
  email?: string
  password?: string
  general?: string
}

export default function LoginForm() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
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

    if (!formData.email.trim()) {
      newErrors.email = 'Email or username is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
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
      // Simulate API call with a delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock authentication - in a real app, this would be an API call
      const mockUser = {
        email: formData.email,
        username: formData.email.split('@')[0],
      }

      // Store user in localStorage (for demo purposes)
      localStorage.setItem('user', JSON.stringify(mockUser))
      localStorage.setItem('isLoggedIn', 'true')

      setSuccessMessage('Login successful! Redirecting...')
      setFormData({ email: '', password: '' })

      // Simulate redirect after 1 second
      setTimeout(() => {
        alert(`Welcome ${mockUser.username}! You have successfully logged in.`)
        // In a real app, you would use router.push('/dashboard')
      }, 1000)
    } catch (error) {
      setErrors({
        general: 'An error occurred during login. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = () => {
    const email = formData.email
    if (!email) {
      alert('Please enter your email address first.')
      return
    }
    if (!validateEmail(email)) {
      alert('Please enter a valid email address.')
      return
    }
    alert(`Password reset link would be sent to ${email}`)
  }

  const handleFacebookLogin = () => {
    alert('Facebook login would redirect to Facebook OAuth flow')
  }

  return (
    <form onSubmit={handleSubmit} className="login-form-container">
      <div className="logo">instagram</div>

      {errors.general && <div className="error-message">{errors.general}</div>}
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      <div className="form-group">
        <label htmlFor="email">Email or username</label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="Phone number, username, or email"
          value={formData.email}
          onChange={handleChange}
          disabled={isLoading}
          autoComplete="username"
        />
        {errors.email && <div className="error-message">{errors.email}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          disabled={isLoading}
          autoComplete="current-password"
        />
        {errors.password && (
          <div className="error-message">{errors.password}</div>
        )}
      </div>

      <button
        type="submit"
        className="login-button"
        disabled={isLoading}
      >
        {isLoading ? 'Logging in...' : 'Log in'}
      </button>

      <div className="divider">or</div>

      <button
        type="button"
        className="facebook-login"
        onClick={handleFacebookLogin}
        disabled={isLoading}
      >
        Log in with Facebook
      </button>

      <div className="forgot-password">
        <a onClick={handleForgotPassword}>Forgot password?</a>
      </div>

      <div className="signup-prompt">
        Don't have an account? <a href="#">Sign up</a>
      </div>
    </form>
  )
}
