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
  const [step, setStep] = useState(1) // 1 = Plan, 2 = Account
  const [selectedTier, setSelectedTier] = useState('pro') // Auto-select Pro
  const [subdomain, setSubdomain] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isAvailable, setIsAvailable] = useState(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [availabilityError, setAvailabilityError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
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

  // Handle Step 1 -> Step 2 transition
  const handleContinue = () => {
    setError('')

    // Validate tier selection
    if (!selectedTier) {
      setError('Please select a plan')
      return
    }

    // Validate subdomain availability
    if (!isAvailable) {
      setError('Please enter an available subdomain')
      return
    }

    setStep(2)
  }

  // Handle Step 2 -> Payment submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setEmailError('')
    setPasswordError('')
    setError('')

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address')
      return
    }

    // Validate password
    if (!password || password.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
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
          password
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
            zIndex: 10,
          } : { position: 'relative' })
        }}>
          <button onClick={onClose} style={styles.closeX}>&times;</button>

          {/* Step Indicator */}
          <div style={styles.stepIndicator}>
            <div style={styles.stepItem}>
              <div style={{
                ...styles.stepDot,
                ...(step >= 1 ? styles.stepDotActive : {})
              }}>1</div>
              <span style={{
                ...styles.stepLabel,
                ...(step >= 1 ? styles.stepLabelActive : {})
              }}>Plan</span>
            </div>
            <div style={styles.stepLine} />
            <div style={styles.stepItem}>
              <div style={{
                ...styles.stepDot,
                ...(step >= 2 ? styles.stepDotActive : {})
              }}>2</div>
              <span style={{
                ...styles.stepLabel,
                ...(step >= 2 ? styles.stepLabelActive : {})
              }}>Account</span>
            </div>
            <div style={styles.stepLine} />
            <div style={styles.stepItem}>
              <div style={styles.stepDot}>3</div>
              <span style={styles.stepLabel}>Payment</span>
            </div>
          </div>
        </div>

        <div style={isMobile ? { padding: '16px', paddingBottom: '100px', overflowY: 'auto' } : {}}>

          {/* STEP 1: Plan Selection */}
          {step === 1 && (
            <>
              <h2 style={styles.title}>Choose Your Plan</h2>
              <p style={styles.subtitle}>
                Your site: <strong>{subdomain || 'yoursite'}.speakyour.site</strong>
              </p>

              {/* Tier Selector */}
              <div style={styles.tierGrid}>
                {TIERS.map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
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

              {error && <p style={styles.error}>{error}</p>}

              {/* Continue Button (non-mobile) */}
              {!isMobile && (
                <button
                  type="button"
                  onClick={handleContinue}
                  style={styles.submitButton}
                >
                  Continue
                </button>
              )}
            </>
          )}

          {/* STEP 2: Account Creation */}
          {step === 2 && (
            <form id="claim-form" onSubmit={handleSubmit}>
              <h2 style={styles.title}>Create Your Account</h2>
              <p style={styles.subtitle}>
                Set up your account to manage your site
              </p>

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

              {/* Password Input */}
              <div style={styles.field}>
                <label style={styles.label}>Password *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setPasswordError('')
                  }}
                  style={{
                    ...styles.input,
                    ...(passwordError ? { borderColor: '#ef4444' } : {})
                  }}
                  placeholder="At least 8 characters"
                />
              </div>

              {/* Confirm Password Input */}
              <div style={styles.field}>
                <label style={styles.label}>Confirm Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setPasswordError('')
                  }}
                  style={{
                    ...styles.input,
                    ...(passwordError ? { borderColor: '#ef4444' } : {})
                  }}
                  placeholder="Re-enter your password"
                />
                {passwordError && <p style={styles.fieldError}>{passwordError}</p>}
              </div>

              {/* Phone Input (optional, last) */}
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

              {/* Buttons (non-mobile) */}
              {!isMobile && (
                <div style={styles.buttonRow}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={styles.backButton}
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      ...styles.submitButton,
                      flex: 1,
                      opacity: isSubmitting ? 0.6 : 1,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isSubmitting ? 'Redirecting to Checkout...' : 'Continue to Payment'}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Sticky CTA Footer (mobile) */}
        {isMobile && step === 1 && (
          <div style={styles.stickyFooter}>
            <button
              type="button"
              onClick={handleContinue}
              style={styles.submitButton}
            >
              Continue
            </button>
          </div>
        )}

        {isMobile && step === 2 && (
          <div style={styles.stickyFooter}>
            <div style={styles.buttonRow}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={styles.backButton}
              >
                ← Back
              </button>
              <button
                type="submit"
                form="claim-form"
                disabled={isSubmitting}
                style={{
                  ...styles.submitButton,
                  flex: 1,
                  opacity: isSubmitting ? 0.6 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? 'Redirecting...' : 'Continue to Payment'}
              </button>
            </div>
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
    paddingTop: '14px',
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
  stepIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  stepItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  stepDot: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: '#e5e7eb',
    color: '#9ca3af',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
  },
  stepDotActive: {
    background: '#2563eb',
    color: 'white',
  },
  stepLabel: {
    fontSize: '11px',
    color: '#9ca3af',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: '#2563eb',
  },
  stepLine: {
    width: '40px',
    height: '2px',
    background: '#e5e7eb',
    marginBottom: '18px',
  },
  buttonRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  backButton: {
    padding: '16px 24px',
    background: 'transparent',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    color: '#6b7280',
  }
}
