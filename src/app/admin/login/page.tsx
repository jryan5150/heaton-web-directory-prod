'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
                disabled={loading}
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
                disabled={loading}
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
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: loading ? 'var(--gray-300)' : 'linear-gradient(135deg, var(--heaton-navy) 0%, #163d6b 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
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
