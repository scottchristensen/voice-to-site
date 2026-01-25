'use client'

import { useState, useRef, useEffect } from 'react'

export default function EditSheet({
  isOpen,
  onClose,
  siteId,
  editsRemaining,
  onEditComplete,
  onLimitReached
}) {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sheetHeight, setSheetHeight] = useState('70vh')
  const [dragOffset, setDragOffset] = useState(0)
  const [loadingStatusIndex, setLoadingStatusIndex] = useState(0)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const sheetRef = useRef(null)
  const dragStartY = useRef(null)

  const loadingStatuses = [
    'Analyzing your request...',
    'Updating your site...',
    'Applying changes...',
    'Almost there...',
    'Polishing details...',
  ]

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when sheet opens
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
      setLoadingStatusIndex(prev => (prev + 1) % loadingStatuses.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [isLoading])

  const handleDragStart = (e) => {
    dragStartY.current = e.touches ? e.touches[0].clientY : e.clientY
  }

  const handleDrag = (e) => {
    if (dragStartY.current === null) return
    const currentY = e.touches ? e.touches[0].clientY : e.clientY
    const delta = Math.max(0, currentY - dragStartY.current)
    setDragOffset(delta)
  }

  const handleDragEnd = () => {
    if (dragOffset > 100) {
      onClose()
    }
    setDragOffset(0)
    dragStartY.current = null
  }

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
          content: 'Done! Your change has been applied.',
          success: true
        }])
        onEditComplete(result.html, result.editsRemaining)
      } else if (result.error === 'limit_reached') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "You've used all 5 free edits. Claim your site to continue editing!",
          error: true
        }])
        onLimitReached()
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: result.error || 'Something went wrong. Please try again.',
          error: true
        }])
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Network error. Please try again.',
        error: true
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          ...styles.backdrop,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        style={{
          ...styles.sheet,
          transform: isOpen ? `translateY(${dragOffset}px)` : 'translateY(100%)',
          height: sheetHeight,
        }}
      >
        {/* Drag Handle */}
        <div
          style={styles.dragHandleArea}
          onTouchStart={handleDragStart}
          onTouchMove={handleDrag}
          onTouchEnd={handleDragEnd}
          onMouseDown={handleDragStart}
          onMouseMove={handleDrag}
          onMouseUp={handleDragEnd}
        >
          <div style={styles.dragHandle} />
        </div>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.editsSubtitle}>
              {editsRemaining} edit{editsRemaining !== 1 ? 's' : ''} remaining
            </span>
          </div>
          <button onClick={onClose} style={styles.minimizeButton}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 14l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div style={styles.messages}>
          {messages.length === 0 && (
            <div style={styles.emptyState}>
              <p style={styles.emptyTitle}>What would you like to change?</p>
              <div style={styles.exampleChips}>
                <button
                  style={styles.chip}
                  onClick={() => setInputValue('Change the phone number')}
                >
                  Change phone number
                </button>
                <button
                  style={styles.chip}
                  onClick={() => setInputValue('Update the headline')}
                >
                  Update headline
                </button>
                <button
                  style={styles.chip}
                  onClick={() => setInputValue('Change the colors')}
                >
                  Change colors
                </button>
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                ...styles.message,
                ...(msg.role === 'user' ? styles.userMessage : styles.assistantMessage),
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
            <div style={{ ...styles.message, ...styles.assistantMessage }}>
              {loadingStatuses[loadingStatusIndex]}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} style={styles.inputForm}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Describe your edit..."
            style={styles.input}
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

      </div>

    </>
  )
}

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.3)',
    zIndex: 90,
    transition: 'opacity 0.3s ease',
  },
  sheet: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'white',
    borderTopLeftRadius: '20px',
    borderTopRightRadius: '20px',
    boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
    transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    maxHeight: '85vh',
  },
  dragHandleArea: {
    padding: '12px 0 8px 0',
    cursor: 'grab',
    touchAction: 'none',
  },
  dragHandle: {
    width: '36px',
    height: '4px',
    background: '#d1d5db',
    borderRadius: '2px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 16px 12px 16px',
    borderBottom: '1px solid #e5e7eb',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  editsSubtitle: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#6b7280',
  },
  minimizeButton: {
    display: 'flex',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    padding: '8px 12px',
    cursor: 'pointer',
    color: '#6b7280',
    fontSize: '14px',
    fontWeight: '500',
    borderRadius: '6px',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    minHeight: '120px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '8px 0',
  },
  emptyTitle: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '12px',
  },
  exampleChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    justifyContent: 'center',
  },
  chip: {
    background: '#f3f4f6',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '16px',
    fontSize: '13px',
    color: '#4b5563',
    cursor: 'pointer',
  },
  message: {
    padding: '10px 14px',
    borderRadius: '16px',
    fontSize: '14px',
    lineHeight: '1.4',
    maxWidth: '85%',
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
    fontSize: '16px', // Prevents iOS zoom
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
    flexShrink: 0,
    transition: 'opacity 0.2s',
  },
}
