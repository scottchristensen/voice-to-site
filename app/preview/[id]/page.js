import { createClient } from '@supabase/supabase-js'
import PreviewClient from '../../components/PreviewClient'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Calculate days remaining
function getDaysRemaining(createdAt) {
  const created = new Date(createdAt)
  const expires = new Date(created.getTime() + 1 * 24 * 60 * 60 * 1000) // 1 day
  const now = new Date()
  const diff = expires - now
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export async function generateMetadata({ params }) {
  const { id } = await params

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  )

  const { data: site } = await supabase
    .from('generated_sites')
    .select('business_name')
    .eq('id', id)
    .single()

  return {
    title: site?.business_name ? `${site.business_name} - Preview` : 'Site Preview',
    description: 'Preview your generated website'
  }
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
        <p style={styles.notFoundText}>This preview doesn&apos;t exist.</p>
        <a href="/" style={styles.notFoundButton}>
          Create a New Site
        </a>
      </div>
    )
  }

  const daysRemaining = getDaysRemaining(site.created_at)
  const isExpired = daysRemaining <= 0 && site.payment_status === 'unpaid'
  const isPaid = site.payment_status === 'paid'

  return (
    <PreviewClient
      site={site}
      daysRemaining={daysRemaining}
      isPaid={isPaid}
      isExpired={isExpired}
    />
  )
}

const styles = {
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
}
