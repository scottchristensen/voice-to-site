'use client'

import { useState } from 'react'
import SiteCard from '../(dashboard)/dashboard/SiteCard'

export default function DashboardContent({ sites }) {
  const [viewMode, setViewMode] = useState('tile') // 'tile' or 'table'

  return (
    <>
      <style>{`
        /* Hover states for interactive elements */
        .table-action {
          transition: background 0.15s, color 0.15s, transform 0.15s !important;
        }
        .table-action:hover {
          background: #f3f4f6 !important;
          color: #667eea !important;
        }
        .table-action:active {
          transform: scale(0.95);
          background: #e5e7eb !important;
        }
        .view-toggle-btn:hover {
          background: rgba(255,255,255,0.8) !important;
        }
        .view-toggle-btn:active {
          transform: scale(0.95);
        }
        .create-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4) !important;
        }
        .create-button:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3) !important;
        }
        .table-subdomain:hover {
          color: #764ba2 !important;
          text-decoration: underline !important;
        }
        .table-row:hover {
          background: #f9fafb !important;
        }
        .create-tile:hover {
          border-color: #667eea !important;
          background: #f8faff !important;
        }
        .create-tile:hover svg {
          color: #667eea !important;
        }
        .create-row:hover {
          background: #f8faff !important;
        }
        .table-action-primary:hover {
          background: #1d4ed8 !important;
        }
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
              className="view-toggle-btn"
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
              className="view-toggle-btn"
              style={{
                ...styles.viewToggleBtn,
                ...(viewMode === 'table' ? styles.viewToggleBtnActive : {})
              }}
              title="Table view"
            >
              <ListIcon />
            </button>
          </div>
          <a href="/dashboard/new" className="create-button" style={styles.createButton}>
            <PlusIcon />
            <span className="create-btn-text" style={styles.createButtonText}>Create New Site</span>
          </a>
        </div>
      </div>

      <div className="dashboard-container" style={{
        ...styles.container,
        ...(viewMode === 'table' ? { maxWidth: 'none' } : {})
      }}>

      {/* Sites Display */}
      {sites && sites.length > 0 ? (
        viewMode === 'tile' ? (
          <div className="sites-grid" style={styles.grid}>
            {sites.map((site) => (
              <SiteCard key={site.id} site={site} />
            ))}
            {/* Create New Site Card */}
            <a href="/dashboard/new" className="create-tile" style={styles.createTile}>
              <div style={styles.createTileIcon}>
                <PlusIconLarge />
              </div>
              <span style={styles.createTileText}>Create new site</span>
            </a>
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
                {/* Create New Site Row */}
                <tr className="table-row create-row" style={styles.createTableRow}>
                  <td colSpan="6" style={styles.createTableCell}>
                    <a href="/dashboard/new" style={styles.createTableLink}>
                      <PlusIconSmall />
                      <span>Create new site</span>
                    </a>
                  </td>
                </tr>
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
  const [isDuplicating, setIsDuplicating] = useState(false)

  // Determine if site is claimed (has subdomain and is paid)
  const isClaimed = site.subdomain && site.payment_status === 'paid'

  const handleDuplicate = async () => {
    setIsDuplicating(true)
    try {
      const response = await fetch(`/api/sites/${site.id}/duplicate`, {
        method: 'POST',
      })
      const data = await response.json()

      if (data.success) {
        // Refresh the page to show the new duplicated site
        window.location.reload()
      } else {
        alert('Failed to duplicate site: ' + data.error)
      }
    } catch {
      alert('Failed to duplicate site')
    }
    setIsDuplicating(false)
  }

  return (
    <tr className="table-row" style={styles.tableRow}>
      <td style={styles.tableCell}>
        <div style={styles.tableSiteInfo}>
          <div style={{
            ...styles.tableSiteAvatar,
            ...(isClaimed ? {} : styles.tableSiteAvatarDraft)
          }}>
            {site.business_name?.[0]?.toUpperCase() || 'S'}
          </div>
          <span style={styles.tableSiteName}>{site.business_name || 'Untitled Site'}</span>
        </div>
      </td>
      <td style={styles.tableCell}>
        {isClaimed ? (
          <a
            href={`https://${site.subdomain}.speakyour.site`}
            target="_blank"
            rel="noopener noreferrer"
            className="table-subdomain"
            style={styles.tableSubdomain}
          >
            {site.subdomain}.speakyour.site
          </a>
        ) : (
          <span style={styles.tableSubdomainNone}>No URL assigned</span>
        )}
      </td>
      <td style={styles.tableCell}>
        {isClaimed ? (
          <span style={{
            ...styles.statusBadge,
            ...(site.subscription_status === 'active' ? styles.statusActive : styles.statusInactive)
          }}>
            {site.subscription_status === 'active' ? 'Active' : 'Inactive'}
          </span>
        ) : (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{...styles.statusBadge, ...styles.statusUnclaimed}}>Unclaimed</span>
            <span style={{...styles.statusBadge, ...styles.statusNotActive}}>Not Active</span>
          </div>
        )}
      </td>
      <td style={styles.tableCell}>
        <span style={styles.tableDateText}>
          {new Date(site.created_at).toLocaleDateString()}
        </span>
      </td>
      <td style={styles.tableCell}>
        {isClaimed ? (
          <span style={styles.planBadge}>
            {(site.plan_tier || site.plan_type || 'pro').charAt(0).toUpperCase() + (site.plan_tier || site.plan_type || 'pro').slice(1)}
          </span>
        ) : (
          <span style={styles.planBadgeDraft}>Draft</span>
        )}
      </td>
      <td style={styles.tableCellActions}>
        {isClaimed ? (
          <>
            <a
              href={`https://${site.subdomain}.speakyour.site`}
              target="_blank"
              rel="noopener noreferrer"
              className="table-action"
              style={styles.tableAction}
              title="View site"
            >
              <ExternalLinkIcon />
            </a>
            <a href={`/edit/${site.id}`} className="table-action" style={styles.tableAction} title="Edit site">
              <EditIcon />
            </a>
            <button
              onClick={handleDuplicate}
              disabled={isDuplicating}
              className="table-action"
              style={styles.tableActionButton}
              title="Duplicate site"
            >
              {isDuplicating ? '...' : <CopyIcon />}
            </button>
          </>
        ) : (
          <>
            <a href={`/preview/${site.id}`} className="table-action-primary" style={styles.tableActionPrimary} title="Claim site">
              <ClaimIcon />
            </a>
            <a href={`/edit/${site.id}`} className="table-action" style={styles.tableAction} title="Edit site">
              <EditIcon />
            </a>
          </>
        )}
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

function PlusIconLarge() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  )
}

function PlusIconSmall() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  )
}

function ClaimIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
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
    transition: 'background 0.15s, color 0.15s',
  },
  tableActionButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    background: '#f3f4f6',
    borderRadius: '6px',
    color: '#666',
    border: 'none',
    marginLeft: '8px',
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
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
  // Create new site tile
  createTile: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '280px',
    border: '2px dashed #d1d5db',
    borderRadius: '12px',
    background: 'transparent',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  createTileIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#9ca3af',
    marginBottom: '16px',
    transition: 'all 0.2s',
  },
  createTileText: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#6b7280',
  },
  // Create new site table row
  createTableRow: {
    borderBottom: 'none',
  },
  createTableCell: {
    padding: '16px',
    textAlign: 'center',
  },
  createTableLink: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 24px',
    color: '#667eea',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    borderRadius: '8px',
    border: '2px dashed #d1d5db',
    transition: 'all 0.2s',
  },
  // Draft/unclaimed site styles for table
  tableSiteAvatarDraft: {
    background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
  },
  tableSubdomainNone: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  statusUnclaimed: {
    background: '#fef3c7',
    color: '#92400e',
  },
  statusNotActive: {
    background: '#f3f4f6',
    color: '#6b7280',
  },
  planBadgeDraft: {
    padding: '4px 10px',
    background: '#f3f4f6',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  tableActionPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    background: '#2563eb',
    borderRadius: '6px',
    color: 'white',
    textDecoration: 'none',
    marginLeft: '8px',
    transition: 'background 0.15s',
  },
}
