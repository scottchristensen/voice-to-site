'use client'

import { useState, useRef, useEffect } from 'react'

// Translations
const translations = {
  en: {
    editYourSite: 'Edit Your Site',
    editsRemaining: (n) => `${n} edit${n !== 1 ? 's' : ''} remaining`,
    whatToChange: 'What would you like to change?',
    tryThingsLike: 'Try things like:',
    example1: '"Change the phone number to 555-1234"',
    example2: '"Make the header blue instead of purple"',
    example3: '"Update the business hours"',
    describeEdit: 'Describe your edit...',
    done: 'Done! Your change has been applied.',
    limitReached: "You've used all 5 free edits. Claim your site to continue editing!",
    error: 'Something went wrong. Please try again.',
    networkError: 'Network error. Please try again.',
    loadingStatuses: [
      'Analyzing your request...',
      'Updating your site...',
      'Applying changes...',
      'Almost there...',
      'Polishing details...',
    ],
  },
  es: {
    editYourSite: 'Edita Tu Sitio',
    editsRemaining: (n) => `${n} edición${n !== 1 ? 'es' : ''} restante${n !== 1 ? 's' : ''}`,
    whatToChange: '¿Qué te gustaría cambiar?',
    tryThingsLike: 'Prueba cosas como:',
    example1: '"Cambiar el número de teléfono a 555-1234"',
    example2: '"Hacer el encabezado azul en lugar de morado"',
    example3: '"Actualizar el horario de atención"',
    describeEdit: 'Describe tu edición...',
    done: '¡Listo! Tu cambio ha sido aplicado.',
    limitReached: 'Has usado las 5 ediciones gratuitas. ¡Reclama tu sitio para continuar editando!',
    error: 'Algo salió mal. Por favor intenta de nuevo.',
    networkError: 'Error de red. Por favor intenta de nuevo.',
    loadingStatuses: [
      'Analizando tu solicitud...',
      'Actualizando tu sitio...',
      'Aplicando cambios...',
      'Casi listo...',
      'Puliendo detalles...',
    ],
  }
}

export default function EditPanel({
  isOpen,
  onClose,
  siteId,
  editsRemaining,
  onEditComplete,
  onLimitReached,
  language = 'en',
  isDarkMode = false
}) {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStatusIndex, setLoadingStatusIndex] = useState(0)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const t = translations[language] || translations.en

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // Loading status carousel
  useEffect(() => {
    if (!isLoading) {
      setLoadingStatusIndex(0)
      return
    }
    const interval = setInterval(() => {
      setLoadingStatusIndex(prev => (prev + 1) % t.loadingStatuses.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [isLoading, t.loadingStatuses.length])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    // Check if limit reached before submitting
    if (editsRemaining <= 0) {
      onLimitReached()
      return
    }

    const userMessage = inputValue.trim()
    setInputValue('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch('/api/preview-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          editInstruction: userMessage
        })
      })

      const result = await response.json()

      if (result.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: t.done,
          success: true
        }])
        onEditComplete(result.html, result.editsRemaining)
      } else if (result.error === 'limit_reached') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: t.limitReached,
          error: true
        }])
        onLimitReached()
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: result.error || t.error,
          error: true
        }])
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: t.networkError,
        error: true
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      ...styles.panel,
      ...(isDarkMode && styles.panelDark),
      transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
    }}>
      {/* Header */}
      <div style={{...styles.header, ...(isDarkMode && styles.headerDark)}}>
        <div style={styles.headerLeft}>
          <h3 style={{...styles.title, ...(isDarkMode && styles.titleDark)}}>{t.editYourSite}</h3>
          <span style={{...styles.editsBadge, ...(isDarkMode && styles.editsBadgeDark)}}>
            {t.editsRemaining(editsRemaining)}
          </span>
        </div>
        <button onClick={onClose} style={{...styles.closeButton, ...(isDarkMode && styles.closeButtonDark)}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div style={styles.messages}>
        {messages.length === 0 && (
          <div style={styles.emptyState}>
            <p style={{...styles.emptyTitle, ...(isDarkMode && styles.emptyTitleDark)}}>{t.whatToChange}</p>
            <p style={{...styles.emptyText, ...(isDarkMode && styles.emptyTextDark)}}>
              {t.tryThingsLike}
            </p>
            <ul style={{...styles.exampleList, ...(isDarkMode && styles.exampleListDark)}}>
              <li>{t.example1}</li>
              <li>{t.example2}</li>
              <li>{t.example3}</li>
            </ul>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.message,
              ...(msg.role === 'user' ? styles.userMessage : {...styles.assistantMessage, ...(isDarkMode && styles.assistantMessageDark)}),
              ...(msg.error ? styles.errorMessage : {}),
              ...(msg.success ? styles.successMessage : {})
            }}
          >
            {msg.role === 'assistant' && msg.success && (
              <span style={styles.checkmark}>✓</span>
            )}
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div style={{ ...styles.message, ...styles.assistantMessage, ...(isDarkMode && styles.assistantMessageDark) }}>
            {t.loadingStatuses[loadingStatusIndex]}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{...styles.inputForm, ...(isDarkMode && styles.inputFormDark)}}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={t.describeEdit}
          style={{...styles.input, ...(isDarkMode && styles.inputDark)}}
          disabled={isLoading}
        />
        <button
          type="submit"
          style={{
            ...styles.sendButton,
            opacity: isLoading || !inputValue.trim() ? 0.5 : 1
          }}
          disabled={isLoading || !inputValue.trim()}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </form>

      <style>{`
        @keyframes blink {
          0%, 20% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
        .loading-dots span:nth-child(1) { animation: blink 1.4s infinite 0s; }
        .loading-dots span:nth-child(2) { animation: blink 1.4s infinite 0.2s; }
        .loading-dots span:nth-child(3) { animation: blink 1.4s infinite 0.4s; }
      `}</style>
    </div>
  )
}

const styles = {
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '350px',
    background: 'white',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    borderRight: '1px solid #e5e7eb',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  title: {
    fontSize: '16px',
    fontWeight: '600',
    margin: 0,
    color: '#1f2937',
  },
  editsBadge: {
    display: 'inline-block',
    fontSize: '12px',
    fontWeight: '500',
    color: '#6366f1',
    background: '#eef2ff',
    padding: '4px 8px',
    borderRadius: '12px',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    padding: '8px',
    cursor: 'pointer',
    color: '#6b7280',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '20px 0',
    color: '#6b7280',
  },
  emptyTitle: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '12px',
  },
  emptyText: {
    fontSize: '13px',
    marginBottom: '8px',
  },
  exampleList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    fontSize: '13px',
    textAlign: 'left',
    background: '#f9fafb',
    borderRadius: '8px',
    padding: '12px 16px',
  },
  message: {
    padding: '10px 14px',
    borderRadius: '12px',
    fontSize: '14px',
    lineHeight: '1.5',
    maxWidth: '90%',
  },
  userMessage: {
    background: '#2563eb',
    color: 'white',
    alignSelf: 'flex-end',
    borderBottomRightRadius: '4px',
  },
  assistantMessage: {
    background: '#f3f4f6',
    color: '#374151',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: '4px',
  },
  successMessage: {
    background: '#ecfdf5',
    color: '#059669',
  },
  errorMessage: {
    background: '#fef2f2',
    color: '#dc2626',
  },
  checkmark: {
    marginRight: '6px',
    fontWeight: '600',
  },
  inputForm: {
    display: 'flex',
    gap: '8px',
    padding: '12px 16px',
    borderTop: '1px solid #e5e7eb',
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '24px',
    fontSize: '14px',
    outline: 'none',
  },
  sendButton: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.2s',
  },
  // Dark mode variants
  panelDark: {
    background: '#111111',
    borderRight: '1px solid #2a2a2a',
  },
  headerDark: {
    borderBottom: '1px solid #2a2a2a',
  },
  titleDark: {
    color: '#e5e5e5',
  },
  editsBadgeDark: {
    color: '#a5b4fc',
    background: '#1e1b4b',
  },
  closeButtonDark: {
    color: '#9ca3af',
  },
  emptyTitleDark: {
    color: '#e5e5e5',
  },
  emptyTextDark: {
    color: '#9ca3af',
  },
  exampleListDark: {
    background: '#1a1a1a',
    color: '#9ca3af',
  },
  assistantMessageDark: {
    background: '#1f1f1f',
    color: '#e5e5e5',
  },
  inputFormDark: {
    borderTop: '1px solid #2a2a2a',
  },
  inputDark: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    color: '#e5e5e5',
  },
}
