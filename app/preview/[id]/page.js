import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Calculate days remaining
function getDaysRemaining(createdAt) {
  const created = new Date(createdAt)
  const expires = new Date(created.getTime() + 14 * 24 * 60 * 60 * 1000) // 14 days
  const now = new Date()
  const diff = expires - now
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default async function PreviewPage({ params }) {
  const { id } = await params

  // Initialize Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  )

  // Fetch the site from database
  const { data: site, error } = await supabase
    .from('generated_sites')
    .select('*')
    .eq('id', id)
    .single()

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

  const daysRemaining = getDaysRemaining(site.created_at)
  const isExpired = daysRemaining <= 0 && site.payment_status === 'unpaid'
  const isPaid = site.payment_status === 'paid'

  // Expired site - show blurred preview with urgency CTA
  if (isExpired) {
    return (
      <div style={styles.container}>
        {/* Expired Overlay */}
        <div style={styles.expiredOverlay}>
          <div style={styles.expiredCard}>
            <div style={styles.expiredIcon}>⏰</div>
            <h1 style={styles.expiredTitle}>Preview Expired</h1>
            <p style={styles.expiredText}>
              This website preview for <strong>{site.business_name || 'your business'}</strong> has expired.
              But don't worry - you can create a new one in minutes!
            </p>
            <a href="/" style={styles.expiredButton}>
              Create a New Site
            </a>
            <p style={styles.expiredSubtext}>
              Or claim this exact design before it's gone forever
            </p>
            <div style={styles.expiredActions}>
              <button style={styles.claimButton}>Claim This Site - $49</button>
            </div>
          </div>
        </div>

        {/* Blurred Preview */}
        <iframe
          srcDoc={site.html_code}
          style={styles.blurredIframe}
          title="Website Preview (Expired)"
        />
      </div>
    )
  }

  // Active preview - show with countdown urgency
  return (
    <div style={styles.container}>
      {/* Urgency Banner */}
      {!isPaid && (
        <div style={styles.urgencyBanner}>
          <div style={styles.urgencyLeft}>
            <span style={styles.timerIcon}>⏱️</span>
            <span>
              <strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</strong> left to claim your site
            </span>
          </div>
          <div style={styles.urgencyRight}>
            Claim now before this preview expires!
          </div>
        </div>
      )}

      {/* Main Upsell Banner */}
      <div style={styles.upsellBanner}>
        <div style={styles.upsellLeft}>
          <strong>
            {isPaid ? '✓ ' : ''}
            Your website{site.business_name ? ` for ${site.business_name}` : ''}
          </strong>
          {!isPaid && (
            <span style={styles.upsellSubtext}>
              Like what you see? Claim your site!
            </span>
          )}
        </div>
        {!isPaid && (
          <div style={styles.upsellButtons}>
            <button style={styles.exportButton}>
              Export Code - $49
            </button>
            <button style={styles.hostButton}>
              Host With Us - $29/mo
            </button>
            <button style={styles.premiumButton}>
              Premium Design - $499+
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
  claimButton: {
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
  exportButton: {
    background: 'white',
    color: '#667eea',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  hostButton: {
    background: 'rgba(255,255,255,0.2)',
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
}
