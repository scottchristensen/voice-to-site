import { getStripe, getSupabase } from '../../api/_lib/clients'

export const dynamic = 'force-dynamic'

export default async function CheckoutSuccessPage({ searchParams }) {
  const stripe = getStripe()
  const supabase = getSupabase()

  const { session_id } = await searchParams

  if (!session_id) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.icon}>❌</div>
          <h1 style={styles.title}>Invalid Session</h1>
          <p style={styles.text}>No checkout session found.</p>
          <a href="/" style={styles.button}>Go Home</a>
        </div>
      </div>
    )
  }

  // Retrieve the session from Stripe
  let session
  let site
  try {
    session = await stripe.checkout.sessions.retrieve(session_id)

    // Get the site details
    if (session.metadata?.siteId) {
      const { data } = await supabase
        .from('generated_sites')
        .select('*')
        .eq('id', session.metadata.siteId)
        .single()
      site = data
    }
  } catch (error) {
    console.error('Error retrieving session:', error)
  }

  if (!session || session.payment_status !== 'paid') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.icon}>⏳</div>
          <h1 style={styles.title}>Processing Payment</h1>
          <p style={styles.text}>
            Your payment is being processed. This page will update shortly.
          </p>
          <a href="/" style={styles.button}>Go Home</a>
        </div>
      </div>
    )
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://voice-to-site.vercel.app'
  const siteUrl = site?.slug ? `${baseUrl}/s/${site.slug}` : null

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>🎉</div>
        <h1 style={styles.title}>Payment Successful!</h1>
        <p style={styles.text}>
          Thank you for your purchase! Your website is now live.
        </p>

        {siteUrl && (
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.urlBox}
          >
            {siteUrl}
          </a>
        )}

        <div style={styles.details}>
          <p><strong>Order ID:</strong> {session.id.slice(-8)}</p>
          <p><strong>Amount:</strong> ${(session.amount_total / 100).toFixed(2)}</p>
          {session.customer_email && (
            <p><strong>Receipt sent to:</strong> {session.customer_email}</p>
          )}
        </div>

        <div style={styles.actions}>
          {siteUrl && (
            <a href={siteUrl} style={styles.primaryButton}>
              View Your Website
            </a>
          )}
          <a href="/" style={styles.secondaryButton}>
            Create Another Site
          </a>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  card: {
    background: 'white',
    borderRadius: '20px',
    padding: '48px',
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)',
  },
  icon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '12px',
    color: '#1a1a2e',
  },
  text: {
    color: '#666',
    marginBottom: '24px',
    lineHeight: '1.6',
  },
  urlBox: {
    display: 'block',
    padding: '16px',
    background: '#f0fdf4',
    border: '1px solid #86efac',
    borderRadius: '8px',
    color: '#166534',
    textDecoration: 'none',
    fontWeight: '500',
    marginBottom: '24px',
    wordBreak: 'break-all',
  },
  details: {
    textAlign: 'left',
    padding: '16px',
    background: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '24px',
    fontSize: '14px',
    color: '#555',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  primaryButton: {
    display: 'block',
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: '600',
  },
  secondaryButton: {
    display: 'block',
    padding: '14px 24px',
    background: '#f5f5f5',
    color: '#667eea',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: '600',
  },
  button: {
    display: 'inline-block',
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: '600',
  },
}
