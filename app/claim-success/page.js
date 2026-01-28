'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useDarkMode } from '@/app/hooks/useDarkMode'

function ClaimSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const isDarkMode = useDarkMode()

  const [loading, setLoading] = useState(true)
  const [siteData, setSiteData] = useState(null)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

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
        <div style={{...styles.card, ...(isDarkMode && styles.cardDark)}}>
          <div style={styles.spinner}></div>
          <p style={{...styles.loadingText, ...(isDarkMode && styles.loadingTextDark)}}>Setting up your site...</p>
        </div>
      </div>
    )
  }

  if (error || !siteData) {
    return (
      <div style={styles.container}>
        <div style={{...styles.card, ...(isDarkMode && styles.cardDark)}}>
          <div style={styles.icon}>!</div>
          <h1 style={{...styles.title, ...(isDarkMode && styles.titleDark)}}>Something went wrong</h1>
          <p style={{...styles.subtitle, ...(isDarkMode && styles.subtitleDark)}}>{error || 'Unable to verify your payment.'}</p>
          <a href="/" style={{...styles.secondaryButton, ...(isDarkMode && styles.secondaryButtonDark)}}>
            Go Home
          </a>
        </div>
      </div>
    )
  }

  const liveUrl = `https://${siteData.subdomain}.speakyour.site`

  return (
    <div style={styles.container}>
      <div style={{...styles.card, ...(isDarkMode && styles.cardDark)}}>
        <div style={styles.icon}>&#127881;</div>
        <h1 style={{...styles.title, ...(isDarkMode && styles.titleDark)}}>Your Site is Live!</h1>
        <p style={{...styles.subtitle, ...(isDarkMode && styles.subtitleDark)}}>
          Congratulations! Your website for <strong>{siteData.businessName}</strong> is now live.
        </p>

        <a
          href={liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{...styles.urlBox, ...(isDarkMode && styles.urlBoxDark)}}
        >
          {liveUrl}
        </a>

        <div style={styles.shareSection}>
          <p style={{...styles.shareLabel, ...(isDarkMode && styles.shareLabelDark)}}>Share your new site</p>
          <div style={styles.shareButtons}>
            <button
              onClick={() => {
                navigator.clipboard.writeText(liveUrl)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              style={{...styles.shareButton, ...(isDarkMode && styles.shareButtonDark)}}
              title="Copy link"
            >
              {copied ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              )}
            </button>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out my new website for ${siteData.businessName}!`)}&url=${encodeURIComponent(liveUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{...styles.shareButton, ...(isDarkMode && styles.shareButtonDark)}}
              title="Share on X"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(liveUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{...styles.shareButton, ...(isDarkMode && styles.shareButtonDark)}}
              title="Share on Facebook"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(liveUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{...styles.shareButton, ...(isDarkMode && styles.shareButtonDark)}}
              title="Share on LinkedIn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent(`Check out ${siteData.businessName}`)}&body=${encodeURIComponent(`I just created a website for ${siteData.businessName}! Check it out: ${liveUrl}`)}`}
              style={{...styles.shareButton, ...(isDarkMode && styles.shareButtonDark)}}
              title="Share via Email"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </a>
          </div>
        </div>

        <div style={styles.actions}>
          <a href={liveUrl} target="_blank" rel="noopener noreferrer" style={styles.primaryButton}>
            Visit Your Site
          </a>
          <a href="/" style={{...styles.secondaryButton, ...(isDarkMode && styles.secondaryButtonDark)}}>
            Create Another Site
          </a>
        </div>

        <p style={{...styles.note, ...(isDarkMode && styles.noteDark)}}>
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
  shareSection: {
    marginBottom: '24px'
  },
  shareLabel: {
    color: '#666',
    fontSize: '14px',
    marginBottom: '12px'
  },
  shareButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center'
  },
  shareButton: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: '#f0f4f8',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#667eea',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'background 0.2s, transform 0.2s'
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
  },
  // Dark mode variants
  cardDark: {
    background: '#1a1a1a',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)'
  },
  titleDark: {
    color: '#e5e5e5'
  },
  subtitleDark: {
    color: '#999'
  },
  urlBoxDark: {
    background: '#0a0a0a',
    color: '#a5b4fc'
  },
  shareLabelDark: {
    color: '#999'
  },
  shareButtonDark: {
    background: '#0a0a0a',
    color: '#a5b4fc'
  },
  secondaryButtonDark: {
    borderColor: '#a5b4fc',
    color: '#a5b4fc'
  },
  noteDark: {
    color: '#777'
  },
  loadingTextDark: {
    color: '#999'
  }
}
