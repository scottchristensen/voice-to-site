'use client'

import { useState, useEffect } from 'react'
import ClaimModal from './ClaimModal'
import EditPanel from './EditPanel'
import EditSheet from './EditSheet'
import { useDarkMode } from '../hooks/useDarkMode'

// UI Translations
const translations = {
  en: {
    sitePreview: 'Your site preview',
    leftToClaim: 'left to claim',
    expiringSoon: 'Expiring soon!',
    claimMySite: 'Claim My Site',
    siteIsLive: 'Your site is live!',
    visit: 'Visit',
    edit: 'Edit',
    previewExpired: 'Preview Expired',
    expiredText: (name) => `This website preview for <strong>${name || 'your business'}</strong> has expired. But don't worry - you can create a new one in minutes!`,
    createNewSite: 'Create a New Site',
    claimBeforeGone: 'Or claim this exact design before it\'s gone forever',
    translatingStatuses: [
      'Analyzing your content...',
      'Translating text elements...',
      'Adapting layout for Spanish...',
      'Updating navigation...',
      'Polishing final details...',
      'Almost there...',
    ],
  },
  es: {
    sitePreview: 'Tu sitio',
    leftToClaim: 'para reclamar',
    expiringSoon: '¡Expira pronto!',
    claimMySite: 'Reclamar Mi Sitio',
    siteIsLive: '¡Tu sitio está en vivo!',
    visit: 'Visitar',
    edit: 'Editar',
    previewExpired: 'Vista Previa Expirada',
    expiredText: (name) => `La vista previa del sitio web para <strong>${name || 'tu negocio'}</strong> ha expirado. ¡Pero no te preocupes, puedes crear uno nuevo en minutos!`,
    createNewSite: 'Crear un Nuevo Sitio',
    claimBeforeGone: 'O reclama este diseño exacto antes de que desaparezca para siempre',
    translatingStatuses: [
      'Analizando tu contenido...',
      'Traduciendo elementos de texto...',
      'Adaptando diseño al español...',
      'Actualizando navegación...',
      'Puliendo detalles finales...',
      'Casi listo...',
    ],
  }
}

function getTimeRemaining(createdAt) {
  const created = new Date(createdAt)
  const expires = new Date(created.getTime() + 24 * 60 * 60 * 1000) // 24 hours
  const now = new Date()
  const diff = Math.max(0, expires - now)

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return { hours, minutes, seconds, total: diff }
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

export default function PreviewClient({ site, daysRemaining, isPaid, isExpired }) {
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining(site.created_at))
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false)
  const [editsRemaining, setEditsRemaining] = useState(5 - (site.preview_edits_used || 0))
  const [htmlEn, setHtmlEn] = useState(site.html_code)
  const [htmlEs, setHtmlEs] = useState(site.html_code_es || null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [translatingStatusIndex, setTranslatingStatusIndex] = useState(0)
  // Default to site's owner_language, then localStorage, then 'en'
  const [language, setLanguage] = useState(() => site.owner_language || 'en')
  const isMobile = useIsMobile()
  const isDarkMode = useDarkMode()

  // Compute current HTML based on language
  const currentHtml = language === 'es' && htmlEs ? htmlEs : htmlEn

  // Load language preference - prefer site's owner_language, then localStorage
  useEffect(() => {
    if (site.owner_language === 'es' || site.owner_language === 'en') {
      setLanguage(site.owner_language)
    } else {
      const savedLanguage = localStorage.getItem('preferredLanguage')
      if (savedLanguage === 'en' || savedLanguage === 'es') {
        setLanguage(savedLanguage)
      }
    }
  }, [site.owner_language])

  // Persist language choice to localStorage
  useEffect(() => {
    localStorage.setItem('preferredLanguage', language)
  }, [language])

  const t = translations[language] || translations.en

  useEffect(() => {
    if (isPaid || isExpired) return

    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining(site.created_at))
    }, 1000)

    return () => clearInterval(timer)
  }, [site.created_at, isPaid, isExpired])

  // Rotating status messages for translation
  useEffect(() => {
    if (!isTranslating) {
      setTranslatingStatusIndex(0)
      return
    }
    const interval = setInterval(() => {
      setTranslatingStatusIndex(prev => (prev + 1) % t.translatingStatuses.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [isTranslating, t.translatingStatuses.length])

  const handleEditComplete = (newHtml, remaining) => {
    // Update the appropriate language version
    if (language === 'es') {
      setHtmlEs(newHtml)
    } else {
      setHtmlEn(newHtml)
    }
    setEditsRemaining(remaining)
  }

  // Handle language toggle with lazy Spanish generation
  const handleLanguageChange = async (newLang) => {
    if (newLang === language) return

    if (newLang === 'es' && !htmlEs) {
      // Need to generate Spanish version
      setIsTranslating(true)
      setLanguage(newLang) // Switch immediately to show loading state

      try {
        const response = await fetch('/api/translate-site', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ siteId: site.id, targetLanguage: 'es' })
        })

        const result = await response.json()

        if (result.success) {
          setHtmlEs(result.html)
        } else {
          // Revert to English on error
          setLanguage('en')
          console.error('Translation failed:', result.error)
        }
      } catch (error) {
        // Revert to English on error
        setLanguage('en')
        console.error('Translation error:', error)
      } finally {
        setIsTranslating(false)
      }
    } else {
      setLanguage(newLang)
    }
  }

  const handleLimitReached = () => {
    setIsEditPanelOpen(false)
    setShowClaimModal(true)
  }

  // Expired site view
  if (isExpired) {
    return (
      <div style={{...styles.container, ...(isDarkMode && { background: '#0a0a0a' })}}>
        {/* Language Toggle for expired view */}
        <div style={styles.expiredLangToggle}>
          <div style={{...styles.langToggleContainer, ...(isDarkMode && styles.langToggleContainerDark)}}>
            <button onClick={() => handleLanguageChange('en')} style={{...styles.langToggleBtn, ...(isDarkMode && styles.langToggleBtnDark), ...(language === 'en' ? (isDarkMode ? styles.langToggleBtnActiveDark : styles.langToggleBtnActive) : {})}}>
              🇺🇸 EN
            </button>
            <button onClick={() => handleLanguageChange('es')} style={{...styles.langToggleBtn, ...(isDarkMode && styles.langToggleBtnDark), ...(language === 'es' ? (isDarkMode ? styles.langToggleBtnActiveDark : styles.langToggleBtnActive) : {})}}>
              🇪🇸 ES
            </button>
            <div style={{...styles.langToggleSlider, ...(isDarkMode && styles.langToggleSliderDark), transform: language === 'es' ? 'translateX(100%)' : 'translateX(0)'}} />
          </div>
        </div>

        {/* Expired Overlay */}
        <div style={styles.expiredOverlay}>
          <div style={styles.expiredCard}>
            <div style={styles.expiredIcon}>&#9200;</div>
            <h1 style={styles.expiredTitle}>{t.previewExpired}</h1>
            <p style={styles.expiredTextStyle} dangerouslySetInnerHTML={{ __html: t.expiredText(site.business_name) }} />
            <a href="/" style={styles.expiredButton}>
              {t.createNewSite}
            </a>
            <p style={styles.expiredSubtext}>
              {t.claimBeforeGone}
            </p>
            <div style={styles.expiredActions}>
              <button
                onClick={() => setShowClaimModal(true)}
                style={styles.claimButton}
              >
                {t.claimMySite}
              </button>
            </div>
          </div>
        </div>

        {/* Blurred Preview */}
        <iframe
          srcDoc={site.html_code}
          style={styles.blurredIframe}
          title="Website Preview (Expired)"
        />

        <ClaimModal
          site={site}
          isOpen={showClaimModal}
          onClose={() => setShowClaimModal(false)}
        />
      </div>
    )
  }

  // Active preview view
  return (
    <div className="outer-wrapper" style={{...styles.outerWrapper, ...(isDarkMode && styles.outerWrapperDark)}}>
      {/* Compact Header for Unpaid Sites */}
      {!isPaid && (
        <>
          <style>{`
            html, body {
              margin: 0;
              padding: 0;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            @media (max-width: 640px) {
              .outer-wrapper {
                padding: 16px !important;
              }
              .header-row {
                flex-wrap: wrap !important;
                gap: 12px !important;
                margin-bottom: 16px !important;
              }
              .header-title {
                order: 1 !important;
                width: 100% !important;
              }
              .urgency-badge {
                order: 2 !important;
              }
              .claim-cta-btn {
                order: 4 !important;
                width: 100% !important;
              }
              .lang-toggle {
                order: 3 !important;
              }
            }
          `}</style>
          <div className="header-row" style={styles.header}>
            <div className="header-title" style={styles.headerTextWrapper}>
              <span style={{...styles.headerText, ...(isDarkMode && styles.headerTextDark)}}>{t.sitePreview}</span>
            </div>
            {/* Urgency Badge - two lines */}
            <span className="urgency-badge" style={styles.urgencyBadge}>
              {timeLeft.total > 0 ? (
                <>
                  <span style={styles.timerTime}>{timeLeft.hours}h {timeLeft.minutes}m</span>
                  <span style={styles.timerLabel}>{t.leftToClaim}</span>
                </>
              ) : (
                t.expiringSoon
              )}
            </span>
            {/* Language Toggle - on right */}
            <div className="lang-toggle" style={{...styles.langToggleContainer, ...(isDarkMode && styles.langToggleContainerDark)}}>
              <button onClick={() => handleLanguageChange('en')} style={{...styles.langToggleBtn, ...(isDarkMode && styles.langToggleBtnDark), ...(language === 'en' ? (isDarkMode ? styles.langToggleBtnActiveDark : styles.langToggleBtnActive) : {})}}>
                🇺🇸 EN
              </button>
              <button onClick={() => handleLanguageChange('es')} style={{...styles.langToggleBtn, ...(isDarkMode && styles.langToggleBtnDark), ...(language === 'es' ? (isDarkMode ? styles.langToggleBtnActiveDark : styles.langToggleBtnActive) : {})}}>
                🇪🇸 ES
              </button>
              <div style={{...styles.langToggleSlider, ...(isDarkMode && styles.langToggleSliderDark), transform: language === 'es' ? 'translateX(100%)' : 'translateX(0)'}} />
            </div>
            <button
              className="claim-cta-btn"
              onClick={() => setShowClaimModal(true)}
              style={styles.claimCta}
            >
              {t.claimMySite}
            </button>
          </div>
        </>
      )}

      {/* Success Header for Paid Sites */}
      {isPaid && (
        <div style={styles.successHeader}>
          <span>&#10003; {t.siteIsLive}</span>
          {/* Language Toggle for paid sites */}
          <div style={{...styles.langToggleContainer, ...(isDarkMode && styles.langToggleContainerDark)}}>
            <button onClick={() => handleLanguageChange('en')} style={{...styles.langToggleBtn, ...(isDarkMode && styles.langToggleBtnDark), ...(language === 'en' ? (isDarkMode ? styles.langToggleBtnActiveDark : styles.langToggleBtnActive) : {})}}>
              🇺🇸 EN
            </button>
            <button onClick={() => handleLanguageChange('es')} style={{...styles.langToggleBtn, ...(isDarkMode && styles.langToggleBtnDark), ...(language === 'es' ? (isDarkMode ? styles.langToggleBtnActiveDark : styles.langToggleBtnActive) : {})}}>
              🇪🇸 ES
            </button>
            <div style={{...styles.langToggleSlider, ...(isDarkMode && styles.langToggleSliderDark), transform: language === 'es' ? 'translateX(100%)' : 'translateX(0)'}} />
          </div>
          {site.subdomain && (
            <a
              href={`https://${site.subdomain}.speakyour.site`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.liveLink}
            >
              {t.visit} {site.subdomain}.speakyour.site &#8594;
            </a>
          )}
        </div>
      )}

      {/* Preview Container with rounded corners */}
      <div style={styles.previewContainerWrapper}>
        {/* Desktop Edit Panel */}
        {!isMobile && !isPaid && (
          <EditPanel
            isOpen={isEditPanelOpen}
            onClose={() => setIsEditPanelOpen(false)}
            siteId={site.id}
            editsRemaining={editsRemaining}
            onEditComplete={handleEditComplete}
            onLimitReached={handleLimitReached}
            language={language}
            isDarkMode={isDarkMode}
          />
        )}

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

          {/* Translation Loading Overlay */}
          {isTranslating && (
            <div style={{...styles.translatingOverlay, ...(isDarkMode && styles.translatingOverlayDark)}}>
              <div style={styles.translatingCard}>
                <div style={{...styles.translatingSpinner, ...(isDarkMode && styles.translatingSpinnerDark)}} />
                <p style={{...styles.translatingText, ...(isDarkMode && styles.translatingTextDark)}}>
                  {t.translatingStatuses[translatingStatusIndex]}
                </p>
              </div>
            </div>
          )}

          {/* FAB - Floating Action Button for Edit */}
          {!isPaid && !isEditPanelOpen && (
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

      {/* Mobile Edit Sheet */}
      {isMobile && !isPaid && (
        <EditSheet
          isOpen={isEditPanelOpen}
          onClose={() => setIsEditPanelOpen(false)}
          siteId={site.id}
          editsRemaining={editsRemaining}
          onEditComplete={handleEditComplete}
          onLimitReached={handleLimitReached}
          language={language}
          isDarkMode={isDarkMode}
        />
      )}

      <ClaimModal
        site={site}
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
      />
    </div>
  )
}

const styles = {
  // Outer wrapper with padding
  outerWrapper: {
    height: '100vh',
    overflow: 'hidden',
    background: '#f5f5f7',
    padding: '16px 32px 32px 32px',
    boxSizing: 'border-box',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    display: 'flex',
    flexDirection: 'column',
  },
  // Compact header bar
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '0',
    marginBottom: '16px',
    gap: '16px',
  },
  headerTextWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },
  headerText: {
    color: '#1f2937',
    fontSize: '24px',
    fontWeight: '700',
  },
  urgencyBadge: {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    background: '#fee2e2',
    color: '#dc2626',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
  },
  timerTime: {
    fontSize: '15px',
    fontWeight: '700',
    fontVariantNumeric: 'tabular-nums',
    lineHeight: '1',
  },
  timerLabel: {
    fontSize: '11px',
    fontWeight: '500',
    opacity: '0.8',
    lineHeight: '1',
  },
  claimCta: {
    background: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '14px 28px',
    borderRadius: '8px',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '16px',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  // Success header for paid sites
  successHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    marginBottom: '12px',
    color: '#22c55e',
    fontSize: '15px',
    fontWeight: '600',
    flexWrap: 'wrap',
    gap: '12px',
  },
  liveLink: {
    color: '#22c55e',
    textDecoration: 'underline',
  },
  // Preview container wrapper (for edit panel layout)
  previewContainerWrapper: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    overflow: 'hidden',
  },
  // Preview container with drop shadow
  previewContainer: {
    flex: 1,
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 25px 80px rgba(0, 0, 0, 0.2), 0 15px 40px rgba(0, 0, 0, 0.15), 0 5px 15px rgba(0, 0, 0, 0.1)',
    position: 'relative',
  },
  // Floating Action Button for Edit
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
  // Preview iframe
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    outline: 'none',
    display: 'block',
    background: 'white',
  },
  // Expired State (still uses container)
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  expiredOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    fontFamily: 'system-ui',
  },
  expiredCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '48px',
    maxWidth: '500px',
    textAlign: 'center',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
    margin: '20px',
  },
  expiredIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  expiredTitle: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '16px',
    color: '#1a1a2e',
  },
  expiredText: {
    color: '#555',
    lineHeight: '1.6',
    marginBottom: '24px',
  },
  expiredButton: {
    display: 'inline-block',
    padding: '14px 32px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '16px',
  },
  expiredSubtext: {
    marginTop: '24px',
    marginBottom: '12px',
    color: '#888',
    fontSize: '14px',
  },
  expiredActions: {
    display: 'flex',
    justifyContent: 'center',
  },
  claimButton: {
    padding: '14px 28px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '16px',
  },
  blurredIframe: {
    flex: 1,
    border: 'none',
    width: '100%',
    filter: 'blur(8px)',
    pointerEvents: 'none',
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
  langDropdownMobile: {
    background: 'transparent',
    color: '#555',
    border: 'none',
    padding: '6px 2px 6px 8px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0 center',
    paddingRight: '14px',
  },
  expiredLangToggle: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    zIndex: 20,
  },
  expiredTextStyle: {
    color: '#555',
    lineHeight: '1.6',
    marginBottom: '24px',
  },
  // Translation loading overlay
  translatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(255, 255, 255, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
  },
  translatingCard: {
    textAlign: 'center',
    padding: '32px',
  },
  translatingSpinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #e5e7eb',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    margin: '0 auto 16px',
    animation: 'spin 1s linear infinite',
  },
  translatingText: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#374151',
  },
  // Dark mode variants
  outerWrapperDark: {
    background: '#0a0a0a',
  },
  headerTextDark: {
    color: '#e5e5e5',
  },
  langToggleContainerDark: {
    background: '#1f1f1f',
  },
  langToggleBtnDark: {
    color: '#9ca3af',
  },
  langToggleBtnActiveDark: {
    color: '#e5e5e5',
  },
  langToggleSliderDark: {
    background: '#374151',
  },
  translatingOverlayDark: {
    background: 'rgba(0, 0, 0, 0.9)',
  },
  translatingTextDark: {
    color: '#e5e5e5',
  },
  translatingSpinnerDark: {
    border: '4px solid #374151',
    borderTopColor: '#3b82f6',
  },
}
