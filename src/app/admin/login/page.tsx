'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'

function getErrorMessage(code: string | null): string {
  switch (code) {
    case 'AccessDenied':
      return 'Access denied. Your account is not registered as an admin.'
    case 'NoSession':
      return 'Sign-in session expired. Please try again.'
    case 'NotRegistered':
      return 'Your account is not registered as an admin. Contact your administrator.'
    case 'CallbackError':
      return 'Something went wrong during sign-in. Please try again.'
    case 'OAuthSignin':
    case 'OAuthCallback':
      return 'Microsoft sign-in failed. Please try again.'
    default:
      return code ? 'Sign-in failed. Please try again.' : ''
  }
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a1f38 0%, #0f2b4c 50%, #163d6b 100%)',
      }}>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(() => getErrorMessage(searchParams.get('error')))
  const [loading, setLoading] = useState(false)
  const [msLoading, setMsLoading] = useState(false)

  const handleMicrosoftSignIn = async () => {
    setError('')
    setMsLoading(true)
    try {
      await signIn('microsoft-entra-id', {
        callbackUrl: '/api/admin/microsoft-callback',
      })
    } catch {
      setError('Failed to initiate Microsoft sign-in.')
      setMsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/admin')
        router.refresh()
      } else {
        setError(data.error || 'Login failed')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isLoading = loading || msLoading

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a1f38 0%, #0f2b4c 50%, #163d6b 100%)',
      padding: '24px'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            backdropFilter: 'blur(8px)'
          }}>
            <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.85)" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-heading), Roboto Condensed, sans-serif',
            fontSize: '20px',
            fontWeight: '700',
            color: 'white',
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            marginBottom: '4px'
          }}>
            Heaton Eye Associates
          </h1>
          <p style={{
            fontSize: '13px',
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: '0.04em'
          }}>
            Admin Portal
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px 36px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--gray-800)',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            Sign in
          </h2>

          {error && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(220, 38, 38, 0.06)',
              border: '1px solid rgba(220, 38, 38, 0.15)',
              borderRadius: '8px',
              marginBottom: '20px',
              color: '#dc2626',
              fontSize: '13px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {/* Microsoft SSO — Primary */}
          <button
            type="button"
            onClick={handleMicrosoftSignIn}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '11px 16px',
              background: msLoading ? '#f3f4f6' : '#ffffff',
              color: '#3c4043',
              border: '1px solid #dadce0',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              transition: 'background 0.2s ease, box-shadow 0.2s ease',
              opacity: isLoading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = '#f8f9fa'
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = '#ffffff'
                e.currentTarget.style.boxShadow = 'none'
              }
            }}
          >
            <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
              <rect x="1" y="1" width="9" height="9" fill="#F25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
              <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
            </svg>
            {msLoading ? 'Redirecting to Microsoft...' : 'Sign in with Microsoft'}
          </button>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '24px 0',
            gap: '12px',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--gray-200)' }} />
            <span style={{ fontSize: '12px', color: 'var(--gray-400)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              or sign in with email
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--gray-200)' }} />
          </div>

          {/* Email / Password — Fallback */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                marginBottom: '6px',
                color: 'var(--gray-600)'
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid var(--gray-200)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  color: 'var(--gray-800)'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--heaton-blue)'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(58,128,222,0.1)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--gray-200)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
                placeholder="your.email@heatoneye.com"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                marginBottom: '6px',
                color: 'var(--gray-600)'
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid var(--gray-200)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  color: 'var(--gray-800)'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--heaton-blue)'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(58,128,222,0.1)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--gray-200)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                background: isLoading ? 'var(--gray-300)' : 'linear-gradient(135deg, var(--heaton-navy) 0%, #163d6b 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{
            marginTop: '20px',
            padding: '12px',
            background: 'var(--gray-50)',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '12px', color: 'var(--gray-400)' }}>
              Contact your administrator for access
            </p>
          </div>
        </div>

        {/* Back */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link
            href="/"
            style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.5)',
              textDecoration: 'none',
              fontWeight: '500',
              transition: 'color 0.15s ease'
            }}
          >
            &larr; Back to Directory
          </Link>
        </div>
      </div>
    </div>
  )
}
