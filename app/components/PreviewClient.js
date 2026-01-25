'use client'

import { useState, useEffect } from 'react'
import ClaimModal from './ClaimModal'
import EditPanel from './EditPanel'
import EditSheet from './EditSheet'

function getTimeRemaining(createdAt) {
  const created = new Date(createdAt)
  const expires = new Date(created.getTime() + 24 * 60 * 60 * 1000) // 24 hours
  const now = new Date()
  const diff = Math.max(0, expires - now)

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return { hours, minutes, seconds, total: diff }
}

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

export default function PreviewClient({ site, daysRemaining, isPaid, isExpired }) {
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining(site.created_at))
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false)
  const [editsRemaining, setEditsRemaining] = useState(5 - (site.preview_edits_used || 0))
  const [currentHtml, setCurrentHtml] = useState(site.html_code)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (isPaid || isExpired) return

    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining(site.created_at))
    }, 1000)

    return () => clearInterval(timer)
  }, [site.created_at, isPaid, isExpired])

  const handleEditComplete = (newHtml, remaining) => {
    setCurrentHtml(newHtml)
    setEditsRemaining(remaining)
  }

  const handleLimitReached = () => {
    setIsEditPanelOpen(false)
    setShowClaimModal(true)
  }

  // Expired site view
  if (isExpired) {
    return (
      <div style={styles.container}>
        {/* Expired Overlay */}
        <div style={styles.expiredOverlay}>
          <div style={styles.expiredCard}>
            <div style={styles.expiredIcon}>&#9200;</div>
            <h1 style={styles.expiredTitle}>Preview Expired</h1>
            <p style={styles.expiredText}>
              This website preview for <strong>{site.business_name || 'your business'}</strong> has expired.
              But don&apos;t worry - you can create a new one in minutes!
            </p>
            <a href="/" style={styles.expiredButton}>
              Create a New Site
            </a>
            <p style={styles.expiredSubtext}>
              Or claim this exact design before it&apos;s gone forever
            </p>
            <div style={styles.expiredActions}>
              <button
                onClick={() => setShowClaimModal(true)}
                style={styles.claimButton}
              >
                Claim My Site
              </button>
            </div>
          </div>
        </div>

        {/* Blurred Preview */}
        <iframe
          srcDoc={site.html_code}
          style={styles.blurredIframe}
          title="Website Preview (Expired)"
        />

        <ClaimModal
          site={site}
          isOpen={showClaimModal}
          onClose={() => setShowClaimModal(false)}
        />
      </div>
    )
  }

  // Active preview view
  return (
    <div className="outer-wrapper" style={styles.outerWrapper}>
      {/* Compact Header for Unpaid Sites */}
      {!isPaid && (
        <>
          <style>{`
            html, body {
              margin: 0;
              padding: 0;
            }
            @media (max-width: 640px) {
              .outer-wrapper {
                padding: 16px !important;
              }
              .header-row {
                flex-wrap: wrap !important;
                gap: 12px !important;
                margin-bottom: 16px !important;
              }
              .header-title {
                order: 1 !important;
                width: 100% !important;
              }
              .urgency-badge {
                order: 2 !important;
              }
              .claim-cta-btn {
                order: 3 !important;
                width: 100% !important;
              }
            }
          `}</style>
          <div className="header-row" style={styles.header}>
            <div className="header-title" style={styles.headerTextWrapper}>
              <span style={styles.headerText}>View your website below</span>
              <span style={styles.headerSubtext}>Like what you see? Claim your site today.</span>
            </div>
            <span className="urgency-badge" style={styles.urgencyBadge}>
              {timeLeft.total > 0 ? (
                <>
                  <span style={styles.timerTime}>{timeLeft.hours} hr {timeLeft.minutes} mins</span>
                  <span style={styles.timerLabel}>left to claim</span>
                </>
              ) : (
                'Expiring soon!'
              )}
            </span>
            <button
              className="claim-cta-btn"
              onClick={() => setShowClaimModal(true)}
              style={styles.claimCta}
            >
              Claim My Site
            </button>
          </div>
        </>
      )}

      {/* Success Header for Paid Sites */}
      {isPaid && (
        <div style={styles.successHeader}>
          <span>&#10003; Your site is live!</span>
          {site.subdomain && (
            <a
              href={`https://${site.subdomain}.speakyour.site`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.liveLink}
            >
              Visit {site.subdomain}.speakyour.site &#8594;
            </a>
          )}
        </div>
      )}

      {/* Preview Container with rounded corners */}
      <div style={styles.previewContainerWrapper}>
        {/* Desktop Edit Panel */}
        {!isMobile && !isPaid && (
          <EditPanel
            isOpen={isEditPanelOpen}
            onClose={() => setIsEditPanelOpen(false)}
            siteId={site.id}
            editsRemaining={editsRemaining}
            onEditComplete={handleEditComplete}
            onLimitReached={handleLimitReached}
          />
        )}

        <div style={{
          ...styles.previewContainer,
          marginLeft: !isMobile && isEditPanelOpen ? '350px' : '0',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <iframe
            srcDoc={currentHtml}
            style={styles.iframe}
            title="Website Preview"
          />

          {/* FAB - Floating Action Button for Edit */}
          {!isPaid && !isEditPanelOpen && (
            <button
              onClick={() => setIsEditPanelOpen(true)}
              style={styles.fab}
              title="Edit your site"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span style={styles.fabLabel}>Edit</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Edit Sheet */}
      {isMobile && !isPaid && (
        <EditSheet
          isOpen={isEditPanelOpen}
          onClose={() => setIsEditPanelOpen(false)}
          siteId={site.id}
          editsRemaining={editsRemaining}
          onEditComplete={handleEditComplete}
          onLimitReached={handleLimitReached}
        />
      )}

      <ClaimModal
        site={site}
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
      />
    </div>
  )
}

const styles = {
  // Outer wrapper with padding
  outerWrapper: {
    height: '100vh',
    background: '#f5f5f7',
    padding: '16px 32px 32px 32px',
    boxSizing: 'border-box',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    display: 'flex',
    flexDirection: 'column',
  },
  // Compact header bar
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '0',
    marginBottom: '16px',
    gap: '16px',
  },
  headerTextWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },
  headerText: {
    color: '#1f2937',
    fontSize: '24px',
    fontWeight: '700',
  },
  headerSubtext: {
    color: '#6b7280',
    fontSize: '15px',
    fontWeight: '400',
  },
  urgencyBadge: {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    background: '#fee2e2',
    color: '#dc2626',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
  },
  timerTime: {
    fontSize: '15px',
    fontWeight: '700',
    fontVariantNumeric: 'tabular-nums',
  },
  timerLabel: {
    fontSize: '11px',
    fontWeight: '500',
  },
  claimCta: {
    background: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '14px 28px',
    borderRadius: '8px',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '16px',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  // Success header for paid sites
  successHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    marginBottom: '12px',
    color: '#22c55e',
    fontSize: '15px',
    fontWeight: '600',
    flexWrap: 'wrap',
    gap: '12px',
  },
  liveLink: {
    color: '#22c55e',
    textDecoration: 'underline',
  },
  // Preview container wrapper (for edit panel layout)
  previewContainerWrapper: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    overflow: 'hidden',
  },
  // Preview container with drop shadow
  previewContainer: {
    flex: 1,
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 25px 80px rgba(0, 0, 0, 0.2), 0 15px 40px rgba(0, 0, 0, 0.15), 0 5px 15px rgba(0, 0, 0, 0.1)',
    position: 'relative',
  },
  // Floating Action Button for Edit
  fab: {
    position: 'absolute',
    bottom: '24px',
    left: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 20px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)',
    zIndex: 50,
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  fabLabel: {
    marginRight: '4px',
  },
  // Preview iframe
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    display: 'block',
    background: '#f5f5f7',
  },
  // Expired State (still uses container)
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
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
    margin: '20px',
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
  claimButton: {
    padding: '14px 28px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '16px',
  },
  blurredIframe: {
    flex: 1,
    border: 'none',
    width: '100%',
    filter: 'blur(8px)',
    pointerEvents: 'none',
  },
}
