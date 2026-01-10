'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, ArrowRight } from 'lucide-react'

interface FormData {
  displayName: string
  email: string
  username: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
}

interface FormErrors {
  displayName?: string
  email?: string
  username?: string
  password?: string
  confirmPassword?: string
  general?: string
}

type Step = 'personal' | 'account' | 'password'

export default function RegisterPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>('personal')
  const [formData, setFormData] = useState<FormData>({
    displayName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
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

  const validatePersonalStep = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateAccountStep = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validatePasswordStep = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
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
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const handleNextStep = async () => {
    if (currentStep === 'personal') {
      if (validatePersonalStep()) {
        setCurrentStep('account')
      }
    } else if (currentStep === 'account') {
      if (validateAccountStep()) {
        setCurrentStep('password')
      }
    }
  }

  const handlePrevStep = () => {
    if (currentStep === 'account') {
      setCurrentStep('personal')
    } else if (currentStep === 'password') {
      setCurrentStep('account')
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSuccessMessage('')

    if (!validatePasswordStep()) {
      return
    }

    setIsLoading(true)

    try {
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
          lastName: formData.lastName || '',
          bio: 'Instagram user',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setErrors({
          general: errorData.error || 'Registration failed. Please try again.',
        })
        setIsLoading(false)
        return
      }

      setSuccessMessage('Account created successfully! Redirecting to login...')

      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (error) {
      console.error('Registration error:', error)
      setErrors({
        general: 'An error occurred during registration. Please try again.',
      })
      setIsLoading(false)
    }
  }

  const getStepNumber = () => {
    if (currentStep === 'personal') return 1
    if (currentStep === 'account') return 2
    return 3
  }

  const getStepTitle = () => {
    if (currentStep === 'personal') return 'Personal Information'
    if (currentStep === 'account') return 'Account Details'
    return 'Secure Your Account'
  }

  return (
    <div className="register-wrapper">
      <div className="register-left">
        <div className="register-left-content">
          <div className="register-logo">instagram</div>
          <p className="register-tagline">Create your account and start connecting with the world</p>
        </div>
      </div>

      <div className="register-right">
        <form onSubmit={handleSubmit} className="register-form">
          <div className="register-header">
            <div className="step-indicator">
              <div className="step-avatar">
                <User size={24} />
              </div>
            </div>
            <div className="step-info">
              <p className="step-number">STEP {getStepNumber()}</p>
              <h1 className="step-title">{getStepTitle()}</h1>
            </div>
          </div>

          {errors.general && <div className="error-message">{errors.general}</div>}
          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}

          <div className="form-content">
            {currentStep === 'personal' && (
              <div className="form-step">
                <div className="form-group">
                  <label htmlFor="displayName">Display Name *</label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    placeholder="Enter your display name"
                    value={formData.displayName}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="form-input"
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
                      className="form-input"
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
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'account' && (
              <div className="form-step">
                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="form-input"
                  />
                  {errors.email && (
                    <div className="error-message">{errors.email}</div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="username">Username *</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    placeholder="Choose a unique username"
                    value={formData.username}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="form-input"
                  />
                  {errors.username && (
                    <div className="error-message">{errors.username}</div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 'password' && (
              <div className="form-step">
                <div className="form-group">
                  <label htmlFor="password">Password *</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="At least 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="form-input"
                    autoComplete="new-password"
                  />
                  {errors.password && (
                    <div className="error-message">{errors.password}</div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password *</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="form-input"
                    autoComplete="new-password"
                  />
                  {errors.confirmPassword && (
                    <div className="error-message">{errors.confirmPassword}</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="form-actions">
            {currentStep !== 'personal' && (
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={isLoading}
                className="btn-secondary"
              >
                Back
              </button>
            )}

            {currentStep !== 'password' ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={isLoading}
                className="btn-primary"
              >
                Continue
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            )}
          </div>

          <div className="form-footer">
            Already have an account?{' '}
            <a href="/" className="link">
              Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
