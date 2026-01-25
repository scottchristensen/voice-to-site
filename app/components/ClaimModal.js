'use client'

import { useState, useEffect } from 'react'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

const TIERS = [
  {
    id: 'basic',
    name: 'Basic',
    price: '$9',
    period: '/mo',
    features: [
      'Hosting included',
      'Custom subdomain',
      'Contact forms',
      'Email notifications'
    ],
    popular: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29',
    period: '/mo',
    features: [
      'Everything in Basic',
      'Unlimited AI edits',
      'Priority support'
    ],
    popular: true
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$59',
    period: '/mo',
    features: [
      'Everything in Pro',
      '3 designer edits/month',
      'Human-reviewed changes'
    ],
    popular: false
  }
]

export default function ClaimModal({ site, isOpen, onClose }) {
  const [selectedTier, setSelectedTier] = useState('pro')
  const [subdomain, setSubdomain] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [isAvailable, setIsAvailable] = useState(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [availabilityError, setAvailabilityError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [usePassword, setUsePassword] = useState(false)
  const isMobile = useIsMobile()

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
    setEmailError('')
    setError('')

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address')
      return
    }

    if (!isAvailable) return

    // Validate password if using password auth
    if (usePassword) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: site.id,
          subdomain,
          email,
          phone,
          tier: selectedTier,
          password: usePassword ? password : null
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

  const selectedTierData = TIERS.find(t => t.id === selectedTier)

  if (!isOpen) return null

  return (
    <div style={{
      ...styles.overlay,
      ...(isMobile ? { padding: 0 } : {})
    }} onClick={onClose}>
      <div style={{
        ...styles.modal,
        ...(isMobile ? {
          maxWidth: '100%',
          height: '100vh',
          maxHeight: '100vh',
          borderRadius: 0,
          padding: 0,
        } : {})
      }} onClick={e => e.stopPropagation()}>
        {/* Sticky Header */}
        <div style={{
          ...(isMobile ? {
            position: 'sticky',
            top: 0,
            background: 'white',
            padding: '16px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10,
          } : { position: 'relative' })
        }}>
          <h2 style={{...styles.title, ...(isMobile ? { margin: 0, textAlign: 'left' } : {})}}>Choose Your Plan</h2>
          <button onClick={onClose} style={styles.closeX}>&times;</button>
        </div>

        <div style={isMobile ? { padding: '16px', paddingBottom: '100px', overflowY: 'auto' } : {}}>
          <p style={styles.subtitle}>
            Your site: <strong>{subdomain || 'yoursite'}.speakyour.site</strong>
          </p>

          {/* Tier Selector */}
          <div style={styles.tierGrid}>
            {TIERS.map((tier) => (
              <button
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                style={{
                  ...styles.tierCard,
                  ...(selectedTier === tier.id ? styles.tierCardSelected : {})
                }}
              >
              {tier.popular && <span style={styles.popularBadge}>Most Popular</span>}
              <div style={styles.tierName}>{tier.name}</div>
              <div style={styles.tierPrice}>
                <span style={styles.priceAmount}>{tier.price}</span>
                <span style={styles.pricePeriod}>{tier.period}</span>
              </div>
              <ul style={styles.tierFeatures}>
                {tier.features.map((feature, i) => (
                  <li key={i} style={styles.tierFeature}>
                    <span style={styles.checkIcon}>&#10003;</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <form id="claim-form" onSubmit={handleSubmit}>
          {/* Subdomain Input */}
          <div style={styles.field}>
            <label style={styles.label}>Your Subdomain</label>
            <div style={{
              ...styles.subdomainFieldWrapper,
              borderColor: isAvailable === true ? '#22c55e' : isAvailable === false ? '#ef4444' : '#e0e0e0'
            }}>
              <input
                type="text"
                value={subdomain}
                onChange={handleSubdomainChange}
                style={styles.subdomainInput}
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
              onChange={(e) => {
                setEmail(e.target.value)
                setEmailError('')
              }}
              style={{
                ...styles.input,
                ...(emailError ? { borderColor: '#ef4444' } : {})
              }}
              placeholder="you@example.com"
            />
            {emailError && <p style={styles.fieldError}>{emailError}</p>}
          </div>

          {/* Account Creation Option */}
          <div style={styles.accountOption}>
            <div style={styles.accountToggle}>
              <input
                type="checkbox"
                id="usePassword"
                checked={usePassword}
                onChange={(e) => setUsePassword(e.target.checked)}
                style={styles.checkbox}
              />
              <label htmlFor="usePassword" style={styles.checkboxLabel}>
                Create account with password
              </label>
            </div>
            <p style={styles.accountHint}>
              {usePassword
                ? 'Set a password to access your dashboard'
                : 'Or sign in with Google after checkout'}
            </p>
          </div>

          {/* Password Fields (conditional) */}
          {usePassword && (
            <>
              <div style={styles.field}>
                <label style={styles.label}>Password *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                  placeholder="At least 8 characters"
                  minLength={8}
                  required={usePassword}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Confirm Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    ...styles.input,
                    borderColor: confirmPassword && password !== confirmPassword ? '#ef4444' : '#e0e0e0'
                  }}
                  placeholder="Confirm your password"
                  required={usePassword}
                />
                {confirmPassword && password !== confirmPassword && (
                  <span style={styles.unavailable}>Passwords do not match</span>
                )}
              </div>
            </>
          )}

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

          {/* Submit Button (non-mobile) */}
          {!isMobile && (
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                ...styles.submitButton,
                opacity: isSubmitting ? 0.6 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? 'Redirecting to Checkout...' : 'Continue to Payment'}
            </button>
          )}
        </form>
        </div>

        {/* Sticky CTA Footer (mobile) */}
        {isMobile && (
          <div style={styles.stickyFooter}>
            <button
              type="submit"
              form="claim-form"
              disabled={isSubmitting}
              style={{
                ...styles.submitButton,
                opacity: isSubmitting ? 0.6 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? 'Redirecting to Checkout...' : 'Continue to Payment'}
            </button>
          </div>
        )}
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
    padding: '32px',
    maxWidth: '680px',
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
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: '4px',
    color: '#1a1a2e',
    textAlign: 'center'
  },
  subtitle: {
    color: '#666',
    marginBottom: '20px',
    textAlign: 'center',
    fontSize: '14px'
  },
  tierGrid: {
    display: 'flex',
    overflowX: 'auto',
    gap: '12px',
    marginBottom: '24px',
    paddingBottom: '8px',
    scrollSnapType: 'x mandatory',
    WebkitOverflowScrolling: 'touch',
  },
  tierCard: {
    position: 'relative',
    padding: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    background: 'white',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s',
    minWidth: '200px',
    flexShrink: 0,
    scrollSnapAlign: 'start',
  },
  tierCardSelected: {
    borderColor: '#2563eb',
    background: '#eff6ff',
    boxShadow: '0 0 0 1px #2563eb',
  },
  popularBadge: {
    position: 'absolute',
    top: '-10px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#2563eb',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  tierName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '4px',
  },
  tierPrice: {
    marginBottom: '12px',
  },
  priceAmount: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
  },
  pricePeriod: {
    fontSize: '14px',
    color: '#6b7280',
  },
  tierFeatures: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    fontSize: '12px',
    color: '#4b5563',
  },
  tierFeature: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '6px',
    marginBottom: '4px',
    lineHeight: '1.4',
  },
  checkIcon: {
    color: '#22c55e',
    fontWeight: '600',
    flexShrink: 0,
  },
  field: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    fontWeight: '600',
    marginBottom: '6px',
    color: '#333',
    fontSize: '14px'
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  },
  subdomainFieldWrapper: {
    display: 'flex',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '2px solid #e0e0e0',
    transition: 'border-color 0.2s',
  },
  subdomainInput: {
    flex: 1,
    padding: '12px 14px',
    border: 'none',
    borderRadius: 0,
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  suffix: {
    padding: '12px 14px',
    background: '#f5f5f5',
    borderLeft: '1px solid #e0e0e0',
    color: '#666',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px'
  },
  availabilityRow: {
    marginTop: '6px',
    minHeight: '18px'
  },
  checking: {
    color: '#888',
    fontSize: '13px'
  },
  available: {
    color: '#22c55e',
    fontSize: '13px',
    fontWeight: '500'
  },
  unavailable: {
    color: '#ef4444',
    fontSize: '13px'
  },
  error: {
    color: '#ef4444',
    marginBottom: '16px',
    padding: '12px',
    background: '#fef2f2',
    borderRadius: '8px',
    fontSize: '14px'
  },
  submitButton: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  fieldError: {
    color: '#ef4444',
    fontSize: '13px',
    marginTop: '4px',
    margin: 0,
  },
  stickyFooter: {
    position: 'sticky',
    bottom: 0,
    background: 'white',
    padding: '16px',
    borderTop: '1px solid #e5e7eb',
    paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
  },
  accountOption: {
    marginBottom: '20px',
    padding: '16px',
    background: '#f8fafc',
    borderRadius: '8px'
  },
  accountToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer'
  },
  checkboxLabel: {
    fontWeight: '500',
    color: '#333',
    cursor: 'pointer'
  },
  accountHint: {
    fontSize: '13px',
    color: '#666',
    marginTop: '6px',
    marginLeft: '26px'
  }
}
