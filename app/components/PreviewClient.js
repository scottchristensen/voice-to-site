'use client'

import { useState, useEffect } from 'react'
import ClaimModal from './ClaimModal'
import EditPanel from './EditPanel'
import EditSheet from './EditSheet'

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
  },
  es: {
    sitePreview: 'Vista previa de tu sitio',
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
  const [currentHtml, setCurrentHtml] = useState(site.html_code)
  const [language, setLanguage] = useState('en')
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

  useEffect(() => {
    if (isPaid || isExpired) return

    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining(site.created_at))
    }, 1000)

    return () => clearInterval(timer)
  }, [site.created_at, isPaid, isExpired])

  const handleEditComplete = (newHtml, remaining) => {
    setCurrentHtml(newHtml)
    setEditsRemaining(remaining)
  }

  const handleLimitReached = () => {
    setIsEditPanelOpen(false)
    setShowClaimModal(true)
  }

  // Expired site view
  if (isExpired) {
    return (
      <div style={styles.container}>
        {/* Language Toggle for expired view */}
        <div style={styles.expiredLangToggle}>
          {isMobile ? (
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={styles.langDropdown}
            >
              <option value="en">🇺🇸 English</option>
              <option value="es">🇪🇸 Español</option>
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
    <div className="outer-wrapper" style={styles.outerWrapper}>
      {/* Compact Header for Unpaid Sites */}
      {!isPaid && (
        <>
          <style>{`
            html, body {
              margin: 0;
              padding: 0;
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
                order: 3 !important;
                width: 100% !important;
              }
            }
          `}</style>
          <div className="header-row" style={styles.header}>
            <div className="header-title" style={styles.headerTextWrapper}>
              <span style={styles.headerText}>{t.sitePreview}</span>
            </div>
            {/* Language Toggle */}
            {isMobile ? (
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={styles.langDropdown}
              >
                <option value="en">🇺🇸 English</option>
                <option value="es">🇪🇸 Español</option>
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
            <span className="urgency-badge" style={styles.urgencyBadge}>
              {timeLeft.total > 0 ? (
                <span style={styles.timerTime}>{timeLeft.hours}h {timeLeft.minutes}m {t.leftToClaim}</span>
              ) : (
                t.expiringSoon
              )}
            </span>
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
          {isMobile ? (
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={styles.langDropdown}
            >
              <option value="en">🇺🇸 English</option>
              <option value="es">🇪🇸 Español</option>
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
    display: 'block',
    background: '#f5f5f7',
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
}
