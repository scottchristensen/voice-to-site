import { createClient } from '@/lib/supabase/server'
import SiteCard from './SiteCard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch user's sites by email (primary method)
  const { data: sites, error } = await supabase
    .from('generated_sites')
    .select('*')
    .eq('email', user.email)
    .eq('payment_status', 'paid')
    .order('created_at', { ascending: false })

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>My Sites</h1>
          <p style={styles.subtitle}>Manage and edit your websites</p>
        </div>
        <a href="/dashboard/new" style={styles.createButton}>
          <PlusIcon />
          Create New Site
        </a>
      </div>

      {/* Sites Grid */}
      {sites && sites.length > 0 ? (
        <div style={styles.grid}>
          {sites.map((site) => (
            <SiteCard key={site.id} site={site} />
          ))}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🌐</div>
          <h2 style={styles.emptyTitle}>No sites yet</h2>
          <p style={styles.emptyText}>
            Create your first website by talking to our AI assistant.
            It only takes 5 minutes!
          </p>
          <a href="/dashboard/new" style={styles.emptyButton}>
            <PlusIcon />
            Create Your First Site
          </a>
        </div>
      )}
    </div>
  )
}

// Icons
function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  )
}

const styles = {
  container: {
    padding: '32px',
    maxWidth: '1200px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '15px',
    color: '#666',
  },
  createButton: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '24px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 40px',
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '24px',
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '15px',
    color: '#666',
    marginBottom: '24px',
    maxWidth: '400px',
    margin: '0 auto 24px',
    lineHeight: '1.6',
  },
  emptyButton: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
  },
}
