import { createClient } from '@/lib/supabase/server'

// Pricing tiers matching ClaimModal
const PLAN_PRICES = {
  basic: 9,
  pro: 29,
  premium: 59,
}

function getPlanPrice(planTier) {
  return PLAN_PRICES[planTier] || PLAN_PRICES.pro
}

function getPlanName(planTier) {
  const names = { basic: 'Basic', pro: 'Pro', premium: 'Premium' }
  return names[planTier] || 'Pro'
}

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get user's paid sites with subscription info
  const { data: sites } = await supabase
    .from('generated_sites')
    .select('*')
    .eq('email', user.email)
    .eq('payment_status', 'paid')
    .order('claimed_at', { ascending: false })

  // Calculate total based on actual plan tiers
  const totalMonthly = sites ? sites.reduce((sum, site) => {
    const planTier = site.plan_tier || site.plan_type || 'pro'
    return sum + getPlanPrice(planTier)
  }, 0) : 0

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Billing</h1>
        <p style={styles.subtitle}>Manage your subscriptions and payment methods</p>
      </div>

      {/* Summary Card */}
      <div style={styles.summaryCard}>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>Active Subscriptions</span>
          <span style={styles.summaryValue}>{sites?.length || 0}</span>
        </div>
        <div style={styles.summaryDivider}></div>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>Monthly Total</span>
          <span style={styles.summaryValue}>${totalMonthly}/mo</span>
        </div>
        <div style={styles.summaryDivider}></div>
        <div style={styles.summaryItem}>
          <ManageButton />
        </div>
      </div>

      {/* Subscriptions List */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Your Subscriptions</h2>

        {sites && sites.length > 0 ? (
          <div style={styles.subscriptionsList}>
            {sites.map((site) => (
              <div key={site.id} style={styles.subscriptionCard}>
                <div style={styles.subscriptionInfo}>
                  <h3 style={styles.siteName}>{site.business_name || 'Untitled Site'}</h3>
                  <p style={styles.siteUrl}>{site.subdomain}.speakyour.site</p>
                </div>
                <div style={styles.subscriptionMeta}>
                  <span style={styles.planBadge}>
                    {getPlanName(site.plan_tier || site.plan_type)}
                  </span>
                  <span style={{
                    ...styles.statusBadge,
                    ...(site.subscription_status === 'active' ? styles.statusActive : styles.statusInactive)
                  }}>
                    {site.subscription_status === 'active' ? 'Active' : site.subscription_status}
                  </span>
                  <span style={styles.price}>${getPlanPrice(site.plan_tier || site.plan_type)}/mo</span>
                </div>
                <div style={styles.subscriptionDates}>
                  <span style={styles.dateLabel}>
                    Started: {site.claimed_at ? new Date(site.claimed_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No active subscriptions</p>
            <a href="/dashboard/new" style={styles.createLink}>Create your first site</a>
          </div>
        )}
      </div>

      {/* FAQ Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Billing FAQ</h2>
        <div style={styles.faqList}>
          <div style={styles.faqItem}>
            <h4 style={styles.faqQuestion}>How do I cancel a subscription?</h4>
            <p style={styles.faqAnswer}>
              Click "Manage Billing" above to access the Stripe customer portal where you can cancel any subscription.
            </p>
          </div>
          <div style={styles.faqItem}>
            <h4 style={styles.faqQuestion}>When will I be charged?</h4>
            <p style={styles.faqAnswer}>
              You're charged monthly on the anniversary of when you claimed each site.
            </p>
          </div>
          <div style={styles.faqItem}>
            <h4 style={styles.faqQuestion}>What happens if I cancel?</h4>
            <p style={styles.faqAnswer}>
              Your site will remain active until the end of your billing period, then it will be taken offline.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Client component for the manage button
function ManageButton() {
  return (
    <form action="/api/billing/portal" method="GET">
      <button type="submit" style={styles.manageButton}>
        Manage Billing
      </button>
    </form>
  )
}

const styles = {
  container: {
    padding: '32px',
    maxWidth: '900px',
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
  },
  summaryCard: {
    display: 'flex',
    alignItems: 'center',
    background: 'white',
    borderRadius: '12px',
    padding: '24px 32px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    marginBottom: '32px',
    gap: '32px',
    flexWrap: 'wrap',
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  summaryLabel: {
    fontSize: '13px',
    color: '#888',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a1a2e',
  },
  summaryDivider: {
    width: '1px',
    height: '40px',
    background: '#e5e5e5',
  },
  manageButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '16px',
  },
  subscriptionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  subscriptionCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'white',
    borderRadius: '10px',
    padding: '20px 24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    flexWrap: 'wrap',
    gap: '16px',
  },
  subscriptionInfo: {
    flex: 1,
    minWidth: '200px',
  },
  siteName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '4px',
  },
  siteUrl: {
    fontSize: '13px',
    color: '#667eea',
  },
  subscriptionMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  statusBadge: {
    padding: '4px 12px',
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
  planBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  },
  price: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a2e',
  },
  subscriptionDates: {
    minWidth: '150px',
  },
  dateLabel: {
    fontSize: '12px',
    color: '#888',
  },
  emptyState: {
    background: 'white',
    borderRadius: '10px',
    padding: '40px',
    textAlign: 'center',
  },
  emptyText: {
    color: '#888',
    marginBottom: '12px',
  },
  createLink: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: '500',
  },
  faqList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  faqItem: {
    background: 'white',
    borderRadius: '10px',
    padding: '20px 24px',
  },
  faqQuestion: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '8px',
  },
  faqAnswer: {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.6',
  },
}
