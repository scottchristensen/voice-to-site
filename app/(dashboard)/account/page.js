import { createClient } from '@/lib/supabase/server'
import AccountForm from './AccountForm'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Account Settings</h1>
        <p style={styles.subtitle}>Manage your account information</p>
      </div>

      {/* Profile Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Profile</h2>
        <div style={styles.card}>
          <AccountForm user={user} />
        </div>
      </div>

      {/* Email Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Email Address</h2>
        <div style={styles.card}>
          <div style={styles.infoRow}>
            <span style={styles.label}>Email</span>
            <span style={styles.value}>{user.email}</span>
          </div>
          <p style={styles.hint}>
            {user.app_metadata?.provider === 'google'
              ? 'Your email is managed through Google Sign-In'
              : 'Contact support to change your email address'}
          </p>
        </div>
      </div>

      {/* Auth Provider Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Sign-In Method</h2>
        <div style={styles.card}>
          <div style={styles.providerRow}>
            {user.app_metadata?.provider === 'google' ? (
              <>
                <GoogleIcon />
                <span>Google Account</span>
              </>
            ) : (
              <>
                <EmailIcon />
                <span>Email & Password</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div style={styles.section}>
        <h2 style={{...styles.sectionTitle, color: '#dc2626'}}>Danger Zone</h2>
        <div style={{...styles.card, borderColor: '#fecaca'}}>
          <div style={styles.dangerRow}>
            <div>
              <h4 style={styles.dangerTitle}>Delete Account</h4>
              <p style={styles.dangerText}>
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <button style={styles.deleteButton}>Delete Account</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '10px' }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '10px' }}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
      <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
  )
}

const styles = {
  container: {
    padding: '32px',
    maxWidth: '700px',
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
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '12px',
  },
  card: {
    background: 'white',
    borderRadius: '10px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e5e5e5',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#666',
  },
  value: {
    fontSize: '14px',
    color: '#1a1a2e',
  },
  hint: {
    fontSize: '13px',
    color: '#888',
    marginTop: '8px',
  },
  providerRow: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    color: '#1a1a2e',
  },
  dangerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '24px',
    flexWrap: 'wrap',
  },
  dangerTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '4px',
  },
  dangerText: {
    fontSize: '13px',
    color: '#666',
    maxWidth: '400px',
  },
  deleteButton: {
    padding: '10px 20px',
    background: 'white',
    color: '#dc2626',
    border: '1px solid #dc2626',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
}
