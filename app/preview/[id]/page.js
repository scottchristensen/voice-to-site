'use client'

import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'

// We need to fetch data on the client side for the countdown to work
export default function PreviewPage({ params }) {
  const [site, setSite] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [customSlug, setCustomSlug] = useState('')
  const [claimType, setClaimType] = useState('free') // 'free' or 'custom'

  // Fetch site data
  useEffect(() => {
    async function fetchSite() {
      const { id } = await params
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_KEY
      )

      const { data, error } = await supabase
        .from('generated_sites')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        setError('Site not found')
      } else {
        setSite(data)
        // Calculate time left based on created_at (10 min from creation)
        const created = new Date(data.created_at)
        const expiresAt = new Date(created.getTime() + 10 * 60 * 1000)
        const now = new Date()
        const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000))
        setTimeLeft(remaining)
      }
      setLoading(false)
    }
    fetchSite()
  }, [params])

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0 || site?.payment_status === 'paid') return

    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, site?.payment_status])

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading preview...</p>
      </div>
    )
  }

  if (error || !site) {
    return (
      <div style={styles.notFound}>
        <h1 style={styles.notFoundTitle}>Site not found</h1>
        <p style={styles.notFoundText}>This preview doesn't exist.</p>
        <a href="/" style={styles.notFoundButton}>
          Create a New Site
        </a>
      </div>
    )
  }

  const isPaid = site.payment_status === 'paid'
  const isExpired = timeLeft <= 0 && !isPaid
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://voice-to-site.vercel.app'

  // Expired site - show blurred preview with urgency CTA
  if (isExpired) {
    return (
      <div style={styles.container}>
        <div style={styles.expiredOverlay}>
          <div style={styles.expiredCard}>
            <div style={styles.expiredIcon}>⏰</div>
            <h1 style={styles.expiredTitle}>Preview Expired</h1>
            <p style={styles.expiredText}>
              This preview for <strong>{site.business_name || 'your business'}</strong> has expired.
              But don't worry - you can create a new one in minutes!
            </p>
            <a href="/" style={styles.expiredButton}>
              Create a New Site
            </a>
            <p style={styles.expiredSubtext}>
              Or claim this exact design before it's gone forever
            </p>
            <div style={styles.expiredActions}>
              <button
                onClick={() => setShowClaimModal(true)}
                style={styles.claimButtonYellow}
              >
                Claim This Site - $49
              </button>
            </div>
          </div>
        </div>

        <iframe
          srcDoc={site.html_code}
          style={styles.blurredIframe}
          title="Website Preview (Expired)"
        />

        {showClaimModal && (
          <ClaimModal
            site={site}
            baseUrl={baseUrl}
            customSlug={customSlug}
            setCustomSlug={setCustomSlug}
            claimType={claimType}
            setClaimType={setClaimType}
            onClose={() => setShowClaimModal(false)}
          />
        )}
      </div>
    )
  }

  // Active preview - show with countdown
  return (
    <div style={styles.container}>
      {/* Subtle Countdown Banner - only show if not paid */}
      {!isPaid && (
        <div style={styles.countdownBanner}>
          <div style={styles.countdownLeft}>
            <span style={styles.clockIcon}>⏱</span>
            <span style={styles.countdownText}>
              Preview expires in <strong>{formatTime(timeLeft)}</strong>
            </span>
          </div>
          <button
            onClick={() => setShowClaimModal(true)}
            style={styles.claimNowButton}
          >
            Claim Your Site
          </button>
        </div>
      )}

      {/* Main Banner */}
      <div style={styles.mainBanner}>
        <div style={styles.bannerLeft}>
          <strong>
            {isPaid ? '✓ ' : ''}
            {site.business_name || 'Your Website'}
          </strong>
          {!isPaid && site.slug && (
            <span style={styles.slugPreview}>
              {baseUrl}/s/{site.slug}
            </span>
          )}
          {isPaid && site.slug && (
            <a
              href={`${baseUrl}/s/${site.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.liveLink}
            >
              {baseUrl}/s/{site.slug} →
            </a>
          )}
        </div>
        {!isPaid && (
          <div style={styles.bannerButtons}>
            <button
              onClick={() => { setClaimType('free'); setShowClaimModal(true) }}
              style={styles.freeButton}
            >
              Claim Free
            </button>
            <button
              onClick={() => { setClaimType('custom'); setShowClaimModal(true) }}
              style={styles.upgradeButton}
            >
              Custom URL - $29
            </button>
            <button style={styles.premiumButton}>
              Premium - $499+
            </button>
          </div>
        )}
      </div>

      {/* Website Preview */}
      <iframe
        srcDoc={site.html_code}
        style={styles.iframe}
        title="Website Preview"
      />

      {/* Claim Modal */}
      {showClaimModal && (
        <ClaimModal
          site={site}
          baseUrl={baseUrl}
          customSlug={customSlug}
          setCustomSlug={setCustomSlug}
          claimType={claimType}
          setClaimType={setClaimType}
          onClose={() => setShowClaimModal(false)}
        />
      )}

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// Claim Modal Component
function ClaimModal({ site, baseUrl, customSlug, setCustomSlug, claimType, setClaimType, onClose }) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [error, setError] = useState(null)

  const handleClaim = async () => {
    if (!email) return
    setIsSubmitting(true)
    setError(null)

    try {
      // For paid options, redirect to Stripe Checkout
      if (claimType === 'custom') {
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteId: site.id,
            productType: 'custom_url',
            email,
            customSlug: customSlug || null,
          })
        })

        const data = await response.json()

        if (data.url) {
          // Redirect to Stripe Checkout
          window.location.href = data.url
          return
        } else {
          setError(data.error || 'Failed to create checkout session')
        }
      } else {
        // Free claim - use existing endpoint
        const response = await fetch('/api/claim-site', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteId: site.id,
            email,
            customSlug: null,
            claimType: 'free'
          })
        })

        if (response.ok) {
          setClaimed(true)
        } else {
          const data = await response.json()
          setError(data.error || 'Failed to claim site')
        }
      }
    } catch (err) {
      console.error('Claim error:', err)
      setError('Something went wrong. Please try again.')
    }
    setIsSubmitting(false)
  }

  const finalSlug = claimType === 'custom' && customSlug ? customSlug : site.slug

  if (claimed) {
    return (
      <div style={styles.modalOverlay} onClick={onClose}>
        <div style={styles.modal} onClick={e => e.stopPropagation()}>
          <div style={styles.successIcon}>🎉</div>
          <h2 style={styles.modalTitle}>Site Claimed!</h2>
          <p style={styles.modalText}>
            Your website is now live at:
          </p>
          <a
            href={`${baseUrl}/s/${finalSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.liveUrlBox}
          >
            {baseUrl}/s/{finalSlug}
          </a>
          <p style={styles.modalSubtext}>
            We've sent a confirmation to {email}
          </p>
          <button onClick={onClose} style={styles.doneButton}>
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={styles.closeButton}>×</button>

        <h2 style={styles.modalTitle}>Claim Your Website</h2>
        <p style={styles.modalText}>
          Publish your site and get a permanent link to share.
        </p>

        {/* Plan Toggle */}
        <div style={styles.planToggle}>
          <button
            onClick={() => setClaimType('free')}
            style={{
              ...styles.planOption,
              ...(claimType === 'free' ? styles.planOptionActive : {})
            }}
          >
            <span style={styles.planName}>Free</span>
            <span style={styles.planPrice}>$0</span>
          </button>
          <button
            onClick={() => setClaimType('custom')}
            style={{
              ...styles.planOption,
              ...(claimType === 'custom' ? styles.planOptionActive : {})
            }}
          >
            <span style={styles.planName}>Custom URL</span>
            <span style={styles.planPrice}>$29</span>
          </button>
        </div>

        {/* URL Preview */}
        <div style={styles.urlSection}>
          <label style={styles.urlLabel}>Your site URL:</label>
          {claimType === 'free' ? (
            <div style={styles.urlPreviewBox}>
              {baseUrl}/s/<strong>{site.slug}</strong>
            </div>
          ) : (
            <div style={styles.urlInputWrapper}>
              <span style={styles.urlPrefix}>{baseUrl}/s/</span>
              <input
                type="text"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="your-custom-name"
                style={styles.urlInput}
              />
            </div>
          )}
        </div>

        {/* Email Input */}
        <div style={styles.emailSection}>
          <label style={styles.urlLabel}>Your email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={styles.emailInput}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleClaim}
          disabled={!email || isSubmitting}
          style={{
            ...styles.submitButton,
            opacity: (!email || isSubmitting) ? 0.6 : 1
          }}
        >
          {isSubmitting ? 'Processing...' : claimType === 'free' ? 'Publish Free' : 'Continue to Payment'}
        </button>

        <p style={styles.termsText}>
          {claimType === 'custom' ? 'You\'ll be redirected to Stripe to complete payment.' : 'By claiming, you agree to our terms of service.'}
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  loading: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'system-ui',
    color: '#666',
    gap: '16px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #eee',
    borderTopColor: '#667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  // Not Found
  notFound: {
    padding: '40px',
    textAlign: 'center',
    fontFamily: 'system-ui',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f5f5',
  },
  notFoundTitle: {
    fontSize: '2rem',
    marginBottom: '1rem',
  },
  notFoundText: {
    color: '#666',
  },
  notFoundButton: {
    marginTop: '1.5rem',
    padding: '12px 24px',
    background: '#667eea',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '6px',
    fontWeight: '600',
  },
  // Countdown Banner (subtle, not red)
  countdownBanner: {
    background: '#f8f9fa',
    color: '#555',
    padding: '10px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontFamily: 'system-ui',
    fontSize: '14px',
    borderBottom: '1px solid #eee',
  },
  countdownLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  clockIcon: {
    fontSize: '16px',
  },
  countdownText: {
    color: '#666',
  },
  claimNowButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '13px',
  },
  // Main Banner
  mainBanner: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontFamily: 'system-ui',
    flexWrap: 'wrap',
    gap: '12px',
  },
  bannerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  slugPreview: {
    opacity: 0.8,
    fontSize: '13px',
  },
  liveLink: {
    color: 'white',
    opacity: 0.9,
    fontSize: '13px',
  },
  bannerButtons: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  freeButton: {
    background: 'white',
    color: '#667eea',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  upgradeButton: {
    background: 'rgba(255,255,255,0.15)',
    color: 'white',
    border: '2px solid white',
    padding: '10px 20px',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  premiumButton: {
    background: '#ffd700',
    color: '#333',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  iframe: {
    flex: 1,
    border: 'none',
    width: '100%',
  },
  // Expired State
  expiredOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    fontFamily: 'system-ui',
  },
  expiredCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '48px',
    maxWidth: '500px',
    textAlign: 'center',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
  },
  expiredIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  expiredTitle: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '16px',
    color: '#1a1a2e',
  },
  expiredText: {
    color: '#555',
    lineHeight: '1.6',
    marginBottom: '24px',
  },
  expiredButton: {
    display: 'inline-block',
    padding: '14px 32px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '16px',
  },
  expiredSubtext: {
    marginTop: '24px',
    marginBottom: '12px',
    color: '#888',
    fontSize: '14px',
  },
  expiredActions: {
    display: 'flex',
    justifyContent: 'center',
  },
  claimButtonYellow: {
    padding: '10px 24px',
    background: '#ffd700',
    color: '#333',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  blurredIframe: {
    flex: 1,
    border: 'none',
    width: '100%',
    filter: 'blur(8px)',
    pointerEvents: 'none',
  },
  // Modal
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    fontFamily: 'system-ui',
  },
  modal: {
    background: 'white',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '450px',
    width: '90%',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: '12px',
    right: '16px',
    background: 'none',
    border: 'none',
    fontSize: '28px',
    color: '#999',
    cursor: 'pointer',
    lineHeight: 1,
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: '8px',
    color: '#1a1a2e',
  },
  modalText: {
    color: '#666',
    marginBottom: '24px',
  },
  planToggle: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
  },
  planOption: {
    flex: 1,
    padding: '16px',
    border: '2px solid #eee',
    borderRadius: '10px',
    background: 'white',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s',
  },
  planOptionActive: {
    borderColor: '#667eea',
    background: '#f8f7ff',
  },
  planName: {
    display: 'block',
    fontWeight: '600',
    marginBottom: '4px',
    color: '#1a1a2e',
  },
  planPrice: {
    display: 'block',
    fontSize: '20px',
    fontWeight: '700',
    color: '#667eea',
  },
  urlSection: {
    marginBottom: '20px',
  },
  urlLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '8px',
    color: '#555',
  },
  urlPreviewBox: {
    padding: '12px 16px',
    background: '#f5f5f5',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#666',
    wordBreak: 'break-all',
  },
  urlInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    border: '2px solid #eee',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  urlPrefix: {
    padding: '12px',
    background: '#f5f5f5',
    fontSize: '14px',
    color: '#888',
    whiteSpace: 'nowrap',
  },
  urlInput: {
    flex: 1,
    padding: '12px',
    border: 'none',
    outline: 'none',
    fontSize: '14px',
  },
  emailSection: {
    marginBottom: '24px',
  },
  emailInput: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #eee',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  errorBox: {
    padding: '12px 16px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#dc2626',
    fontSize: '14px',
    marginBottom: '16px',
  },
  submitButton: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '16px',
    cursor: 'pointer',
  },
  termsText: {
    marginTop: '16px',
    fontSize: '12px',
    color: '#999',
    textAlign: 'center',
  },
  // Success state
  successIcon: {
    fontSize: '64px',
    textAlign: 'center',
    marginBottom: '16px',
  },
  liveUrlBox: {
    display: 'block',
    padding: '16px',
    background: '#f0fdf4',
    border: '1px solid #86efac',
    borderRadius: '8px',
    color: '#166534',
    textDecoration: 'none',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: '16px',
    wordBreak: 'break-all',
  },
  modalSubtext: {
    color: '#888',
    fontSize: '14px',
    textAlign: 'center',
    marginBottom: '20px',
  },
  doneButton: {
    width: '100%',
    padding: '12px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
  },
}
