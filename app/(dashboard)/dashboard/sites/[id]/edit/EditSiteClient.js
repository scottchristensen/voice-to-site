'use client'

import { useState, useRef } from 'react'

export default function EditSiteClient({ site }) {
  const [isCallActive, setIsCallActive] = useState(false)
  const [callStatus, setCallStatus] = useState('idle')
  const [currentHtml, setCurrentHtml] = useState(site.html_code)
  const vapiRef = useRef(null)

  const startVoiceAgent = async () => {
    setCallStatus('connecting')

    try {
      const { default: Vapi } = await import('@vapi-ai/web')

      if (!vapiRef.current) {
        vapiRef.current = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY)

        vapiRef.current.on('call-start', () => {
          setIsCallActive(true)
          setCallStatus('active')
        })

        vapiRef.current.on('call-end', () => {
          setIsCallActive(false)
          setCallStatus('idle')
        })

        vapiRef.current.on('error', (error) => {
          console.error('Vapi error:', error)
          setCallStatus('idle')
          setIsCallActive(false)
        })

        vapiRef.current.on('message', (message) => {
          // Listen for updated HTML from the voice agent
          if (message.type === 'tool-call-result' || message.type === 'transcript') {
            const text = message.result || message.output || ''
            // Check if there's a new preview URL (meaning site was updated)
            const urlMatch = text.match(/https?:\/\/[^\s"',]+\/preview\/[^\s"',]+/)
            if (urlMatch) {
              // Refresh the iframe with new content
              window.location.reload()
            }
          }
        })
      }

      // Start the assistant with edit mode context
      await vapiRef.current.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID, {
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
    setIsCallActive(false)
    setCallStatus('idle')
  }

  return (
    <div className="outer-wrapper" style={styles.outerWrapper}>
      <style>{`
        html, body {
          margin: 0;
          padding: 0;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .outer-wrapper {
            padding: 12px !important;
          }
          .edit-header {
            flex-direction: column !important;
            gap: 12px !important;
          }
          .header-right {
            width: 100% !important;
            justify-content: center !important;
          }
        }
      `}</style>

      {/* Edit Header */}
      <div className="edit-header" style={styles.header}>
        <a href="/dashboard" style={styles.backLink}>
          <BackIcon />
          Dashboard
        </a>
        <div style={styles.headerCenter}>
          <span style={styles.editBadge}>
            <EditIcon />
            Editing Mode
          </span>
          <span style={styles.siteName}>{site.business_name || 'Untitled Site'}</span>
        </div>
        <div className="header-right" style={styles.headerRight}>
          {callStatus === 'idle' && (
            <button onClick={startVoiceAgent} style={styles.voiceButton}>
              <MicrophoneIcon />
              Edit with Voice
            </button>
          )}
          {callStatus === 'connecting' && (
            <button disabled style={styles.voiceButtonConnecting}>
              <LoadingSpinner />
              Connecting...
            </button>
          )}
          {callStatus === 'active' && (
            <button onClick={endCall} style={styles.voiceButtonActive}>
              <span style={styles.pulse}></span>
              End Call
            </button>
          )}
          <a
            href={`https://${site.subdomain}.speakyour.site`}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.viewLiveButton}
          >
            View Live
            <ExternalLinkIcon />
          </a>
        </div>
      </div>

      {/* Voice Call Indicator */}
      {isCallActive && (
        <div style={styles.callIndicator}>
          <span style={styles.pulseIndicator}></span>
          <span>Speaking with AI assistant - describe the changes you want to make</span>
        </div>
      )}

      {/* Preview Container with grey border (edit mode indicator) */}
      <div style={styles.previewContainer}>
        <iframe
          srcDoc={currentHtml}
          style={styles.iframe}
          title="Website Preview"
        />
      </div>
    </div>
  )
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
  )
}

function MicrophoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="23"></line>
      <line x1="8" y1="23" x2="16" y2="23"></line>
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

function LoadingSpinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }}>
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
  siteName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  voiceButton: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
  },
  voiceButtonConnecting: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '10px 20px',
    background: '#9ca3af',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'not-allowed',
  },
  voiceButtonActive: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '10px 20px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
  },
  pulse: {
    width: '8px',
    height: '8px',
    background: 'white',
    borderRadius: '50%',
    marginRight: '8px',
    animation: 'pulse 1.5s ease-in-out infinite',
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
  callIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '12px 20px',
    background: '#ecfdf5',
    color: '#065f46',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
    fontWeight: '500',
  },
  pulseIndicator: {
    width: '10px',
    height: '10px',
    background: '#10b981',
    borderRadius: '50%',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  previewContainer: {
    flex: 1,
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 25px 80px rgba(0, 0, 0, 0.2), 0 15px 40px rgba(0, 0, 0, 0.15), 0 5px 15px rgba(0, 0, 0, 0.1)',
    border: '3px solid #fbbf24', // Yellow border to indicate edit mode
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    display: 'block',
    background: 'white',
  },
}
