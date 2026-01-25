'use client'

import { useState, useEffect } from 'react'

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
          phone,
          tier: selectedTier
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
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={styles.closeX}>&times;</button>

        <h2 style={styles.title}>Choose Your Plan</h2>
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
                ...(selectedTier === tier.id ? styles.tierCardSelected : {}),
                ...(tier.popular ? styles.tierCardPopular : {})
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
            {isSubmitting
              ? 'Redirecting to Checkout...'
              : `Continue to Payment - ${selectedTierData?.price}${selectedTierData?.period}`
            }
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
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '24px'
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
  },
  tierCardSelected: {
    borderColor: '#2563eb',
    background: '#eff6ff',
    boxShadow: '0 0 0 1px #2563eb',
  },
  tierCardPopular: {
    borderColor: '#2563eb',
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
    padding: '12px 14px',
    background: '#f5f5f5',
    border: '2px solid #e0e0e0',
    borderLeft: 'none',
    borderRadius: '0 8px 8px 0',
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
