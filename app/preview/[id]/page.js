import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

export default async function PreviewPage({ params }) {
  // In Next.js 15, params is a Promise
  const { id } = await params

  // Fetch the site from database
  const { data: site, error } = await supabase
    .from('generated_sites')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !site) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        fontFamily: 'system-ui',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Site not found</h1>
        <p style={{ color: '#666' }}>This preview may have expired or doesn't exist.</p>
        <a
          href="/"
          style={{
            marginTop: '1.5rem',
            padding: '12px 24px',
            background: '#667eea',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: '600'
          }}
        >
          Create a New Site
        </a>
      </div>
    )
  }

  // Render the HTML in an iframe with upsell banner
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Upsell Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: 'system-ui',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <strong>Your website preview{site.business_name ? ` for ${site.business_name}` : ''}</strong>
          <span style={{ opacity: 0.9, marginLeft: '12px' }}>
            Like what you see? Claim your site!
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button style={{
            background: 'white',
            color: '#667eea',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}>
            Export Code - $49
          </button>
          <button style={{
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: '2px solid white',
            padding: '10px 20px',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}>
            Host With Us - $29/mo
          </button>
          <button style={{
            background: '#ffd700',
            color: '#333',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}>
            Premium Design - $499+
          </button>
        </div>
      </div>

      {/* Website Preview */}
      <iframe
        srcDoc={site.html_code}
        style={{
          flex: 1,
          border: 'none',
          width: '100%'
        }}
        title="Website Preview"
      />
    </div>
  )
}
