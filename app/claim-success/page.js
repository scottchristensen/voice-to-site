'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

function ClaimSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [loading, setLoading] = useState(true)
  const [siteData, setSiteData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchSessionData() {
      if (!sessionId) {
        setError('No session ID provided')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/verify-session?session_id=${sessionId}`)
        const data = await response.json()

        if (data.error) {
          setError(data.error)
        } else {
          setSiteData(data)
        }
      } catch {
        setError('Failed to load session data')
      }

      setLoading(false)
    }

    fetchSessionData()
  }, [sessionId])

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Setting up your site...</p>
        </div>
      </div>
    )
  }

  if (error || !siteData) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.icon}>!</div>
          <h1 style={styles.title}>Something went wrong</h1>
          <p style={styles.subtitle}>{error || 'Unable to verify your payment.'}</p>
          <a href="/" style={styles.secondaryButton}>
            Go Home
          </a>
        </div>
      </div>
    )
  }

  const liveUrl = `https://${siteData.subdomain}.speakyour.site`

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>&#127881;</div>
        <h1 style={styles.title}>Your Site is Live!</h1>
        <p style={styles.subtitle}>
          Congratulations! Your website for <strong>{siteData.businessName}</strong> is now live.
        </p>

        <a
          href={liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.urlBox}
        >
          {liveUrl}
        </a>

        <div style={styles.actions}>
          <a href={liveUrl} target="_blank" rel="noopener noreferrer" style={styles.primaryButton}>
            Visit Your Site
          </a>
          <a href="/" style={styles.secondaryButton}>
            Create Another Site
          </a>
        </div>

        <p style={styles.note}>
          A confirmation email has been sent to {siteData.email}.
        </p>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading...</p>
      </div>
    </div>
  )
}

export default function ClaimSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ClaimSuccessContent />
    </Suspense>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  card: {
    background: 'white',
    borderRadius: '20px',
    padding: '48px',
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)'
  },
  icon: {
    fontSize: '64px',
    marginBottom: '16px'
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '12px',
    color: '#1a1a2e'
  },
  subtitle: {
    color: '#666',
    marginBottom: '24px',
    lineHeight: '1.6'
  },
  urlBox: {
    display: 'block',
    padding: '16px 24px',
    background: '#f0f4f8',
    borderRadius: '8px',
    color: '#667eea',
    fontWeight: '600',
    textDecoration: 'none',
    marginBottom: '24px',
    wordBreak: 'break-all'
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  primaryButton: {
    padding: '14px 28px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: '600'
  },
  secondaryButton: {
    padding: '14px 28px',
    background: 'transparent',
    border: '2px solid #667eea',
    color: '#667eea',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: '600'
  },
  note: {
    marginTop: '24px',
    color: '#888',
    fontSize: '14px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px'
  },
  loadingText: {
    color: '#666'
  }
}
