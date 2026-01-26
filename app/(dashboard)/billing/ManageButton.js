'use client'

import { useState } from 'react'

export default function ManageButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/billing/portal')
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
    <button onClick={handleClick} disabled={isLoading} style={styles.manageButton}>
      {isLoading ? 'Loading...' : 'Manage Billing'}
    </button>
  )
}

const styles = {
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
}
