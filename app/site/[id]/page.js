import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const { id } = await params

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  )

  const { data: site } = await supabase
    .from('generated_sites')
    .select('business_name, industry')
    .eq('id', id)
    .single()

  return {
    title: site?.business_name || 'Website',
    description: site?.industry ? `${site.business_name} - ${site.industry}` : site?.business_name
  }
}

export default async function SitePage({ params }) {
  const { id } = await params

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  )

  const { data: site, error } = await supabase
    .from('generated_sites')
    .select('html_code, business_name, subdomain, payment_status, subscription_status')
    .eq('id', id)
    .single()

  // If site not found or not paid, show error
  if (error || !site) {
    return (
      <html>
        <head>
          <title>Site Not Found</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body style={styles.errorBody}>
          <div style={styles.errorContainer}>
            <h1 style={styles.errorTitle}>Site Not Found</h1>
            <p style={styles.errorText}>This website doesn&apos;t exist or has been removed.</p>
            <a href="https://speakyour.site" style={styles.errorLink}>
              Create Your Own Site
            </a>
          </div>
        </body>
      </html>
    )
  }

  // If subscription is not active, show subscription expired message
  if (site.payment_status !== 'paid' || (site.subscription_status && site.subscription_status !== 'active')) {
    return (
      <html>
        <head>
          <title>Site Unavailable</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body style={styles.errorBody}>
          <div style={styles.errorContainer}>
            <h1 style={styles.errorTitle}>Site Unavailable</h1>
            <p style={styles.errorText}>This website&apos;s subscription has expired.</p>
            <a href="https://speakyour.site" style={styles.errorLink}>
              Create Your Own Site
            </a>
          </div>
        </body>
      </html>
    )
  }

  // Render the site's HTML directly
  return (
    <html>
      <head>
        <title>{site.business_name || 'Website'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="generator" content="SpeakYour.Site" />
      </head>
      <body
        dangerouslySetInnerHTML={{ __html: site.html_code }}
        style={{ margin: 0, padding: 0 }}
      />
    </html>
  )
}

const styles = {
  errorBody: {
    margin: 0,
    padding: 0,
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  errorContainer: {
    textAlign: 'center',
    padding: '40px',
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)',
    maxWidth: '400px'
  },
  errorTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: '12px'
  },
  errorText: {
    color: '#666',
    marginBottom: '24px',
    lineHeight: '1.6'
  },
  errorLink: {
    display: 'inline-block',
    padding: '14px 28px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: '600'
  }
}
