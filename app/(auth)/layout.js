'use client'

import { useEffect, useState } from 'react'

export default function AuthLayout({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDarkMode(darkModeMediaQuery.matches)
    const handleChange = (e) => setIsDarkMode(e.matches)
    darkModeMediaQuery.addEventListener('change', handleChange)
    return () => darkModeMediaQuery.removeEventListener('change', handleChange)
  }, [])

  return (
    <div style={{
      ...styles.container,
      ...(isDarkMode && styles.containerDark)
    }}>
      <div style={styles.content}>
        <a href="/" style={styles.logo}>Speak to Site</a>
        <div style={{
          ...styles.card,
          ...(isDarkMode && styles.cardDark)
        }}>
          {children}
        </div>
        <p style={{
          ...styles.footer,
          ...(isDarkMode && styles.footerDark)
        }}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)',
  },
  containerDark: {
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
  },
  content: {
    width: '100%',
    maxWidth: '420px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logo: {
    fontSize: '28px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textDecoration: 'none',
    marginBottom: '32px',
  },
  card: {
    width: '100%',
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
  },
  cardDark: {
    background: '#1a1a2e',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
  },
  footer: {
    marginTop: '24px',
    fontSize: '12px',
    color: '#888',
    textAlign: 'center',
  },
  footerDark: {
    color: '#666',
  },
}
