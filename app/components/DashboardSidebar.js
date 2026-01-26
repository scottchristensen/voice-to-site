'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function DashboardSidebar({ userEmail }) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isActive = (path) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard' || pathname.startsWith('/dashboard/sites')
    }
    return pathname.startsWith(path)
  }

  return (
    <>
      <style>{`
        .nav-link {
          transition: all 0.2s !important;
        }
        .nav-link:hover {
          background: rgba(255,255,255,0.15) !important;
          color: white !important;
        }
        .nav-link:active {
          background: rgba(255,255,255,0.2) !important;
          transform: scale(0.98);
        }
        .signout-button:hover {
          background: rgba(255,255,255,0.15) !important;
          color: white !important;
        }
        .signout-button:active {
          transform: scale(0.98);
        }
        .hamburger:hover {
          opacity: 0.8;
        }
        .hamburger:active {
          transform: scale(0.95);
        }
      `}</style>
      {/* Mobile Header */}
      <div className="mobile-header" style={styles.mobileHeader}>
        <a href="/" style={styles.mobileLogo}>Speak to Site</a>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="hamburger"
          style={styles.hamburger}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`}
        style={styles.mobileOverlay}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`dashboard-sidebar ${isMobileMenuOpen ? 'open' : ''}`}
        style={styles.sidebar}
      >
        <div style={styles.sidebarHeader}>
          <a href="/" style={styles.logo}>Speak to Site</a>
        </div>

        <nav style={styles.nav}>
          <a
            href="/dashboard"
            className="nav-link"
            style={{
              ...styles.navLink,
              ...(isActive('/dashboard') ? styles.navLinkActive : {})
            }}
          >
            <GridIcon />
            My Sites
          </a>
          <a
            href="/billing"
            className="nav-link"
            style={{
              ...styles.navLink,
              ...(isActive('/billing') ? styles.navLinkActive : {})
            }}
          >
            <CreditCardIcon />
            Billing
          </a>
          <a
            href="/account"
            className="nav-link"
            style={{
              ...styles.navLink,
              ...(isActive('/account') ? styles.navLinkActive : {})
            }}
          >
            <UserIcon />
            Account
          </a>
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>
              {userEmail?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={styles.userDetails}>
              <span style={styles.userEmail}>{userEmail}</span>
            </div>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="signout-button" style={styles.signoutButton}>
              Sign Out
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}

// Icons
function GridIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '12px', flexShrink: 0 }}>
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
  )
}

function CreditCardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '12px', flexShrink: 0 }}>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
      <line x1="1" y1="10" x2="23" y2="10"></line>
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '12px', flexShrink: 0 }}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  )
}

const styles = {
  // Mobile Header
  mobileHeader: {
    display: 'none',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '60px',
    background: '#1a1a2e',
    padding: '0 16px',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1001,
  },
  mobileLogo: {
    fontSize: '18px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textDecoration: 'none',
  },
  hamburger: {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    padding: '8px',
  },
  mobileOverlay: {
    display: 'none',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
  // Sidebar
  sidebar: {
    width: '260px',
    background: '#1a1a2e',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    height: '100vh',
    left: 0,
    top: 0,
    zIndex: 1000,
    transition: 'transform 0.3s ease',
  },
  sidebarOpen: {},
  sidebarHeader: {
    padding: '24px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  logo: {
    fontSize: '20px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textDecoration: 'none',
  },
  nav: {
    flex: 1,
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    color: 'rgba(255,255,255,0.7)',
    textDecoration: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  navLinkActive: {
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
  },
  sidebarFooter: {
    padding: '16px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
    flexShrink: 0,
  },
  userDetails: {
    flex: 1,
    overflow: 'hidden',
  },
  userEmail: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.7)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'block',
  },
  signoutButton: {
    width: '100%',
    padding: '10px 16px',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '6px',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
}
