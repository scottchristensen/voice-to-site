'use client'

import { useState } from 'react'

export default function ManageButton({ customerId }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    if (!customerId) {
      alert('No billing account found for this site.')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/billing/portal?customerId=${customerId}`)
      const data = await response.json()

      if (data.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer')
      } else {
        alert('Unable to open billing portal. Please try again.')
      }
    } catch {
      alert('Unable to open billing portal. Please try again.')
    }
    setIsLoading(false)
  }

  return (
    <>
      <style>{`
        .manage-button:hover:not(:disabled) {
          background: #667eea !important;
          color: white !important;
        }
        .manage-button:active:not(:disabled) {
          transform: scale(0.98);
        }
        .manage-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
      <button
        onClick={handleClick}
        disabled={isLoading || !customerId}
        className="manage-button"
        style={styles.manageButton}
      >
        {isLoading ? 'Loading...' : 'Manage'}
      </button>
    </>
  )
}

const styles = {
  manageButton: {
    padding: '8px 16px',
    background: 'white',
    color: '#667eea',
    border: '1px solid #667eea',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
}
