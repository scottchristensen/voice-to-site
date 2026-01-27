'use client'

import { useState } from 'react'
import SiteSettingsModal from './SiteSettingsModal'

export default function SiteCard({ site }) {
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Determine if site is claimed (has subdomain and is paid)
  const isClaimed = site.subdomain && site.payment_status === 'paid'
  const isActive = site.subscription_status === 'active'

  const handleDuplicate = async () => {
    setIsDuplicating(true)
    try {
      const response = await fetch(`/api/sites/${site.id}/duplicate`, {
        method: 'POST',
      })
      const data = await response.json()

      if (data.success) {
        // Refresh the page to show the new duplicated site tile
        window.location.reload()
      } else {
        alert('Failed to duplicate site: ' + data.error)
      }
    } catch {
      alert('Failed to duplicate site')
    }
    setIsDuplicating(false)
  }

  return (
    <div style={styles.card}>
      <div style={{
        ...styles.cardPreview,
        ...(isClaimed ? {} : styles.cardPreviewDraft)
      }}>
        <div style={styles.previewPlaceholder}>
          {site.business_name?.[0]?.toUpperCase() || 'S'}
        </div>
        {/* Draft overlay for unclaimed sites */}
        {!isClaimed && (
          <div style={styles.draftOverlay}>
            <span style={styles.draftLabel}>Draft</span>
          </div>
        )}
      </div>
      <div style={styles.cardContent}>
        <h3 style={styles.cardTitle}>{site.business_name || 'Untitled Site'}</h3>
        <p style={styles.cardSubdomain}>
          {isClaimed
            ? `${site.subdomain}.speakyour.site`
            : 'No URL assigned'
          }
        </p>
        <div style={styles.cardMeta}>
          {/* Status badges */}
          {isClaimed ? (
            <span style={{
              ...styles.statusBadge,
              ...(isActive ? styles.statusActive : styles.statusInactive)
            }}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          ) : (
            <>
              <span style={{...styles.statusBadge, ...styles.statusUnclaimed}}>
                Unclaimed
              </span>
              <span style={{...styles.statusBadge, ...styles.statusNotActive}}>
                Not Active
              </span>
            </>
          )}
        </div>
        <span style={styles.dateText}>
          Created {new Date(site.created_at).toLocaleDateString()}
        </span>
      </div>
      <div style={styles.cardActions}>
        {isClaimed ? (
          // Actions for claimed sites
          <>
            <a
              href={`https://${site.subdomain}.speakyour.site`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.actionButton}
            >
              <ExternalLinkIcon />
              View
            </a>
            <a href={`/edit/${site.id}`} style={styles.actionButton}>
              <EditIcon />
              Edit
            </a>
            <button
              onClick={handleDuplicate}
              disabled={isDuplicating}
              style={styles.actionButtonSecondary}
            >
              <CopyIcon />
              {isDuplicating ? '...' : 'Duplicate'}
            </button>
          </>
        ) : (
          // Actions for unclaimed/draft sites
          <>
            <a href={`/preview/${site.id}`} style={styles.actionButtonPrimary}>
              <ClaimIcon />
              Claim Site
            </a>
            <a href={`/edit/${site.id}`} style={styles.actionButton}>
              <EditIcon />
              Edit
            </a>
          </>
        )}
        <button
          onClick={() => setShowSettings(true)}
          style={styles.settingsButton}
          title="Site Settings"
        >
          <SettingsIcon />
        </button>
      </div>

      {/* Site Settings Modal */}
      <SiteSettingsModal
        site={site}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  )
}

function ExternalLinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
      <polyline points="15 3 21 3 21 9"></polyline>
      <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  )
}

function ClaimIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  )
}

const styles = {
  card: {
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e5e7eb',
    position: 'relative',
  },
  cardPreview: {
    height: '140px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardPreviewDraft: {
    background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
  },
  draftOverlay: {
    position: 'absolute',
    top: '12px',
    right: '12px',
  },
  draftLabel: {
    background: 'rgba(0,0,0,0.4)',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  previewPlaceholder: {
    width: '60px',
    height: '60px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: '700',
    color: 'white',
  },
  cardContent: {
    padding: '20px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '4px',
  },
  cardSubdomain: {
    fontSize: '13px',
    color: '#667eea',
    marginBottom: '12px',
  },
  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '8px',
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
  },
  statusActive: {
    background: '#dcfce7',
    color: '#16a34a',
  },
  statusInactive: {
    background: '#fee2e2',
    color: '#dc2626',
  },
  statusUnclaimed: {
    background: '#fef3c7',
    color: '#92400e',
  },
  statusNotActive: {
    background: '#f3f4f6',
    color: '#6b7280',
  },
  dateText: {
    fontSize: '12px',
    color: '#888',
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
    padding: '16px 20px',
    borderTop: '1px solid #f0f0f0',
    background: '#fafafa',
    flexWrap: 'wrap',
  },
  actionButton: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 12px',
    background: 'white',
    border: '1px solid #e5e5e5',
    borderRadius: '6px',
    color: '#333',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  actionButtonPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 16px',
    background: '#2563eb',
    border: 'none',
    borderRadius: '6px',
    color: 'white',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  actionButtonSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 12px',
    background: 'transparent',
    border: '1px solid #e5e5e5',
    borderRadius: '6px',
    color: '#666',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  settingsButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    background: 'transparent',
    border: '1px solid #e5e5e5',
    borderRadius: '6px',
    color: '#666',
    cursor: 'pointer',
    marginLeft: 'auto',
    transition: 'all 0.2s',
  },
}
