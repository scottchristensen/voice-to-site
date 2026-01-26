'use client'

import { useState } from 'react'
import SiteCard from '../(dashboard)/dashboard/SiteCard'

export default function DashboardContent({ sites }) {
  const [viewMode, setViewMode] = useState('tile') // 'tile' or 'table'

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .dashboard-container {
            padding: 20px 16px !important;
          }
          .dashboard-header {
            padding: 20px 16px !important;
            padding-bottom: 0 !important;
          }
          .header-right {
            justify-content: flex-end !important;
          }
          .create-btn-text {
            display: none !important;
          }
          .sites-grid {
            grid-template-columns: 1fr !important;
          }
          .table-wrapper {
            overflow-x: auto;
          }
        }
      `}</style>
      <div style={styles.pageWrapper}>
      {/* Header - Full Width */}
      <div className="dashboard-header" style={styles.headerWrapper}>
        <div style={styles.headerInner}>
          <div style={styles.headerLeft}>
            <h1 style={styles.title}>My Sites</h1>
            <p style={styles.subtitle}>Manage and edit your websites</p>
          </div>
        </div>
        <div className="header-right" style={styles.headerRight}>
          {/* View Toggle */}
          <div style={styles.viewToggle}>
            <button
              onClick={() => setViewMode('tile')}
              style={{
                ...styles.viewToggleBtn,
                ...(viewMode === 'tile' ? styles.viewToggleBtnActive : {})
              }}
              title="Tile view"
            >
              <GridIcon />
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                ...styles.viewToggleBtn,
                ...(viewMode === 'table' ? styles.viewToggleBtnActive : {})
              }}
              title="Table view"
            >
              <ListIcon />
            </button>
          </div>
          <a href="/dashboard/new" style={styles.createButton}>
            <PlusIcon />
            <span className="create-btn-text" style={styles.createButtonText}>Create New Site</span>
          </a>
        </div>
      </div>

      <div className="dashboard-container" style={styles.container}>

      {/* Sites Display */}
      {sites && sites.length > 0 ? (
        viewMode === 'tile' ? (
          <div className="sites-grid" style={styles.grid}>
            {sites.map((site) => (
              <SiteCard key={site.id} site={site} />
            ))}
          </div>
        ) : (
          <div className="table-wrapper" style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  <th style={styles.tableHeader}>Site</th>
                  <th style={styles.tableHeader}>Subdomain</th>
                  <th style={styles.tableHeader}>Status</th>
                  <th style={styles.tableHeader}>Created</th>
                  <th style={styles.tableHeader}>Plan</th>
                  <th style={styles.tableHeaderActions}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sites.map((site) => (
                  <SiteTableRow key={site.id} site={site} />
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>&#127760;</div>
          <h2 style={styles.emptyTitle}>No sites yet</h2>
          <p style={styles.emptyText}>
            Create your first website by talking to our AI assistant.
            It only takes a few minutes!
          </p>
          <a href="/dashboard/new" style={styles.emptyButton}>
            <PlusIcon />
            Create Your First Site
          </a>
        </div>
      )}
      </div>
    </div>
    </>
  )
}

function SiteTableRow({ site }) {
  return (
    <tr style={styles.tableRow}>
      <td style={styles.tableCell}>
        <div style={styles.tableSiteInfo}>
          <div style={styles.tableSiteAvatar}>
            {site.business_name?.[0]?.toUpperCase() || 'S'}
          </div>
          <span style={styles.tableSiteName}>{site.business_name || 'Untitled Site'}</span>
        </div>
      </td>
      <td style={styles.tableCell}>
        <a
          href={`https://${site.subdomain}.speakyour.site`}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.tableSubdomain}
        >
          {site.subdomain}.speakyour.site
        </a>
      </td>
      <td style={styles.tableCell}>
        <span style={{
          ...styles.statusBadge,
          ...(site.subscription_status === 'active' ? styles.statusActive : styles.statusInactive)
        }}>
          {site.subscription_status === 'active' ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td style={styles.tableCell}>
        <span style={styles.tableDateText}>
          {new Date(site.created_at).toLocaleDateString()}
        </span>
      </td>
      <td style={styles.tableCell}>
        <span style={styles.planBadge}>
          {site.plan_type || 'Standard'}
        </span>
      </td>
      <td style={styles.tableCellActions}>
        <a
          href={`https://${site.subdomain}.speakyour.site`}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.tableAction}
          title="View site"
        >
          <ExternalLinkIcon />
        </a>
        <a href={`/dashboard/sites/${site.id}/edit`} style={styles.tableAction} title="Edit site">
          <EditIcon />
        </a>
        <a href={`/dashboard/sites/${site.id}/plan`} style={styles.tableAction} title="Manage plan">
          <CreditCardIcon />
        </a>
      </td>
    </tr>
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

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"></line>
      <line x1="8" y1="12" x2="21" y2="12"></line>
      <line x1="8" y1="18" x2="21" y2="18"></line>
      <line x1="3" y1="6" x2="3.01" y2="6"></line>
      <line x1="3" y1="12" x2="3.01" y2="12"></line>
      <line x1="3" y1="18" x2="3.01" y2="18"></line>
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1"></circle>
      <circle cx="19" cy="12" r="1"></circle>
      <circle cx="5" cy="12" r="1"></circle>
    </svg>
  )
}

function CreditCardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
      <line x1="1" y1="10" x2="23" y2="10"></line>
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  )
}

const styles = {
  pageWrapper: {
    minHeight: '100%',
  },
  headerWrapper: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '32px',
    paddingBottom: '0',
    flexWrap: 'wrap',
    gap: '16px',
  },
  headerInner: {
    flex: 1,
    minWidth: '200px',
  },
  container: {
    padding: '32px',
    paddingTop: '24px',
    maxWidth: '1200px',
  },
  headerLeft: {
    flex: 1,
    minWidth: '200px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: '4px',
    margin: 0,
  },
  subtitle: {
    fontSize: '15px',
    color: '#666',
    margin: 0,
    marginTop: '4px',
  },
  viewToggle: {
    display: 'flex',
    background: '#e5e7eb',
    borderRadius: '8px',
    padding: '4px',
  },
  viewToggleBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '32px',
    background: 'transparent',
    border: 'none',
    borderRadius: '6px',
    color: '#666',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  viewToggleBtnActive: {
    background: 'white',
    color: '#1a1a2e',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
  createButtonText: {
    display: 'inline',
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
    margin: 0,
  },
  cardSubdomain: {
    fontSize: '13px',
    color: '#667eea',
    marginBottom: '12px',
    marginTop: '4px',
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
    justifyContent: 'center',
    padding: '8px 10px',
    background: 'transparent',
    border: '1px solid #e5e5e5',
    borderRadius: '6px',
    color: '#666',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  menuContainer: {
    position: 'relative',
    marginLeft: 'auto',
  },
  menuOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  dropdown: {
    position: 'absolute',
    right: 0,
    top: '100%',
    marginTop: '4px',
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    border: '1px solid #e5e7eb',
    minWidth: '160px',
    zIndex: 20,
    overflow: 'hidden',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '10px 14px',
    background: 'none',
    border: 'none',
    fontSize: '13px',
    color: '#333',
    cursor: 'pointer',
    textDecoration: 'none',
    textAlign: 'left',
  },
  dropdownItemDanger: {
    color: '#dc2626',
  },
  // Table styles
  tableWrapper: {
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e5e7eb',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeaderRow: {
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
  },
  tableHeader: {
    padding: '14px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tableHeaderActions: {
    padding: '14px 16px',
    textAlign: 'right',
    fontSize: '12px',
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tableRow: {
    borderBottom: '1px solid #f0f0f0',
  },
  tableCell: {
    padding: '16px',
    fontSize: '14px',
    color: '#333',
    verticalAlign: 'middle',
  },
  tableCellActions: {
    padding: '16px',
    textAlign: 'right',
    verticalAlign: 'middle',
  },
  tableSiteInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  tableSiteAvatar: {
    width: '36px',
    height: '36px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
  },
  tableSiteName: {
    fontWeight: '500',
  },
  tableSubdomain: {
    color: '#667eea',
    textDecoration: 'none',
  },
  tableDateText: {
    color: '#888',
  },
  planBadge: {
    padding: '4px 10px',
    background: '#f3f4f6',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#666',
  },
  tableAction: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    background: '#f3f4f6',
    borderRadius: '6px',
    color: '#666',
    textDecoration: 'none',
    marginLeft: '8px',
  },
  // Empty state
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
