'use client'

import { useState, useEffect } from 'react'

export default function ClaimModal({ site, isOpen, onClose }) {
  const [subdomain, setSubdomain] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isAvailable, setIsAvailable] = useState(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [availabilityError, setAvailabilityError] = useState('')

  // Auto-suggest subdomain from business name
  useEffect(() => {
    if (site?.business_name && !subdomain) {
      const suggested = site.business_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 63)
      setSubdomain(suggested)
    }
  }, [site?.business_name, subdomain])

  // Check availability with debounce
  useEffect(() => {
    if (!subdomain || subdomain.length < 3) {
      setIsAvailable(null)
      setAvailabilityError('')
      return
    }

    setIsChecking(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-subdomain?subdomain=${subdomain}`)
        const data = await res.json()
        setIsAvailable(data.available)
        if (!data.available && data.error) {
          setAvailabilityError(data.error)
        } else {
          setAvailabilityError('')
        }
      } catch {
        setIsAvailable(null)
        setAvailabilityError('Error checking availability')
      }
      setIsChecking(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [subdomain])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isAvailable || !email) return

    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: site.id,
          subdomain,
          email,
          phone
        })
      })

      const data = await res.json()

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        setError(data.error || 'Failed to create checkout')
        setIsSubmitting(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleSubdomainChange = (e) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setSubdomain(value)
  }

  if (!isOpen) return null

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={styles.closeX}>&times;</button>

        <h2 style={styles.title}>Claim Your Site</h2>
        <p style={styles.subtitle}>
          Get your own URL: <strong>{subdomain || 'yoursite'}.speakyour.site</strong>
        </p>

        <form onSubmit={handleSubmit}>
          {/* Subdomain Input */}
          <div style={styles.field}>
            <label style={styles.label}>Your Subdomain</label>
            <div style={styles.subdomainWrapper}>
              <input
                type="text"
                value={subdomain}
                onChange={handleSubdomainChange}
                style={{
                  ...styles.input,
                  ...styles.subdomainInput,
                  borderColor: isAvailable === true ? '#22c55e' : isAvailable === false ? '#ef4444' : '#e0e0e0'
                }}
                placeholder="mybusiness"
                maxLength={63}
              />
              <span style={styles.suffix}>.speakyour.site</span>
            </div>
            <div style={styles.availabilityRow}>
              {isChecking && <span style={styles.checking}>Checking...</span>}
              {!isChecking && isAvailable === true && (
                <span style={styles.available}>&#10003; Available!</span>
              )}
              {!isChecking && isAvailable === false && (
                <span style={styles.unavailable}>&#10007; {availabilityError || 'Not available'}</span>
              )}
            </div>
          </div>

          {/* Email Input */}
          <div style={styles.field}>
            <label style={styles.label}>Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="you@example.com"
              required
            />
          </div>

          {/* Phone Input */}
          <div style={styles.field}>
            <label style={styles.label}>Phone (optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={styles.input}
              placeholder="(555) 123-4567"
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          {/* What you get */}
          <div style={styles.benefits}>
            <p style={styles.benefitsTitle}>What you get:</p>
            <ul style={styles.benefitsList}>
              <li>&#10003; Custom subdomain: {subdomain || 'yoursite'}.speakyour.site</li>
              <li>&#10003; SSL certificate included</li>
              <li>&#10003; Fast, reliable hosting</li>
              <li>&#10003; Cancel anytime</li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isAvailable || !email || isSubmitting}
            style={{
              ...styles.submitButton,
              opacity: (!isAvailable || !email || isSubmitting) ? 0.6 : 1,
              cursor: (!isAvailable || !email || isSubmitting) ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting ? 'Redirecting to Checkout...' : 'Continue to Payment - $29/mo'}
          </button>
        </form>

        <button onClick={onClose} style={styles.cancelButton}>
          Maybe Later
        </button>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modal: {
    position: 'relative',
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '480px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  closeX: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'none',
    border: 'none',
    fontSize: '28px',
    color: '#999',
    cursor: 'pointer',
    lineHeight: 1
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '8px',
    color: '#1a1a2e'
  },
  subtitle: {
    color: '#666',
    marginBottom: '24px'
  },
  field: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#333'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  },
  subdomainWrapper: {
    display: 'flex',
    alignItems: 'stretch'
  },
  subdomainInput: {
    borderRadius: '8px 0 0 8px',
    borderRight: 'none',
    flex: 1
  },
  suffix: {
    padding: '12px 16px',
    background: '#f5f5f5',
    border: '2px solid #e0e0e0',
    borderLeft: 'none',
    borderRadius: '0 8px 8px 0',
    color: '#666',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px'
  },
  availabilityRow: {
    marginTop: '6px',
    minHeight: '20px'
  },
  checking: {
    color: '#888',
    fontSize: '14px'
  },
  available: {
    color: '#22c55e',
    fontSize: '14px',
    fontWeight: '500'
  },
  unavailable: {
    color: '#ef4444',
    fontSize: '14px'
  },
  error: {
    color: '#ef4444',
    marginBottom: '16px',
    padding: '12px',
    background: '#fef2f2',
    borderRadius: '8px',
    fontSize: '14px'
  },
  benefits: {
    background: '#f8fafc',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px'
  },
  benefitsTitle: {
    fontWeight: '600',
    marginBottom: '8px',
    color: '#333'
  },
  benefitsList: {
    margin: 0,
    paddingLeft: '0',
    listStyle: 'none',
    color: '#555',
    fontSize: '14px',
    lineHeight: '1.8'
  },
  submitButton: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  cancelButton: {
    width: '100%',
    padding: '12px',
    background: 'transparent',
    border: 'none',
    color: '#888',
    marginTop: '12px',
    cursor: 'pointer',
    fontSize: '14px'
  }
}
