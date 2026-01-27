'use client'

import { useState, useRef, useEffect } from 'react'

// UI Translations
const translations = {
  en: {
    dashboard: 'Dashboard',
    editing: 'Editing',
    viewLive: 'View Live',
    editYourSite: 'Edit Your Site',
    text: 'Text',
    voice: 'Voice',
    whatToChange: 'What would you like to change?',
    tryThings: 'Try things like:',
    example1: '"Change the phone number to 555-1234"',
    example2: '"Make the header blue instead of purple"',
    example3: '"Update the business hours"',
    changePhone: 'Change phone number',
    updateHeadline: 'Update headline',
    changeColors: 'Change colors',
    describeEdit: 'Describe your edit...',
    doneApplied: 'Done! Your change has been applied.',
    somethingWrong: 'Something went wrong. Please try again.',
    networkError: 'Network error. Please try again.',
    editWithVoice: 'Edit with Voice',
    voiceDescription: 'Start a conversation with our AI assistant to make changes to your website using your voice.',
    startVoiceSession: 'Start Voice Session',
    connecting: 'Connecting...',
    connectingWait: 'Please wait while we connect you to the AI assistant.',
    listening: 'Listening...',
    listenDescribe: 'Describe the changes you want to make to your website. Say "I\'m done" when finished.',
    endSession: 'End Session',
    viewLiveSite: 'View Live Site',
    minimize: 'Minimize',
    tapToStart: 'Tap to start a voice editing session',
    listeningDescribe: 'Listening... describe your changes',
    edit: 'Edit',
  },
  es: {
    dashboard: 'Panel',
    editing: 'Editando',
    viewLive: 'Ver en Vivo',
    editYourSite: 'Edita Tu Sitio',
    text: 'Texto',
    voice: 'Voz',
    whatToChange: '¿Qué te gustaría cambiar?',
    tryThings: 'Prueba cosas como:',
    example1: '"Cambiar el número de teléfono a 555-1234"',
    example2: '"Hacer el encabezado azul en lugar de morado"',
    example3: '"Actualizar el horario de atención"',
    changePhone: 'Cambiar teléfono',
    updateHeadline: 'Actualizar título',
    changeColors: 'Cambiar colores',
    describeEdit: 'Describe tu edición...',
    doneApplied: '¡Listo! Tu cambio ha sido aplicado.',
    somethingWrong: 'Algo salió mal. Por favor intenta de nuevo.',
    networkError: 'Error de red. Por favor intenta de nuevo.',
    editWithVoice: 'Editar con Voz',
    voiceDescription: 'Inicia una conversación con nuestro asistente de IA para hacer cambios a tu sitio web usando tu voz.',
    startVoiceSession: 'Iniciar Sesión de Voz',
    connecting: 'Conectando...',
    connectingWait: 'Por favor espera mientras te conectamos con el asistente de IA.',
    listening: 'Escuchando...',
    listenDescribe: 'Describe los cambios que quieres hacer a tu sitio web. Di "Terminé" cuando hayas acabado.',
    endSession: 'Terminar Sesión',
    viewLiveSite: 'Ver Sitio en Vivo',
    minimize: 'Minimizar',
    tapToStart: 'Toca para iniciar una sesión de edición por voz',
    listeningDescribe: 'Escuchando... describe tus cambios',
    edit: 'Editar',
  }
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

export default function EditSiteClient({ site }) {
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(true) // Open by default
  const [currentHtml, setCurrentHtml] = useState(site.html_code)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [editMode, setEditMode] = useState('text') // 'text' or 'voice'
  const [callStatus, setCallStatus] = useState('idle') // 'idle', 'connecting', 'active'
  const [language, setLanguage] = useState('en')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const vapiRef = useRef(null)
  const isMobile = useIsMobile()

  // Load language preference from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage')
    if (savedLanguage === 'en' || savedLanguage === 'es') {
      setLanguage(savedLanguage)
    }
  }, [])

  // Persist language choice to localStorage
  useEffect(() => {
    localStorage.setItem('preferredLanguage', language)
  }, [language])

  const t = translations[language] || translations.en

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when panel opens (text mode)
  useEffect(() => {
    if (isEditPanelOpen && editMode === 'text') {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isEditPanelOpen, editMode])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const userMessage = inputValue.trim()
    setInputValue('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch('/api/preview-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: site.id,
          editInstruction: userMessage
        })
      })

      const result = await response.json()

      if (result.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: t.doneApplied,
          success: true
        }])
        setCurrentHtml(result.html)
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: result.error || t.somethingWrong,
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

  const startVoiceAgent = async () => {
    setCallStatus('connecting')

    try {
      const { default: Vapi } = await import('@vapi-ai/web')

      if (!vapiRef.current) {
        vapiRef.current = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY)

        vapiRef.current.on('call-start', () => {
          setCallStatus('active')
        })

        vapiRef.current.on('call-end', () => {
          setCallStatus('idle')
        })

        vapiRef.current.on('error', (error) => {
          console.error('Vapi error:', error)
          setCallStatus('idle')
        })

        vapiRef.current.on('message', (message) => {
          if (message.type === 'tool-call-result' || message.type === 'transcript') {
            const text = message.result || message.output || ''
            const urlMatch = text.match(/https?:\/\/[^\s"',]+\/preview\/[^\s"',]+/)
            if (urlMatch) {
              window.location.reload()
            }
          }
        })
      }

      // Route to Spanish or English VAPI assistant based on language
      const assistantId = language === 'es'
        ? process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID_ES
        : process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID

      await vapiRef.current.start(assistantId || process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID, {
        variableValues: {
          mode: 'edit',
          siteId: site.id,
          businessName: site.business_name || '',
          subdomain: site.subdomain,
          existingSiteContext: `The user is editing their existing site for "${site.business_name || 'their business'}". The site is currently live at ${site.subdomain}.speakyour.site. Help them make changes to their website.`
        }
      })

    } catch (error) {
      console.error('Failed to start voice agent:', error)
      setCallStatus('idle')
    }
  }

  const endCall = () => {
    if (vapiRef.current) {
      vapiRef.current.stop()
    }
    setCallStatus('idle')
  }

  // Desktop Edit Panel
  const renderDesktopPanel = () => (
    <div style={{
      ...styles.panel,
      transform: isEditPanelOpen ? 'translateX(0)' : 'translateX(-100%)',
    }}>
      {/* Header */}
      <div style={styles.panelHeader}>
        <div style={styles.panelHeaderLeft}>
          <h3 style={styles.panelTitle}>{t.editYourSite}</h3>
          <span style={styles.siteBadge}>{site.business_name || 'Untitled Site'}</span>
        </div>
        <button onClick={() => setIsEditPanelOpen(false)} style={styles.closeButton}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Mode Toggle */}
      <div style={styles.modeToggle}>
        <button
          onClick={() => setEditMode('text')}
          style={{
            ...styles.modeButton,
            ...(editMode === 'text' ? styles.modeButtonActive : {})
          }}
        >
          <ChatIcon />
          {t.text}
        </button>
        <button
          onClick={() => setEditMode('voice')}
          style={{
            ...styles.modeButton,
            ...(editMode === 'voice' ? styles.modeButtonActive : {})
          }}
        >
          <MicIcon />
          {t.voice}
        </button>
      </div>

      {/* Text Edit Mode */}
      {editMode === 'text' && (
        <>
          <div style={styles.messages}>
            {messages.length === 0 && (
              <div style={styles.emptyState}>
                <p style={styles.emptyTitle}>{t.whatToChange}</p>
                <p style={styles.emptyText}>{t.tryThings}</p>
                <ul style={styles.exampleList}>
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
                <span className="loading-dots">
                  <span>.</span><span>.</span><span>.</span>
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} style={styles.inputForm}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t.describeEdit}
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
        </>
      )}

      {/* Voice Edit Mode */}
      {editMode === 'voice' && (
        <div style={styles.voiceContainer}>
          <div style={styles.voiceContent}>
            {callStatus === 'idle' && (
              <>
                <div style={styles.voiceIcon}>
                  <MicLargeIcon />
                </div>
                <h4 style={styles.voiceTitle}>{t.editWithVoice}</h4>
                <p style={styles.voiceText}>
                  {t.voiceDescription}
                </p>
                <button onClick={startVoiceAgent} style={styles.startVoiceButton}>
                  <MicIcon />
                  {t.startVoiceSession}
                </button>
              </>
            )}
            {callStatus === 'connecting' && (
              <>
                <div style={styles.voiceIconConnecting}>
                  <LoadingSpinner />
                </div>
                <h4 style={styles.voiceTitle}>{t.connecting}</h4>
                <p style={styles.voiceText}>{t.connectingWait}</p>
              </>
            )}
            {callStatus === 'active' && (
              <>
                <div style={styles.voiceIconActive}>
                  <span style={styles.pulseRing}></span>
                  <MicLargeIcon />
                </div>
                <h4 style={styles.voiceTitle}>{t.listening}</h4>
                <p style={styles.voiceText}>
                  {t.listenDescribe}
                </p>
                <button onClick={endCall} style={styles.endCallButton}>
                  {t.endSession}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div style={styles.panelFooter}>
        <a
          href={`https://${site.subdomain}.speakyour.site`}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.viewLiveLink}
        >
          <ExternalLinkIcon />
          {t.viewLiveSite}
        </a>
      </div>

      <style>{`
        @keyframes blink {
          0%, 20% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
        .loading-dots span:nth-child(1) { animation: blink 1.4s infinite 0s; }
        .loading-dots span:nth-child(2) { animation: blink 1.4s infinite 0.2s; }
        .loading-dots span:nth-child(3) { animation: blink 1.4s infinite 0.4s; }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )

  // Mobile Edit Sheet
  const renderMobileSheet = () => (
    <>
      {/* Backdrop */}
      <div
        style={{
          ...styles.backdrop,
          opacity: isEditPanelOpen ? 1 : 0,
          pointerEvents: isEditPanelOpen ? 'auto' : 'none',
        }}
        onClick={() => setIsEditPanelOpen(false)}
      />

      {/* Sheet */}
      <div
        style={{
          ...styles.sheet,
          transform: isEditPanelOpen ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        {/* Drag Handle */}
        <div style={styles.dragHandleArea}>
          <div style={styles.dragHandle} />
        </div>

        {/* Header */}
        <div style={styles.sheetHeader}>
          <span style={styles.sheetTitle}>{t.editYourSite}</span>
          <button onClick={() => setIsEditPanelOpen(false)} style={styles.minimizeButton}>
            {t.minimize}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '4px' }}>
              <path d="M19 14l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Mode Toggle */}
        <div style={styles.modeToggleMobile}>
          <button
            onClick={() => setEditMode('text')}
            style={{
              ...styles.modeButtonMobile,
              ...(editMode === 'text' ? styles.modeButtonMobileActive : {})
            }}
          >
            <ChatIcon />
            {t.text}
          </button>
          <button
            onClick={() => setEditMode('voice')}
            style={{
              ...styles.modeButtonMobile,
              ...(editMode === 'voice' ? styles.modeButtonMobileActive : {})
            }}
          >
            <MicIcon />
            {t.voice}
          </button>
        </div>

        {/* Text Edit Mode */}
        {editMode === 'text' && (
          <>
            <div style={styles.sheetMessages}>
              {messages.length === 0 && (
                <div style={styles.emptyState}>
                  <p style={styles.emptyTitle}>{t.whatToChange}</p>
                  <div style={styles.exampleChips}>
                    <button style={styles.chip} onClick={() => setInputValue(language === 'es' ? 'Cambiar el teléfono' : 'Change the phone number')}>
                      {t.changePhone}
                    </button>
                    <button style={styles.chip} onClick={() => setInputValue(language === 'es' ? 'Actualizar el título' : 'Update the headline')}>
                      {t.updateHeadline}
                    </button>
                    <button style={styles.chip} onClick={() => setInputValue(language === 'es' ? 'Cambiar los colores' : 'Change the colors')}>
                      {t.changeColors}
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
                  <span className="loading-dots">
                    <span>.</span><span>.</span><span>.</span>
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} style={styles.inputForm}>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t.describeEdit}
                style={styles.inputMobile}
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
          </>
        )}

        {/* Voice Edit Mode */}
        {editMode === 'voice' && (
          <div style={styles.voiceContainerMobile}>
            {callStatus === 'idle' && (
              <>
                <div style={styles.voiceIconMobile}>
                  <MicLargeIcon />
                </div>
                <p style={styles.voiceTextMobile}>{t.tapToStart}</p>
                <button onClick={startVoiceAgent} style={styles.startVoiceButtonMobile}>
                  <MicIcon />
                  {t.startVoiceSession}
                </button>
              </>
            )}
            {callStatus === 'connecting' && (
              <>
                <div style={styles.voiceIconConnecting}>
                  <LoadingSpinner />
                </div>
                <p style={styles.voiceTextMobile}>{t.connecting}</p>
              </>
            )}
            {callStatus === 'active' && (
              <>
                <div style={styles.voiceIconActiveMobile}>
                  <span style={styles.pulseRing}></span>
                  <MicLargeIcon />
                </div>
                <p style={styles.voiceTextMobile}>{t.listeningDescribe}</p>
                <button onClick={endCall} style={styles.endCallButtonMobile}>
                  {t.endSession}
                </button>
              </>
            )}
          </div>
        )}

        <style>{`
          @keyframes blink {
            0%, 20% { opacity: 0; }
            50% { opacity: 1; }
            100% { opacity: 0; }
          }
          .loading-dots span:nth-child(1) { animation: blink 1.4s infinite 0s; }
          .loading-dots span:nth-child(2) { animation: blink 1.4s infinite 0.2s; }
          .loading-dots span:nth-child(3) { animation: blink 1.4s infinite 0.4s; }
          @keyframes pulse-ring {
            0% { transform: scale(0.8); opacity: 1; }
            100% { transform: scale(1.8); opacity: 0; }
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </>
  )

  return (
    <div className="outer-wrapper" style={styles.outerWrapper}>
      <style>{`
        html, body {
          margin: 0;
          padding: 0;
        }
        @media (max-width: 768px) {
          .outer-wrapper {
            padding: 12px !important;
          }
        }
      `}</style>

      {/* Simple Header */}
      <div style={styles.header}>
        <a href="/dashboard" style={styles.backLink}>
          <BackIcon />
          {t.dashboard}
        </a>
        <div style={styles.headerCenter}>
          <span style={styles.editBadge}>
            <EditIcon />
            {t.editing}
          </span>
          <span style={styles.siteNameHeader}>{site.business_name || 'Untitled Site'}</span>
        </div>
        {/* Language Toggle */}
        {isMobile ? (
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={styles.langDropdown}
          >
            <option value="en">🇺🇸 EN</option>
            <option value="es">🇪🇸 ES</option>
          </select>
        ) : (
          <div style={styles.langToggleContainer}>
            <button onClick={() => setLanguage('en')} style={{...styles.langToggleBtn, ...(language === 'en' ? styles.langToggleBtnActive : {})}}>
              🇺🇸 EN
            </button>
            <button onClick={() => setLanguage('es')} style={{...styles.langToggleBtn, ...(language === 'es' ? styles.langToggleBtnActive : {})}}>
              🇪🇸 ES
            </button>
            <div style={{...styles.langToggleSlider, transform: language === 'es' ? 'translateX(100%)' : 'translateX(0)'}} />
          </div>
        )}
        <a
          href={`https://${site.subdomain}.speakyour.site`}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.viewLiveButton}
        >
          {t.viewLive}
          <ExternalLinkIcon />
        </a>
      </div>

      {/* Preview Container with Edit Panel */}
      <div style={styles.previewContainerWrapper}>
        {/* Desktop Panel */}
        {!isMobile && renderDesktopPanel()}

        {/* Preview Area */}
        <div style={{
          ...styles.previewContainer,
          marginLeft: !isMobile && isEditPanelOpen ? '350px' : '0',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <iframe
            srcDoc={currentHtml}
            style={styles.iframe}
            title="Website Preview"
          />

          {/* FAB to reopen panel when closed */}
          {!isEditPanelOpen && (
            <button
              onClick={() => setIsEditPanelOpen(true)}
              style={styles.fab}
              title={t.edit}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span style={styles.fabLabel}>{t.edit}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Sheet */}
      {isMobile && renderMobileSheet()}
    </div>
  )
}

// Icons
function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '6px' }}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
      <polyline points="15 3 21 3 21 9"></polyline>
      <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  )
}

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="23"></line>
      <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
  )
}

function MicLargeIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="23"></line>
      <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
  )
}

function LoadingSpinner() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
    </svg>
  )
}

const styles = {
  outerWrapper: {
    height: '100vh',
    background: '#f5f5f7',
    padding: '16px 32px 32px 32px',
    boxSizing: 'border-box',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
    gap: '16px',
    flexWrap: 'wrap',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    color: '#666',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    padding: '8px 12px',
    borderRadius: '6px',
    background: 'white',
    border: '1px solid #e5e5e5',
  },
  headerCenter: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
    justifyContent: 'center',
  },
  editBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 12px',
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
  },
  siteNameHeader: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
  },
  viewLiveButton: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '10px 16px',
    background: 'white',
    color: '#374151',
    textDecoration: 'none',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
  },
  previewContainerWrapper: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    overflow: 'hidden',
  },
  // Desktop Panel
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '350px',
    background: 'white',
    boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    borderRadius: '12px 0 0 12px',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
  },
  panelHeaderLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  panelTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: 0,
    color: '#1f2937',
  },
  siteBadge: {
    display: 'inline-block',
    fontSize: '12px',
    fontWeight: '500',
    color: '#6b7280',
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
  modeToggle: {
    display: 'flex',
    gap: '8px',
    padding: '12px 16px',
    borderBottom: '1px solid #e5e7eb',
  },
  modeButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 16px',
    background: '#f3f4f6',
    color: '#6b7280',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  modeButtonActive: {
    background: '#2563eb',
    color: 'white',
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
    padding: '12px 16px',
    margin: 0,
    fontSize: '13px',
    textAlign: 'left',
    background: '#f9fafb',
    borderRadius: '8px',
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
  inputMobile: {
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
  voiceContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  voiceContent: {
    textAlign: 'center',
    maxWidth: '280px',
  },
  voiceIcon: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    background: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px auto',
    color: '#6b7280',
  },
  voiceIconConnecting: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    background: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px auto',
    color: '#9ca3af',
  },
  voiceIconActive: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    background: '#ecfdf5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px auto',
    color: '#10b981',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    border: '3px solid #10b981',
    animation: 'pulse-ring 1.5s ease-out infinite',
  },
  voiceTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '8px',
  },
  voiceText: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.5',
    marginBottom: '24px',
  },
  startVoiceButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '14px 28px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
  },
  endCallButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '14px 28px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
  },
  panelFooter: {
    padding: '16px',
    borderTop: '1px solid #e5e7eb',
  },
  viewLiveLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    background: '#f9fafb',
    color: '#374151',
    textDecoration: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
  },
  previewContainer: {
    flex: 1,
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 25px 80px rgba(0, 0, 0, 0.2), 0 15px 40px rgba(0, 0, 0, 0.15), 0 5px 15px rgba(0, 0, 0, 0.1)',
    border: '3px solid #d1d5db', // Grey border to indicate edit mode
    position: 'relative',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    display: 'block',
    background: 'white',
  },
  fab: {
    position: 'absolute',
    bottom: '24px',
    left: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 20px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)',
    zIndex: 50,
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  fabLabel: {
    marginRight: '4px',
  },
  // Mobile Sheet
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
  sheetHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 16px 12px 16px',
    borderBottom: '1px solid #e5e7eb',
  },
  sheetTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
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
  modeToggleMobile: {
    display: 'flex',
    gap: '8px',
    padding: '12px 16px',
    borderBottom: '1px solid #e5e7eb',
  },
  modeButtonMobile: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 16px',
    background: '#f3f4f6',
    color: '#6b7280',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  modeButtonMobileActive: {
    background: '#2563eb',
    color: 'white',
  },
  sheetMessages: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    minHeight: '120px',
    maxHeight: '300px',
  },
  voiceContainerMobile: {
    padding: '24px 16px',
    textAlign: 'center',
  },
  voiceIconMobile: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px auto',
    color: '#6b7280',
  },
  voiceIconActiveMobile: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: '#ecfdf5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px auto',
    color: '#10b981',
    position: 'relative',
  },
  voiceTextMobile: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '16px',
  },
  startVoiceButtonMobile: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
  },
  endCallButtonMobile: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '14px 24px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
  },
  // Language toggle styles
  langToggleContainer: {
    display: 'flex',
    position: 'relative',
    background: '#f3f4f6',
    borderRadius: '8px',
    padding: '3px',
  },
  langToggleBtn: {
    position: 'relative',
    zIndex: 1,
    background: 'transparent',
    border: 'none',
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    color: '#666',
    transition: 'color 0.2s',
    borderRadius: '6px',
  },
  langToggleBtnActive: {
    color: '#1a1a2e',
  },
  langToggleSlider: {
    position: 'absolute',
    top: '3px',
    left: '3px',
    width: 'calc(50% - 3px)',
    height: 'calc(100% - 6px)',
    background: 'white',
    borderRadius: '6px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s ease',
  },
  langDropdown: {
    background: 'white',
    color: '#555',
    border: '1px solid #ddd',
    padding: '8px 12px',
    borderRadius: '6px',
    fontWeight: '500',
    fontSize: '14px',
    cursor: 'pointer',
  },
}
