import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch user's sites
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
            <div key={site.id} style={styles.card}>
              <div style={styles.cardPreview}>
                <div style={styles.previewPlaceholder}>
                  {site.business_name?.[0]?.toUpperCase() || 'S'}
                </div>
              </div>
              <div style={styles.cardContent}>
                <h3 style={styles.cardTitle}>{site.business_name || 'Untitled Site'}</h3>
                <p style={styles.cardSubdomain}>
                  {site.subdomain}.speakyour.site
                </p>
                <div style={styles.cardMeta}>
                  <span style={{
                    ...styles.statusBadge,
                    ...(site.subscription_status === 'active' ? styles.statusActive : styles.statusInactive)
                  }}>
                    {site.subscription_status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                  <span style={styles.dateText}>
                    Created {new Date(site.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div style={styles.cardActions}>
                <a
                  href={`https://${site.subdomain}.speakyour.site`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.actionButton}
                >
                  <ExternalLinkIcon />
                  View
                </a>
                <a href={`/dashboard/sites/${site.id}/edit`} style={styles.actionButton}>
                  <EditIcon />
                  Edit
                </a>
                <button style={styles.actionButtonSecondary}>
                  <CopyIcon />
                  Duplicate
                </button>
              </div>
            </div>
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
  card: {
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e5e7eb',
  },
  cardPreview: {
    height: '140px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: '12px',
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
