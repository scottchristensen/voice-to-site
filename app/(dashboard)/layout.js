import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardSidebar from '../components/DashboardSidebar'

export default async function DashboardLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <>
      <style>{`
        html, body {
          margin: 0;
          padding: 0;
        }
        @media (max-width: 768px) {
          .dashboard-sidebar {
            transform: translateX(-100%);
          }
          .dashboard-sidebar.open {
            transform: translateX(0);
          }
          .mobile-header {
            display: flex !important;
          }
          .mobile-overlay.open {
            display: block !important;
          }
          .dashboard-main {
            margin-left: 0 !important;
            padding-top: 60px !important;
          }
        }
      `}</style>
      <div style={styles.layout}>
        <DashboardSidebar userEmail={user.email} />
        <main className="dashboard-main" style={styles.main}>
          {children}
        </main>
      </div>
    </>
  )
}

const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    background: '#f5f7fa',
  },
  main: {
    flex: 1,
    marginLeft: '260px',
    background: '#f5f7fa',
    minHeight: '100vh',
  },
}
