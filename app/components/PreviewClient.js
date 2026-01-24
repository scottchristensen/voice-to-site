'use client'

import { useState } from 'react'
import ClaimModal from './ClaimModal'

export default function PreviewClient({ site, daysRemaining, isPaid, isExpired }) {
  const [showClaimModal, setShowClaimModal] = useState(false)

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
                Claim This Site - $29/mo
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
    <div style={styles.container}>
      {/* Urgency Banner */}
      {!isPaid && (
        <div style={styles.urgencyBanner}>
          <div style={styles.urgencyLeft}>
            <span style={styles.timerIcon}>&#9201;</span>
            <span>
              <strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</strong> left to claim your site
            </span>
          </div>
          <div style={styles.urgencyRight}>
            Claim now before this preview expires!
          </div>
        </div>
      )}

      {/* Success Banner for Paid Sites */}
      {isPaid && (
        <div style={styles.successBanner}>
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

      {/* Main Upsell Banner */}
      {!isPaid && (
        <div style={styles.upsellBanner}>
          <div style={styles.upsellLeft}>
            <strong>
              Your website{site.business_name ? ` for ${site.business_name}` : ''}
            </strong>
            <span style={styles.upsellSubtext}>
              Like what you see? Claim your site!
            </span>
          </div>
          <div style={styles.upsellButtons}>
            <button
              onClick={() => setShowClaimModal(true)}
              style={styles.hostButton}
            >
              Host With Us - $29/mo
            </button>
          </div>
        </div>
      )}

      {/* Website Preview */}
      <iframe
        srcDoc={site.html_code}
        style={styles.iframe}
        title="Website Preview"
      />

      <ClaimModal
        site={site}
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
      />
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
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
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
  // Urgency Banner
  urgencyBanner: {
    background: '#ff6b6b',
    color: 'white',
    padding: '10px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontFamily: 'system-ui',
    fontSize: '14px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  urgencyLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  timerIcon: {
    fontSize: '18px',
  },
  urgencyRight: {
    opacity: 0.9,
  },
  // Success Banner
  successBanner: {
    background: '#22c55e',
    color: 'white',
    padding: '12px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontFamily: 'system-ui',
    fontSize: '14px',
    fontWeight: '600',
  },
  liveLink: {
    color: 'white',
    textDecoration: 'underline',
  },
  // Upsell Banner
  upsellBanner: {
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
  upsellLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  upsellSubtext: {
    opacity: 0.9,
    fontSize: '14px',
  },
  upsellButtons: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  hostButton: {
    background: 'white',
    color: '#667eea',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '16px',
  },
  iframe: {
    flex: 1,
    border: 'none',
    width: '100%',
  },
}
