import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

export async function generateMetadata({ params }) {
  const { slug } = await params

  const { data: site } = await supabase
    .from('generated_sites')
    .select('business_name, industry')
    .eq('slug', slug)
    .single()

  if (!site) {
    return { title: 'Site Not Found' }
  }

  return {
    title: site.business_name || 'Website',
    description: `${site.business_name} - ${site.industry || 'Professional Services'}`,
  }
}

export default async function PublishedSitePage({ params }) {
  const { slug } = await params

  // Fetch the site by slug
  const { data: site, error } = await supabase
    .from('generated_sites')
    .select('*')
    .eq('slug', slug)
    .single()

  // Site not found
  if (error || !site) {
    return (
      <div style={styles.notFound}>
        <h1 style={styles.notFoundTitle}>Site Not Found</h1>
        <p style={styles.notFoundText}>
          This site doesn't exist or hasn't been published yet.
        </p>
        <a href="/" style={styles.notFoundButton}>
          Create Your Own Site
        </a>
      </div>
    )
  }

  // Check if site is published (claimed)
  const isPublished = site.status === 'published' || site.payment_status === 'paid'

  // If not published, show a teaser with link to preview
  if (!isPublished) {
    return (
      <div style={styles.unpublished}>
        <div style={styles.unpublishedCard}>
          <h1 style={styles.unpublishedTitle}>
            {site.business_name || 'This Site'}
          </h1>
          <p style={styles.unpublishedText}>
            This website is being previewed but hasn't been published yet.
          </p>
          <a href={`/preview/${site.id}`} style={styles.previewButton}>
            View Preview
          </a>
          <div style={styles.divider}></div>
          <p style={styles.ctaText}>Want your own website?</p>
          <a href="/" style={styles.createButton}>
            Create One Free
          </a>
        </div>
      </div>
    )
  }

  // Published site - serve the HTML directly via iframe
  return (
    <>
      <iframe
        srcDoc={site.html_code}
        style={styles.fullPageIframe}
        title={site.business_name || 'Website'}
      />
    </>
  )
}

const styles = {
  fullPageIframe: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: 'none',
  },
  notFound: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    background: '#f5f5f5',
    padding: '40px',
    textAlign: 'center',
  },
  notFoundTitle: {
    fontSize: '2rem',
    marginBottom: '1rem',
    color: '#1a1a2e',
  },
  notFoundText: {
    color: '#666',
    marginBottom: '1.5rem',
  },
  notFoundButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: '600',
  },
  unpublished: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '40px',
  },
  unpublishedCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '48px',
    maxWidth: '450px',
    textAlign: 'center',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)',
  },
  unpublishedTitle: {
    fontSize: '1.75rem',
    fontWeight: '700',
    marginBottom: '12px',
    color: '#1a1a2e',
  },
  unpublishedText: {
    color: '#666',
    marginBottom: '24px',
    lineHeight: '1.6',
  },
  previewButton: {
    display: 'inline-block',
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: '600',
  },
  divider: {
    height: '1px',
    background: '#eee',
    margin: '32px 0',
  },
  ctaText: {
    color: '#888',
    fontSize: '14px',
    marginBottom: '12px',
  },
  createButton: {
    display: 'inline-block',
    padding: '10px 20px',
    background: '#f5f5f5',
    color: '#667eea',
    textDecoration: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '14px',
  },
}
