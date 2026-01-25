'use client'

import { useState } from 'react'

export default function SiteSettingsModal({ site, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('general')
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [businessName, setBusinessName] = useState(site.business_name || '')
  const [isPublished, setIsPublished] = useState(site.subscription_status === 'active')
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  if (!isOpen) return null

  const currentPlan = site.plan_type || 'standard'
  const deletePhrase = site.subdomain

  const handleUpdateGeneral = async () => {
    setIsUpdating(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await fetch(`/api/sites/${site.id}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_name: businessName })
      })
      const data = await response.json()

      if (data.success) {
        setSuccessMessage('Settings saved successfully!')
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        setErrorMessage(data.error || 'Failed to update settings')
      }
    } catch {
      setErrorMessage('Failed to update settings')
    }
    setIsUpdating(false)
  }

  const handleTogglePublished = async () => {
    setIsUpdating(true)
    setErrorMessage('')

    try {
      const response = await fetch(`/api/sites/${site.id}/toggle-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !isPublished })
      })
      const data = await response.json()

      if (data.success) {
        setIsPublished(!isPublished)
        setSuccessMessage(`Site ${!isPublished ? 'published' : 'unpublished'} successfully!`)
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        setErrorMessage(data.error || 'Failed to update status')
      }
    } catch {
      setErrorMessage('Failed to update status')
    }
    setIsUpdating(false)
  }

  const handleChangePlan = async (newPlan) => {
    if (newPlan === currentPlan) return

    setIsUpdating(true)
    setErrorMessage('')

    try {
      const response = await fetch('/api/billing/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: site.id, newPlan })
      })
      const data = await response.json()

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else if (data.success) {
        setSuccessMessage('Plan updated successfully!')
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setErrorMessage(data.error || 'Failed to change plan')
      }
    } catch {
      setErrorMessage('Failed to change plan')
    }
    setIsUpdating(false)
  }

  const handleExport = async () => {
    try {
      const blob = new Blob([site.html_code], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${site.subdomain}-website.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setSuccessMessage('Site exported successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch {
      setErrorMessage('Failed to export site')
    }
  }

  const handleDelete = async () => {
    if (deleteConfirmText !== deletePhrase) return

    setIsDeleting(true)
    setErrorMessage('')

    try {
      const response = await fetch(`/api/sites/${site.id}/delete`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (data.success) {
        window.location.reload()
      } else {
        setErrorMessage(data.error || 'Failed to delete site')
        setIsDeleting(false)
      }
    } catch {
      setErrorMessage('Failed to delete site')
      setIsDeleting(false)
    }
  }

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '$19',
      period: '/month',
      features: ['Custom subdomain', 'Basic analytics', 'Email support'],
    },
    {
      id: 'standard',
      name: 'Standard',
      price: '$29',
      period: '/month',
      features: ['Everything in Starter', 'Priority support', 'Advanced analytics', 'Form submissions'],
      popular: true,
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$49',
      period: '/month',
      features: ['Everything in Standard', 'Custom domain', 'Remove branding', 'API access'],
    },
  ]

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Site Settings</h2>
            <p style={styles.subtitle}>{site.subdomain}.speakyour.site</p>
          </div>
          <button onClick={onClose} style={styles.closeButton}>
            <CloseIcon />
          </button>
        </div>

        {/* Messages */}
        {successMessage && (
          <div style={styles.successMessage}>
            <CheckIcon /> {successMessage}
          </div>
        )}
        {errorMessage && (
          <div style={styles.errorMessage}>
            <AlertIcon /> {errorMessage}
          </div>
        )}

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTab('general')}
            style={{
              ...styles.tab,
              ...(activeTab === 'general' ? styles.tabActive : {})
            }}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('plan')}
            style={{
              ...styles.tab,
              ...(activeTab === 'plan' ? styles.tabActive : {})
            }}
          >
            Plan
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            style={{
              ...styles.tab,
              ...(activeTab === 'advanced' ? styles.tabActive : {})
            }}
          >
            Advanced
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {/* General Tab */}
          {activeTab === 'general' && (
            <div style={styles.tabContent}>
              <div style={styles.field}>
                <label style={styles.label}>Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  style={styles.input}
                  placeholder="Enter business name"
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Subdomain</label>
                <div style={styles.subdomainDisplay}>
                  <span style={styles.subdomainText}>{site.subdomain}</span>
                  <span style={styles.subdomainSuffix}>.speakyour.site</span>
                </div>
                <p style={styles.fieldHint}>Subdomain cannot be changed after creation</p>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Site Status</label>
                <div style={styles.toggleRow}>
                  <span style={styles.toggleLabel}>
                    {isPublished ? 'Published' : 'Unpublished'}
                  </span>
                  <button
                    onClick={handleTogglePublished}
                    disabled={isUpdating}
                    style={{
                      ...styles.toggle,
                      ...(isPublished ? styles.toggleOn : styles.toggleOff)
                    }}
                  >
                    <span style={{
                      ...styles.toggleKnob,
                      ...(isPublished ? styles.toggleKnobOn : styles.toggleKnobOff)
                    }} />
                  </button>
                </div>
                <p style={styles.fieldHint}>
                  {isPublished
                    ? 'Your site is live and accessible to visitors'
                    : 'Your site is hidden from visitors'}
                </p>
              </div>

              <button
                onClick={handleUpdateGeneral}
                disabled={isUpdating}
                style={styles.saveButton}
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* Plan Tab */}
          {activeTab === 'plan' && (
            <div style={styles.tabContent}>
              <p style={styles.planIntro}>
                You&apos;re currently on the <strong>{currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}</strong> plan.
              </p>

              <div style={styles.plansGrid}>
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    style={{
                      ...styles.planCard,
                      ...(plan.id === currentPlan ? styles.planCardCurrent : {}),
                      ...(plan.popular ? styles.planCardPopular : {})
                    }}
                  >
                    {plan.popular && <span style={styles.popularBadge}>Popular</span>}
                    <h4 style={styles.planName}>{plan.name}</h4>
                    <div style={styles.planPrice}>
                      <span style={styles.priceAmount}>{plan.price}</span>
                      <span style={styles.pricePeriod}>{plan.period}</span>
                    </div>
                    <ul style={styles.planFeatures}>
                      {plan.features.map((feature, i) => (
                        <li key={i} style={styles.planFeature}>
                          <CheckIcon small /> {feature}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleChangePlan(plan.id)}
                      disabled={isUpdating || plan.id === currentPlan}
                      style={{
                        ...styles.planButton,
                        ...(plan.id === currentPlan ? styles.planButtonCurrent : {})
                      }}
                    >
                      {plan.id === currentPlan
                        ? 'Current Plan'
                        : plan.id === 'starter' && currentPlan !== 'starter'
                          ? 'Downgrade'
                          : 'Upgrade'}
                    </button>
                  </div>
                ))}
              </div>

              <div style={styles.billingNote}>
                <CreditCardIcon />
                <span>Changes will be prorated on your next billing cycle.</span>
              </div>
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <div style={styles.tabContent}>
              <div style={styles.advancedSection}>
                <h4 style={styles.sectionTitle}>Export Site</h4>
                <p style={styles.sectionDesc}>Download your website as an HTML file</p>
                <button onClick={handleExport} style={styles.secondaryButton}>
                  <DownloadIcon /> Export HTML
                </button>
              </div>

              <div style={styles.advancedSection}>
                <h4 style={styles.sectionTitle}>Site Information</h4>
                <div style={styles.infoGrid}>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Created</span>
                    <span style={styles.infoValue}>
                      {new Date(site.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Site ID</span>
                    <span style={styles.infoValueMono}>{site.id}</span>
                  </div>
                </div>
              </div>

              <div style={styles.dangerZone}>
                <h4 style={styles.dangerTitle}>
                  <AlertIcon /> Danger Zone
                </h4>
                <p style={styles.dangerDesc}>
                  Permanently delete this site. This will cancel your subscription and remove
                  <strong> {site.subdomain}.speakyour.site</strong> from the internet.
                </p>
                <p style={styles.dangerDesc}>
                  Type <strong>{deletePhrase}</strong> to confirm:
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={deletePhrase}
                  style={styles.dangerInput}
                />
                <button
                  onClick={handleDelete}
                  disabled={isDeleting || deleteConfirmText !== deletePhrase}
                  style={{
                    ...styles.deleteButton,
                    ...(deleteConfirmText !== deletePhrase ? styles.deleteButtonDisabled : {})
                  }}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Site Permanently'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Icons
function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  )
}

function CheckIcon({ small }) {
  return (
    <svg width={small ? "14" : "16"} height={small ? "14" : "16"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: small ? '6px' : '8px', flexShrink: 0 }}>
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px', flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  )
}

function CreditCardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px', flexShrink: 0 }}>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
      <line x1="1" y1="10" x2="23" y2="10"></line>
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    background: 'white',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '24px 24px 0',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1a1a2e',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#667eea',
    margin: '4px 0 0',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#999',
    padding: '4px',
  },
  successMessage: {
    display: 'flex',
    alignItems: 'center',
    background: '#dcfce7',
    color: '#16a34a',
    padding: '12px 24px',
    margin: '16px 24px 0',
    borderRadius: '8px',
    fontSize: '14px',
  },
  errorMessage: {
    display: 'flex',
    alignItems: 'center',
    background: '#fee2e2',
    color: '#dc2626',
    padding: '12px 24px',
    margin: '16px 24px 0',
    borderRadius: '8px',
    fontSize: '14px',
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    padding: '20px 24px 0',
    borderBottom: '1px solid #e5e7eb',
  },
  tab: {
    padding: '12px 16px',
    background: 'none',
    border: 'none',
    fontSize: '14px',
    fontWeight: '500',
    color: '#666',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    marginBottom: '-1px',
    transition: 'all 0.2s',
  },
  tabActive: {
    color: '#667eea',
    borderBottomColor: '#667eea',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '24px',
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },
  input: {
    padding: '12px 14px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  fieldHint: {
    fontSize: '12px',
    color: '#888',
    margin: 0,
  },
  subdomainDisplay: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 14px',
    background: '#f5f7fa',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  subdomainText: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },
  subdomainSuffix: {
    fontSize: '14px',
    color: '#888',
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontSize: '14px',
    color: '#333',
  },
  toggle: {
    width: '48px',
    height: '28px',
    borderRadius: '14px',
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background 0.2s',
  },
  toggleOn: {
    background: '#22c55e',
  },
  toggleOff: {
    background: '#e5e7eb',
  },
  toggleKnob: {
    position: 'absolute',
    top: '2px',
    width: '24px',
    height: '24px',
    borderRadius: '12px',
    background: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    transition: 'left 0.2s',
  },
  toggleKnobOn: {
    left: '22px',
  },
  toggleKnobOff: {
    left: '2px',
  },
  saveButton: {
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
  // Plan Tab
  planIntro: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 16px',
  },
  plansGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  },
  planCard: {
    padding: '16px',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    position: 'relative',
  },
  planCardCurrent: {
    borderColor: '#667eea',
    background: '#f8f9ff',
  },
  planCardPopular: {
    borderColor: '#667eea',
  },
  popularBadge: {
    position: 'absolute',
    top: '-8px',
    right: '12px',
    background: '#667eea',
    color: 'white',
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  planName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a2e',
    margin: '0 0 8px',
  },
  planPrice: {
    marginBottom: '12px',
  },
  priceAmount: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a1a2e',
  },
  pricePeriod: {
    fontSize: '12px',
    color: '#888',
  },
  planFeatures: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 16px',
  },
  planFeature: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '12px',
    color: '#666',
    marginBottom: '6px',
  },
  planButton: {
    width: '100%',
    padding: '10px',
    background: 'white',
    border: '1px solid #667eea',
    color: '#667eea',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  planButtonCurrent: {
    background: '#f0f0f0',
    borderColor: '#ccc',
    color: '#888',
    cursor: 'default',
  },
  billingNote: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    background: '#f5f7fa',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#666',
    marginTop: '16px',
  },
  // Advanced Tab
  advancedSection: {
    paddingBottom: '20px',
    borderBottom: '1px solid #f0f0f0',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a2e',
    margin: '0 0 4px',
  },
  sectionDesc: {
    fontSize: '13px',
    color: '#666',
    margin: '0 0 12px',
  },
  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '10px 16px',
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#333',
    cursor: 'pointer',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginTop: '12px',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  infoLabel: {
    fontSize: '12px',
    color: '#888',
  },
  infoValue: {
    fontSize: '14px',
    color: '#333',
  },
  infoValueMono: {
    fontSize: '12px',
    color: '#333',
    fontFamily: 'monospace',
    background: '#f5f7fa',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  dangerZone: {
    marginTop: '20px',
    padding: '20px',
    background: '#fef2f2',
    borderRadius: '12px',
    border: '1px solid #fecaca',
  },
  dangerTitle: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: '600',
    color: '#dc2626',
    margin: '0 0 8px',
  },
  dangerDesc: {
    fontSize: '13px',
    color: '#666',
    margin: '0 0 12px',
    lineHeight: '1.5',
  },
  dangerInput: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    marginBottom: '12px',
    boxSizing: 'border-box',
  },
  deleteButton: {
    width: '100%',
    padding: '12px',
    background: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  deleteButtonDisabled: {
    background: '#f5f5f5',
    color: '#999',
    cursor: 'not-allowed',
  },
}
