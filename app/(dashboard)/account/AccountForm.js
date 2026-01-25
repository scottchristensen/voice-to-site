'use client'

import { useState } from 'react'

export default function AccountForm({ user }) {
  const [fullName, setFullName] = useState(user.user_metadata?.full_name || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      })

      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({ type: 'success', text: 'Profile updated successfully' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' })
    }

    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={styles.formGroup}>
        <label style={styles.label}>Full Name</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your name"
          style={styles.input}
        />
      </div>

      {message && (
        <div style={{
          ...styles.message,
          ...(message.type === 'error' ? styles.errorMessage : styles.successMessage)
        }}>
          {message.text}
        </div>
      )}

      <button type="submit" disabled={saving} style={styles.saveButton}>
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  )
}

const styles = {
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '14px',
    border: '1px solid #e5e5e5',
    borderRadius: '6px',
    outline: 'none',
  },
  message: {
    padding: '10px 14px',
    borderRadius: '6px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  errorMessage: {
    background: '#fee2e2',
    color: '#dc2626',
  },
  successMessage: {
    background: '#dcfce7',
    color: '#16a34a',
  },
  saveButton: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
}
