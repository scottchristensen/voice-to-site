'use client'

import { useState, useRef } from 'react'

export default function EditSiteClient({ site }) {
  const [isCallActive, setIsCallActive] = useState(false)
  const [callStatus, setCallStatus] = useState('idle')
  const [previewUrl, setPreviewUrl] = useState(null)
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
          setCallStatus('ended')
        })

        vapiRef.current.on('error', (error) => {
          console.error('Vapi error:', error)
          setCallStatus('error')
          setIsCallActive(false)
        })

        vapiRef.current.on('message', (message) => {
          if (message.type === 'tool-call-result' || message.type === 'transcript') {
            const text = message.result || message.output || ''
            const urlMatch = text.match(/https?:\/\/[^\s"',]+\/preview\/[^\s"',]+/)
            if (urlMatch) {
              setPreviewUrl(urlMatch[0])
              setCallStatus('complete')
            }
          }
        })
      }

      // Start the assistant with context about editing this specific site
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
      setCallStatus('error')
    }
  }

  const endCall = () => {
    if (vapiRef.current) {
      vapiRef.current.stop()
    }
    setIsCallActive(false)
    setCallStatus('ended')
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <a href="/dashboard" style={styles.backLink}>← Back to Dashboard</a>
        <h1 style={styles.title}>Edit Site</h1>
        <p style={styles.subtitle}>Make changes to your website with voice</p>
      </div>

      {/* Current Site Info */}
      <div style={styles.siteInfo}>
        <div style={styles.sitePreview}>
          <div style={styles.previewPlaceholder}>
            {site.business_name?.[0]?.toUpperCase() || 'S'}
          </div>
        </div>
        <div style={styles.siteDetails}>
          <h2 style={styles.siteName}>{site.business_name || 'Untitled Site'}</h2>
          <a
            href={`https://${site.subdomain}.speakyour.site`}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.siteUrl}
          >
            {site.subdomain}.speakyour.site
          </a>
        </div>
      </div>

      <div style={styles.card}>
        {callStatus === 'idle' && (
          <div style={styles.startSection}>
            <div style={styles.iconCircle}>
              <EditIcon />
            </div>
            <h2 style={styles.cardTitle}>What would you like to change?</h2>
            <p style={styles.cardText}>
              Start a voice conversation to update your website. You can change colors,
              text, images, add new sections, or redesign the layout.
            </p>
            <button onClick={startVoiceAgent} style={styles.startButton}>
              <MicrophoneIcon />
              Start Editing with Voice
            </button>
          </div>
        )}

        {callStatus === 'connecting' && (
          <div style={styles.statusSection}>
            <div style={styles.spinner}></div>
            <h2 style={styles.cardTitle}>Connecting...</h2>
            <p style={styles.cardText}>Please allow microphone access when prompted</p>
          </div>
        )}

        {callStatus === 'active' && (
          <div style={styles.statusSection}>
            <div style={styles.pulsingCircle}>
              <MicrophoneIcon />
            </div>
            <h2 style={styles.cardTitle}>Tell me what to change</h2>
            <p style={styles.cardText}>
              Describe the changes you want to make to your website
            </p>
            <button onClick={endCall} style={styles.endButton}>
              End Conversation
            </button>
          </div>
        )}

        {callStatus === 'complete' && previewUrl && (
          <div style={styles.successSection}>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.cardTitle}>Changes Applied!</h2>
            <p style={styles.cardText}>Preview your updated website</p>
            <div style={styles.buttonGroup}>
              <a href={previewUrl} target="_blank" rel="noopener noreferrer" style={styles.primaryButton}>
                Preview Changes
              </a>
              <a href={`https://${site.subdomain}.speakyour.site`} target="_blank" rel="noopener noreferrer" style={styles.secondaryButton}>
                View Live Site
              </a>
              <button onClick={() => { setCallStatus('idle'); setPreviewUrl(null); }} style={styles.tertiaryButton}>
                Make More Changes
              </button>
            </div>
          </div>
        )}

        {callStatus === 'ended' && !previewUrl && (
          <div style={styles.statusSection}>
            <h2 style={styles.cardTitle}>Conversation Ended</h2>
            <p style={styles.cardText}>Want to make more changes?</p>
            <button onClick={() => setCallStatus('idle')} style={styles.startButton}>
              Continue Editing
            </button>
          </div>
        )}

        {callStatus === 'error' && (
          <div style={styles.errorSection}>
            <h2 style={styles.cardTitle}>Something went wrong</h2>
            <p style={styles.cardText}>Please check your microphone permissions and try again</p>
            <button onClick={() => setCallStatus('idle')} style={styles.startButton}>
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={styles.quickActions}>
        <h3 style={styles.quickActionsTitle}>Quick Actions</h3>
        <div style={styles.actionButtons}>
          <a
            href={`https://${site.subdomain}.speakyour.site`}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.actionButton}
          >
            <ExternalLinkIcon />
            View Live Site
          </a>
          <a href="/billing" style={styles.actionButton}>
            <CreditCardIcon />
            Manage Billing
          </a>
        </div>
      </div>
    </div>
  )
}

function MicrophoneIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="23"></line>
      <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
      <polyline points="15 3 21 3 21 9"></polyline>
      <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
  )
}

function CreditCardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
      <line x1="1" y1="10" x2="23" y2="10"></line>
    </svg>
  )
}

const styles = {
  container: {
    padding: '32px',
    maxWidth: '700px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '24px',
  },
  backLink: {
    color: '#667eea',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    display: 'inline-block',
    marginBottom: '16px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
  },
  siteInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    background: 'white',
    borderRadius: '12px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e5e7eb',
  },
  sitePreview: {
    width: '60px',
    height: '60px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  previewPlaceholder: {
    fontSize: '24px',
    fontWeight: '700',
    color: 'white',
  },
  siteDetails: {
    flex: 1,
  },
  siteName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '4px',
  },
  siteUrl: {
    fontSize: '14px',
    color: '#667eea',
    textDecoration: 'none',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '48px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    textAlign: 'center',
  },
  startSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statusSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  successSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  errorSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  iconCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    marginBottom: '24px',
  },
  pulsingCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    marginBottom: '24px',
    animation: 'pulse 2s infinite',
  },
  successIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '36px',
    fontWeight: 'bold',
    marginBottom: '24px',
  },
  spinner: {
    width: '60px',
    height: '60px',
    border: '4px solid #e5e5e5',
    borderTopColor: '#667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '24px',
  },
  cardTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '12px',
  },
  cardText: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '24px',
    maxWidth: '400px',
    lineHeight: '1.6',
  },
  startButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    padding: '16px 32px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
  },
  endButton: {
    padding: '14px 28px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '14px 28px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
  },
  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '14px 28px',
    background: 'white',
    color: '#667eea',
    textDecoration: 'none',
    border: '2px solid #667eea',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
  },
  tertiaryButton: {
    padding: '14px 28px',
    background: '#f5f5f5',
    color: '#666',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  quickActions: {
    marginTop: '32px',
  },
  quickActionsTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#888',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  actionButtons: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  actionButton: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '12px 20px',
    background: 'white',
    color: '#333',
    textDecoration: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    border: '1px solid #e5e5e5',
  },
}
