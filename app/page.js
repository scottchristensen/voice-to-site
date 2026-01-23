'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [isCallActive, setIsCallActive] = useState(false)
  const [callStatus, setCallStatus] = useState('idle') // idle, connecting, connected, ended
  const [vapi, setVapi] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Detect OS dark mode preference
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDarkMode(darkModeMediaQuery.matches)

    // Listen for changes to OS dark mode setting
    const handleChange = (e) => setIsDarkMode(e.matches)
    darkModeMediaQuery.addEventListener('change', handleChange)

    return () => darkModeMediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    // Dynamically import Vapi SDK
    const loadVapi = async () => {
      try {
        const { default: Vapi } = await import('@vapi-ai/web')
        const vapiInstance = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY)

        // Set up event listeners
        vapiInstance.on('call-start', () => {
          setCallStatus('connected')
          setIsCallActive(true)
          setPreviewUrl(null) // Reset any previous URL
        })

        vapiInstance.on('call-end', () => {
          setCallStatus('ended')
          setIsCallActive(false)
          // Reset button after a moment (but keep modal open if URL exists)
          setTimeout(() => setCallStatus('idle'), 3000)
        })

        vapiInstance.on('error', (error) => {
          console.error('Vapi error:', error)
          setCallStatus('idle')
          setIsCallActive(false)
        })

        // Listen for messages to capture the preview URL
        vapiInstance.on('message', (message) => {
          console.log('Vapi message:', message)

          // Check for tool call results that contain our preview URL
          if (message.type === 'tool-call-result' || message.type === 'function-call-result') {
            const result = message.result || message.output || ''
            // Extract URL from the result
            const urlMatch = result.match(/https?:\/\/[^\s]+\/preview\/[^\s]+/)
            if (urlMatch) {
              const url = urlMatch[0].replace(/[.,!?]$/, '') // Remove trailing punctuation
              console.log('Found preview URL:', url)
              setPreviewUrl(url)
              setShowModal(true)
            }
          }

          // Also check transcript for URL (backup method)
          if (message.type === 'transcript' && message.transcript) {
            const urlMatch = message.transcript.match(/https?:\/\/[^\s]+\/preview\/[^\s]+/)
            if (urlMatch && !previewUrl) {
              const url = urlMatch[0].replace(/[.,!?]$/, '')
              console.log('Found preview URL in transcript:', url)
              setPreviewUrl(url)
              setShowModal(true)
            }
          }
        })

        setVapi(vapiInstance)
      } catch (error) {
        console.error('Failed to load Vapi:', error)
      }
    }

    loadVapi()
  }, [])

  const startCall = async () => {
    if (!vapi) return

    setCallStatus('connecting')
    setPreviewUrl(null)
    setShowModal(false)
    try {
      await vapi.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID)
    } catch (error) {
      console.error('Failed to start call:', error)
      setCallStatus('idle')
    }
  }

  const endCall = () => {
    if (vapi) {
      vapi.stop()
    }
  }

  return (
    <div style={{...styles.container, ...(isDarkMode && styles.containerDark)}}>
      {/* Success Modal */}
      {showModal && previewUrl && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalIcon}>🎉</div>
            <h2 style={styles.modalTitle}>Your Website is Ready!</h2>
            <p style={styles.modalText}>
              Sarah created a beautiful website for you. Click below to see it!
            </p>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.modalButton}
            >
              View Your Website
            </a>
            <button
              onClick={() => setShowModal(false)}
              style={styles.modalClose}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav style={{...styles.nav, ...(isDarkMode && styles.navDark)}}>
        <div style={styles.logo}>Speak to Site</div>
        <div style={styles.navLinks}>
          <a href="#how-it-works" style={{...styles.navLink, ...(isDarkMode && styles.navLinkDark)}}>How It Works</a>
          <a href="#pricing" style={{...styles.navLink, ...(isDarkMode && styles.navLinkDark)}}>Pricing</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{...styles.hero, ...(isDarkMode && styles.heroDark)}}>
        <div style={styles.heroContent}>
          <h1 style={{...styles.heroTitle, ...(isDarkMode && styles.heroTitleDark)}}>
            Build Your Website<br />
            <span style={styles.heroAccent}>Just By Talking</span>
          </h1>
          <p style={{...styles.heroSubtitle, ...(isDarkMode && styles.heroSubtitleDark)}}>
            Describe your business to our AI voice agent and get a beautiful,
            professional marketing website in under 5 minutes. No coding, no design skills,
            no hassle.
          </p>

          {/* CTA Button */}
          <button
            onClick={isCallActive ? endCall : startCall}
            disabled={callStatus === 'connecting'}
            style={{
              ...styles.ctaButton,
              ...(isCallActive ? styles.ctaButtonActive : {}),
              ...(callStatus === 'connecting' ? styles.ctaButtonDisabled : {})
            }}
          >
            {callStatus === 'idle' && (
              <>
                <MicIcon />
                Start Building Your Site
              </>
            )}
            {callStatus === 'connecting' && (
              <>
                <LoadingSpinner />
                Connecting...
              </>
            )}
            {callStatus === 'connected' && (
              <>
                <PhoneOffIcon />
                End Call
              </>
            )}
            {callStatus === 'ended' && (
              <>
                <CheckIcon />
                Call Ended
              </>
            )}
          </button>

          {isCallActive && (
            <div style={styles.callIndicator}>
              <span style={styles.pulse}></span>
              Speaking with Sarah...
            </div>
          )}

          {/* Show link to preview if URL exists but modal is closed */}
          {previewUrl && !showModal && !isCallActive && (
            <div style={styles.previewLink}>
              <span>Your site is ready! </span>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.previewLinkAnchor}
              >
                View it here →
              </a>
            </div>
          )}

          <p style={styles.heroCta}>
            Free preview - No credit card required
          </p>

          {/* Test Modal Button - Only in development */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => {
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                setPreviewUrl(`${baseUrl}/preview/1`)
                setShowModal(true)
              }}
              style={styles.testButton}
            >
              🧪 Test Modal (Joe's Pizza)
            </button>
          )}
        </div>

        {/* Demo Preview */}
        <div style={styles.heroImage}>
          <div style={styles.interactionMockup}>
            {/* Microphone/Voice Indicator */}
            <div style={styles.microphoneContainer}>
              <div style={styles.soundWave}></div>
              <div style={styles.soundWave}></div>
              <div style={styles.soundWave}></div>
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.microphoneIcon}>
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" x2="12" y1="19" y2="22"></line>
              </svg>
            </div>

            {/* Arrow pointing to website */}
            <div style={styles.arrow}>→</div>

            {/* Generated Website Preview */}
            <div style={styles.browserMockup}>
              <div style={styles.browserBar}>
                <span style={styles.browserDot}></span>
                <span style={styles.browserDot}></span>
                <span style={styles.browserDot}></span>
              </div>
              <div style={styles.browserContent}>
                <div style={styles.mockupHero}></div>
                <div style={styles.mockupContent}>
                  <div style={styles.mockupLine}></div>
                  <div style={styles.mockupLine}></div>
                  <div style={styles.mockupLineShort}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{...styles.section, ...(isDarkMode && styles.sectionDark)}}>
        <h2 style={{...styles.sectionTitle, ...(isDarkMode && styles.sectionTitleDark)}}>How It Works</h2>
        <div style={styles.steps}>
          <div style={styles.step}>
            <div style={styles.stepNumber}>1</div>
            <h3 style={{...styles.stepTitle, ...(isDarkMode && styles.stepTitleDark)}}>Talk to Sarah</h3>
            <p style={{...styles.stepDesc, ...(isDarkMode && styles.stepDescDark)}}>
              Click the button above and have a quick conversation with our AI assistant.
              Tell them about your business, what you offer, and who you serve.
            </p>
          </div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>2</div>
            <h3 style={{...styles.stepTitle, ...(isDarkMode && styles.stepTitleDark)}}>AI Builds Your Site</h3>
            <p style={{...styles.stepDesc, ...(isDarkMode && styles.stepDescDark)}}>
              Our AI takes your conversation and generates a complete, professional
              marketing website tailored to your business in seconds.
            </p>
          </div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>3</div>
            <h3 style={{...styles.stepTitle, ...(isDarkMode && styles.stepTitleDark)}}>Preview & Claim</h3>
            <p style={{...styles.stepDesc, ...(isDarkMode && styles.stepDescDark)}}>
              See your new site instantly. Love it? Export the code, let us host it,
              or get premium design services to make it perfect.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{...styles.pricingSection, ...(isDarkMode && styles.pricingSectionDark)}}>
        <h2 style={{...styles.sectionTitle, ...(isDarkMode && styles.sectionTitleDark)}}>Simple Pricing</h2>
        <div style={styles.pricingCards}>
          <div style={{...styles.pricingCard, ...(isDarkMode && styles.pricingCardDark)}}>
            <h3 style={styles.pricingTitle}>Export Code</h3>
            <div style={styles.pricingPrice}>$49</div>
            <p style={{...styles.pricingDesc, ...(isDarkMode && styles.pricingDescDark)}}>one-time</p>
            <ul style={styles.pricingFeatures}>
              <li>Download HTML/CSS/JS</li>
              <li>Host anywhere you want</li>
              <li>Full ownership</li>
            </ul>
          </div>
          <div style={{ ...styles.pricingCard, ...styles.pricingCardFeatured, ...(isDarkMode && styles.pricingCardDark) }}>
            <div style={styles.pricingBadge}>Popular</div>
            <h3 style={styles.pricingTitle}>Hosted</h3>
            <div style={styles.pricingPrice}>$29</div>
            <p style={{...styles.pricingDesc, ...(isDarkMode && styles.pricingDescDark)}}>per month</p>
            <ul style={styles.pricingFeatures}>
              <li>We host it for you</li>
              <li>Custom domain</li>
              <li>SSL included</li>
              <li>Basic analytics</li>
            </ul>
          </div>
          <div style={{...styles.pricingCard, ...(isDarkMode && styles.pricingCardDark)}}>
            <h3 style={styles.pricingTitle}>Premium Design</h3>
            <div style={styles.pricingPrice}>$499+</div>
            <p style={{...styles.pricingDesc, ...(isDarkMode && styles.pricingDescDark)}}>one-time</p>
            <ul style={styles.pricingFeatures}>
              <li>Professional designer</li>
              <li>Custom refinements</li>
              <li>Brand alignment</li>
              <li>Priority support</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{...styles.footer, ...(isDarkMode && styles.footerDark)}}>
        <p>Built with Speak to Site</p>
      </footer>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes ripple {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        .interactionMockup .soundWave:nth-child(1) {
          animation-delay: 0s;
        }
        .interactionMockup .soundWave:nth-child(2) {
          animation-delay: 0.3s;
        }
        .interactionMockup .soundWave:nth-child(3) {
          animation-delay: 0.6s;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  )
}

// Icons
function MicIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" x2="12" y1="19" y2="22"></line>
    </svg>
  )
}

function PhoneOffIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path>
      <line x1="22" x2="2" y1="2" y2="22"></line>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  )
}

function LoadingSpinner() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
    </svg>
  )
}

// Styles
const styles = {
  container: {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    color: '#1a1a2e',
    minHeight: '100vh',
    background: '#ffffff',
  },
  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'white',
    borderRadius: '20px',
    padding: '48px',
    maxWidth: '450px',
    width: '90%',
    textAlign: 'center',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
  },
  modalIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  modalTitle: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '12px',
    color: '#1a1a2e',
  },
  modalText: {
    color: '#666',
    marginBottom: '24px',
    lineHeight: '1.6',
  },
  modalButton: {
    display: 'block',
    width: '100%',
    padding: '16px 32px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '12px',
    fontWeight: '600',
    fontSize: '18px',
    marginBottom: '12px',
  },
  modalClose: {
    background: 'none',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '8px',
  },
  // Preview link (when modal is closed)
  previewLink: {
    marginTop: '16px',
    padding: '12px 20px',
    background: '#e8f5e9',
    borderRadius: '8px',
    color: '#2e7d32',
  },
  previewLinkAnchor: {
    color: '#1b5e20',
    fontWeight: '600',
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 40px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  logo: {
    fontSize: '24px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  navLinks: {
    display: 'flex',
    gap: '32px',
  },
  navLink: {
    color: '#555',
    textDecoration: 'none',
    fontWeight: '500',
  },
  hero: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '60px 40px 100px',
    maxWidth: '1200px',
    margin: '0 auto',
    gap: '60px',
    flexWrap: 'wrap',
  },
  heroContent: {
    flex: '1',
    minWidth: '300px',
  },
  heroTitle: {
    fontSize: '56px',
    fontWeight: '800',
    lineHeight: '1.1',
    marginBottom: '24px',
  },
  heroAccent: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroSubtitle: {
    fontSize: '20px',
    color: '#555',
    lineHeight: '1.6',
    marginBottom: '32px',
    maxWidth: '500px',
  },
  ctaButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '18px 36px',
    fontSize: '18px',
    fontWeight: '600',
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
  },
  ctaButtonActive: {
    background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
    boxShadow: '0 4px 15px rgba(231, 76, 60, 0.4)',
  },
  ctaButtonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  callIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '16px',
    color: '#667eea',
    fontWeight: '500',
  },
  pulse: {
    width: '12px',
    height: '12px',
    background: '#e74c3c',
    borderRadius: '50%',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  heroCta: {
    marginTop: '16px',
    color: '#888',
    fontSize: '14px',
  },
  testButton: {
    marginTop: '16px',
    padding: '8px 16px',
    background: '#f0f0f0',
    border: '1px solid #ccc',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#666',
    fontFamily: 'system-ui',
  },
  heroImage: {
    flex: '1',
    minWidth: '300px',
    display: 'flex',
    justifyContent: 'center',
  },
  interactionMockup: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  microphoneContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '120px',
    height: '120px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '50%',
    boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
  },
  soundWave: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    border: '2px solid rgba(255, 255, 255, 0.4)',
    animation: 'ripple 2s ease-out infinite',
  },
  microphoneIcon: {
    position: 'relative',
    zIndex: 1,
  },
  arrow: {
    fontSize: '48px',
    color: '#667eea',
    fontWeight: 'bold',
  },
  browserMockup: {
    width: '100%',
    maxWidth: '280px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
    border: '1px solid #e5e5e5',
  },
  browserBar: {
    display: 'flex',
    gap: '8px',
    padding: '12px 16px',
    background: '#f5f5f5',
    borderBottom: '1px solid #e5e5e5',
  },
  browserDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#ddd',
  },
  browserContent: {
    padding: '20px',
  },
  mockupHero: {
    height: '120px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  mockupContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  mockupLine: {
    height: '12px',
    background: '#e5e5e5',
    borderRadius: '4px',
  },
  mockupLineShort: {
    height: '12px',
    width: '60%',
    background: '#e5e5e5',
    borderRadius: '4px',
  },
  section: {
    padding: '80px 40px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  sectionTitle: {
    fontSize: '36px',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: '48px',
  },
  steps: {
    display: 'flex',
    gap: '40px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  step: {
    flex: '1',
    minWidth: '250px',
    maxWidth: '350px',
    textAlign: 'center',
  },
  stepNumber: {
    width: '48px',
    height: '48px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: '700',
    margin: '0 auto 16px',
  },
  stepTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  stepDesc: {
    color: '#666',
    lineHeight: '1.6',
  },
  pricingSection: {
    padding: '80px 40px',
    background: '#f8f9fa',
  },
  pricingCards: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  pricingCard: {
    flex: '1',
    minWidth: '280px',
    maxWidth: '320px',
    background: 'white',
    borderRadius: '16px',
    padding: '32px',
    textAlign: 'center',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
    position: 'relative',
  },
  pricingCardFeatured: {
    border: '2px solid #667eea',
    transform: 'scale(1.05)',
  },
  pricingBadge: {
    position: 'absolute',
    top: '-12px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '4px 16px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
  pricingTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  pricingPrice: {
    fontSize: '48px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  pricingDesc: {
    color: '#888',
    marginBottom: '24px',
  },
  pricingFeatures: {
    listStyle: 'none',
    padding: 0,
    textAlign: 'left',
    color: '#555',
    lineHeight: '2',
  },
  footer: {
    textAlign: 'center',
    padding: '40px',
    color: '#888',
  },
  // Dark mode styles
  containerDark: {
    background: '#0a0a0a',
    color: '#e5e5e5',
  },
  navDark: {
    background: '#0a0a0a',
    borderBottom: '1px solid #222',
  },
  navLinkDark: {
    color: '#b0b0b0',
  },
  heroDark: {
    background: '#0a0a0a',
  },
  heroTitleDark: {
    color: '#ffffff',
  },
  heroSubtitleDark: {
    color: '#b0b0b0',
  },
  sectionDark: {
    background: '#0a0a0a',
  },
  sectionTitleDark: {
    color: '#ffffff',
  },
  stepTitleDark: {
    color: '#ffffff',
  },
  stepDescDark: {
    color: '#b0b0b0',
  },
  pricingSectionDark: {
    background: '#111',
  },
  pricingCardDark: {
    background: '#1a1a1a',
    border: '1px solid #333',
  },
  pricingDescDark: {
    color: '#999',
  },
  footerDark: {
    background: '#0a0a0a',
    borderTop: '1px solid #222',
    color: '#666',
  },
}
