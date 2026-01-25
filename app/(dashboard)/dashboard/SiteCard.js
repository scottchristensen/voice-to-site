'use client'

import { useState } from 'react'

export default function SiteCard({ site }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDuplicate = async () => {
    setIsDuplicating(true)
    try {
      const response = await fetch(`/api/sites/${site.id}/duplicate`, {
        method: 'POST',
      })
      const data = await response.json()

      if (data.success) {
        // Redirect to the preview of the duplicated site
        window.location.href = data.previewUrl
      } else {
        alert('Failed to duplicate site: ' + data.error)
      }
    } catch (error) {
      alert('Failed to duplicate site')
    }
    setIsDuplicating(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/sites/${site.id}/delete`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (data.success) {
        // Refresh the page to show updated list
        window.location.reload()
      } else {
        alert('Failed to delete site: ' + data.error)
      }
    } catch (error) {
      alert('Failed to delete site')
    }
    setIsDeleting(false)
    setShowDeleteConfirm(false)
  }

  return (
    <div style={styles.card}>
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
        <a href={`/edit/${site.id}`} style={styles.actionButton}>
          <EditIcon />
          Edit
        </a>
        <button
          onClick={handleDuplicate}
          disabled={isDuplicating}
          style={styles.actionButtonSecondary}
        >
          <CopyIcon />
          {isDuplicating ? '...' : 'Duplicate'}
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          style={styles.deleteButton}
        >
          <TrashIcon />
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Delete Site?</h3>
            <p style={styles.modalText}>
              This will cancel your subscription and take <strong>{site.subdomain}.speakyour.site</strong> offline. This action cannot be undone.
            </p>
            <div style={styles.modalActions}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={styles.confirmDeleteButton}
              >
                {isDeleting ? 'Deleting...' : 'Delete Site'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
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

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  )
}

const styles = {
  card: {
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e5e7eb',
    position: 'relative',
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
  deleteButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    background: 'transparent',
    border: '1px solid #e5e5e5',
    borderRadius: '6px',
    color: '#999',
    cursor: 'pointer',
    marginLeft: 'auto',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '400px',
    width: '90%',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '12px',
  },
  modalText: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '24px',
    lineHeight: '1.6',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: '10px 20px',
    background: 'white',
    border: '1px solid #e5e5e5',
    borderRadius: '6px',
    color: '#666',
    fontSize: '14px',
    cursor: 'pointer',
  },
  confirmDeleteButton: {
    padding: '10px 20px',
    background: '#dc2626',
    border: 'none',
    borderRadius: '6px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
}
