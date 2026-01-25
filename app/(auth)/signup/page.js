'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDarkMode(darkModeMediaQuery.matches)
    const handleChange = (e) => setIsDarkMode(e.matches)
    darkModeMediaQuery.addEventListener('change', handleChange)
    return () => darkModeMediaQuery.removeEventListener('change', handleChange)
  }, [])

  const supabase = createClient()

  const handleEmailSignup = async (e) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  const handleOAuthSignup = async (provider) => {
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={styles.successContainer}>
        <div style={styles.successIcon}>✉️</div>
        <h1 style={{
          ...styles.title,
          ...(isDarkMode && styles.titleDark)
        }}>Check your email</h1>
        <p style={{
          ...styles.successText,
          ...(isDarkMode && styles.subtitleDark)
        }}>
          We've sent a confirmation link to <strong>{email}</strong>.
          Click the link to activate your account.
        </p>
        <a href="/login" style={styles.backLink}>Back to login</a>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{
        ...styles.title,
        ...(isDarkMode && styles.titleDark)
      }}>Create your account</h1>
      <p style={{
        ...styles.subtitle,
        ...(isDarkMode && styles.subtitleDark)
      }}>Start building and managing your sites</p>

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {/* SSO Buttons */}
      <div style={styles.ssoContainer}>
        <button
          onClick={() => handleOAuthSignup('google')}
          disabled={loading}
          style={{
            ...styles.ssoButton,
            ...(isDarkMode && styles.ssoButtonDark)
          }}
        >
          <GoogleIcon />
          Continue with Google
        </button>
      </div>

      {/* Divider */}
      <div style={styles.divider}>
        <span style={{
          ...styles.dividerText,
          ...(isDarkMode && styles.dividerTextDark)
        }}>or sign up with email</span>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleEmailSignup} style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={{
            ...styles.label,
            ...(isDarkMode && styles.labelDark)
          }}>Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Smith"
            required
            style={{
              ...styles.input,
              ...(isDarkMode && styles.inputDark)
            }}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={{
            ...styles.label,
            ...(isDarkMode && styles.labelDark)
          }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            style={{
              ...styles.input,
              ...(isDarkMode && styles.inputDark)
            }}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={{
            ...styles.label,
            ...(isDarkMode && styles.labelDark)
          }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={8}
            style={{
              ...styles.input,
              ...(isDarkMode && styles.inputDark)
            }}
          />
          <span style={styles.hint}>Must be at least 8 characters</span>
        </div>

        <div style={styles.inputGroup}>
          <label style={{
            ...styles.label,
            ...(isDarkMode && styles.labelDark)
          }}>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            style={{
              ...styles.input,
              ...(isDarkMode && styles.inputDark)
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            ...styles.submitButton,
            ...(loading && styles.submitButtonDisabled)
          }}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      {/* Login Link */}
      <p style={{
        ...styles.loginText,
        ...(isDarkMode && styles.loginTextDark)
      }}>
        Already have an account?{' '}
        <a href="/login" style={styles.loginLink}>Sign in</a>
      </p>
    </div>
  )
}

// Icons (same as login page)
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '12px' }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}


const styles = {
  title: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '8px',
    color: '#1a1a2e',
    textAlign: 'center',
  },
  titleDark: {
    color: '#ffffff',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '32px',
    textAlign: 'center',
  },
  subtitleDark: {
    color: '#999',
  },
  error: {
    background: '#fee2e2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '24px',
    fontSize: '14px',
  },
  ssoContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px',
  },
  ssoButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 16px',
    background: 'white',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  ssoButtonDark: {
    background: '#2a2a3e',
    border: '1px solid #3a3a4e',
    color: '#e5e5e5',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '24px 0',
  },
  dividerText: {
    flex: 1,
    textAlign: 'center',
    fontSize: '13px',
    color: '#888',
    position: 'relative',
  },
  dividerTextDark: {
    color: '#666',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },
  labelDark: {
    color: '#e5e5e5',
  },
  hint: {
    fontSize: '12px',
    color: '#888',
    marginTop: '4px',
  },
  input: {
    padding: '12px 16px',
    fontSize: '15px',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
    background: 'white',
    color: '#333',
  },
  inputDark: {
    background: '#2a2a3e',
    border: '1px solid #3a3a4e',
    color: '#e5e5e5',
  },
  submitButton: {
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
    marginTop: '8px',
  },
  submitButtonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  loginText: {
    textAlign: 'center',
    marginTop: '24px',
    fontSize: '14px',
    color: '#666',
  },
  loginTextDark: {
    color: '#999',
  },
  loginLink: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: '500',
  },
  successContainer: {
    textAlign: 'center',
    padding: '20px 0',
  },
  successIcon: {
    fontSize: '64px',
    marginBottom: '24px',
  },
  successText: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '24px',
    lineHeight: '1.6',
  },
  backLink: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: '500',
    fontSize: '14px',
  },
}
