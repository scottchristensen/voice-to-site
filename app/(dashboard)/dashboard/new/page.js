'use client'

import { useState, useEffect, useRef } from 'react'

export default function CreateNewSitePage() {
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

      await vapiRef.current.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID)

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
        <h1 style={styles.title}>Create New Site</h1>
        <p style={styles.subtitle}>Talk to our AI assistant to build your website in minutes</p>
      </div>

      <div style={styles.card}>
        {callStatus === 'idle' && (
          <div style={styles.startSection}>
            <div style={styles.iconCircle}>
              <MicrophoneIcon />
            </div>
            <h2 style={styles.cardTitle}>Ready to Build?</h2>
            <p style={styles.cardText}>
              Click the button below to start a voice conversation with our AI assistant.
              Just describe your business and we'll create a professional website for you.
            </p>
            <button onClick={startVoiceAgent} style={styles.startButton}>
              <MicrophoneIcon />
              Start Voice Conversation
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
            <h2 style={styles.cardTitle}>Speaking with AI Assistant</h2>
            <p style={styles.cardText}>Describe your business, services, and what you want on your website</p>
            <button onClick={endCall} style={styles.endButton}>
              End Conversation
            </button>
          </div>
        )}

        {callStatus === 'complete' && previewUrl && (
          <div style={styles.successSection}>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.cardTitle}>Your Site is Ready!</h2>
            <p style={styles.cardText}>Preview your new website and claim it when you're ready</p>
            <div style={styles.buttonGroup}>
              <a href={previewUrl} target="_blank" rel="noopener noreferrer" style={styles.primaryButton}>
                Preview Your Site
              </a>
              <button onClick={() => { setCallStatus('idle'); setPreviewUrl(null); }} style={styles.secondaryButton}>
                Create Another
              </button>
            </div>
          </div>
        )}

        {callStatus === 'ended' && !previewUrl && (
          <div style={styles.statusSection}>
            <h2 style={styles.cardTitle}>Conversation Ended</h2>
            <p style={styles.cardText}>Want to try again?</p>
            <button onClick={() => setCallStatus('idle')} style={styles.startButton}>
              Start Over
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

const styles = {
  container: {
    padding: '32px',
    maxWidth: '700px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '32px',
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
    padding: '14px 28px',
    background: 'white',
    color: '#667eea',
    border: '2px solid #667eea',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
}
