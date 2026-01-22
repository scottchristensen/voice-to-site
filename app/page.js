'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [isCallActive, setIsCallActive] = useState(false)
  const [callStatus, setCallStatus] = useState('idle') // idle, connecting, connected, ended
  const [vapi, setVapi] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [siteId, setSiteId] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [email, setEmail] = useState('')
  const [capturedEmail, setCapturedEmail] = useState('') // Email captured from Vapi
  const [emailSent, setEmailSent] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)

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

        // Helper to extract URL and siteId from any string
        const extractUrlAndId = (text) => {
          if (!text || typeof text !== 'string') return null
          // Match preview URLs with UUID pattern
          const urlMatch = text.match(/https?:\/\/[^\s"']+\/preview\/([a-f0-9-]+)/i)
          if (urlMatch) {
            const url = urlMatch[0].replace(/[.,!?]$/, '') // Remove trailing punctuation
            const id = urlMatch[1] // Capture the UUID
            return { url, id }
          }
          return null
        }

        // Helper to extract email from text
        const extractEmail = (text) => {
          if (!text || typeof text !== 'string') return null
          const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i)
          return emailMatch ? emailMatch[0] : null
        }

        // Track if we've already shown the modal
        let urlFound = false

        // Listen for messages to capture the preview URL and email
        vapiInstance.on('message', (message) => {
          console.log('Vapi message:', message.type, JSON.stringify(message, null, 2))

          // Try to extract email from any message (for pre-filling)
          const fullMessageStr = JSON.stringify(message)
          const foundEmail = extractEmail(fullMessageStr)
          if (foundEmail) {
            console.log('Found email in message:', foundEmail)
            setCapturedEmail(foundEmail)
          }

          // Look for URL if not found yet
          if (!urlFound) {
            const result = extractUrlAndId(fullMessageStr)
            if (result) {
              console.log('Found preview URL:', result.url, 'ID:', result.id)
              urlFound = true
              setPreviewUrl(result.url)
              setSiteId(result.id)
              setShowModal(true)
            }
          }
        })

        // Also listen for speech-update which contains what's being said
        vapiInstance.on('speech-update', (update) => {
          console.log('Speech update:', update)
          const text = update?.text || update?.transcript || ''

          // Try to capture email from speech
          const foundEmail = extractEmail(text)
          if (foundEmail) {
            console.log('Found email in speech:', foundEmail)
            setCapturedEmail(foundEmail)
          }

          // Look for URL if not found yet
          if (!urlFound) {
            const result = extractUrlAndId(text)
            if (result) {
              console.log('Found URL in speech:', result.url)
              urlFound = true
              setPreviewUrl(result.url)
              setSiteId(result.id)
              setShowModal(true)
            }
          }
        })

        // Listen for call-end and check conversation
        vapiInstance.on('call-end', () => {
          console.log('Call ended, urlFound:', urlFound)
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
    <div style={styles.container}>
      {/* Email Gate Modal */}
      {showModal && previewUrl && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            {!emailSent ? (
              <>
                <div style={styles.modalIcon}>🎉</div>
                <h2 style={styles.modalTitle}>Your Website is Ready!</h2>
                <p style={styles.modalText}>
                  Enter your email to get the link to your new website. We'll also send you a copy so you don't lose it!
                </p>
                <input
                  type="email"
                  value={email || capturedEmail}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={styles.emailInput}
                  autoFocus
                />
                <button
                  onClick={async () => {
                    const emailToUse = email || capturedEmail
                    if (!emailToUse) return
                    setIsSendingEmail(true)
                    try {
                      await fetch('/api/send-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          siteId,
                          email: emailToUse,
                          type: 'preview'
                        })
                      })
                      setEmailSent(true)
                    } catch (err) {
                      console.error('Email error:', err)
                      setEmailSent(true) // Still show link even if email fails
                    }
                    setIsSendingEmail(false)
                  }}
                  disabled={!(email || capturedEmail) || isSendingEmail}
                  style={{
                    ...styles.modalButton,
                    opacity: (!(email || capturedEmail) || isSendingEmail) ? 0.6 : 1,
                    cursor: (!(email || capturedEmail) || isSendingEmail) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSendingEmail ? 'Sending...' : 'Email Me My Site'}
                </button>
                <p style={styles.modalSubtext}>
                  We'll send you a link so you can access your site anytime
                </p>
              </>
            ) : (
              <>
                <div style={styles.modalIcon}>✉️</div>
                <h2 style={styles.modalTitle}>Check Your Inbox!</h2>
                <p style={styles.modalText}>
                  We've emailed you a link to your website. You can also view it now:
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
                  onClick={() => {
                    setShowModal(false)
                    setEmailSent(false)
                    setEmail('')
                  }}
                  style={styles.modalClose}
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav style={styles.nav}>
        <div style={styles.logo}>Speak Your Site</div>
        <div style={styles.navLinks}>
          <a href="#how-it-works" style={styles.navLink}>How It Works</a>
          <a href="#pricing" style={styles.navLink}>Pricing</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>
            Build Your Website<br />
            <span style={styles.heroAccent}>Just By Talking</span>
          </h1>
          <p style={styles.heroSubtitle}>
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
        </div>

        {/* Demo Preview */}
        <div style={styles.heroImage}>
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
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={styles.section}>
        <h2 style={styles.sectionTitle}>How It Works</h2>
        <div style={styles.steps}>
          <div style={styles.step}>
            <div style={styles.stepNumber}>1</div>
            <h3 style={styles.stepTitle}>Talk to Sarah</h3>
            <p style={styles.stepDesc}>
              Click the button above and have a quick conversation with our AI assistant.
              Tell them about your business, what you offer, and who you serve.
            </p>
          </div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>2</div>
            <h3 style={styles.stepTitle}>AI Builds Your Site</h3>
            <p style={styles.stepDesc}>
              Our AI takes your conversation and generates a complete, professional
              marketing website tailored to your business in seconds.
            </p>
          </div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>3</div>
            <h3 style={styles.stepTitle}>Preview & Claim</h3>
            <p style={styles.stepDesc}>
              See your new site instantly. Love it? Export the code, let us host it,
              or get premium design services to make it perfect.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={styles.pricingSection}>
        <h2 style={styles.sectionTitle}>Simple Pricing</h2>
        <div style={styles.pricingCards}>
          <div style={styles.pricingCard}>
            <h3 style={styles.pricingTitle}>Export Code</h3>
            <div style={styles.pricingPrice}>$49</div>
            <p style={styles.pricingDesc}>one-time</p>
            <ul style={styles.pricingFeatures}>
              <li>Download HTML/CSS/JS</li>
              <li>Host anywhere you want</li>
              <li>Full ownership</li>
            </ul>
          </div>
          <div style={{ ...styles.pricingCard, ...styles.pricingCardFeatured }}>
            <div style={styles.pricingBadge}>Popular</div>
            <h3 style={styles.pricingTitle}>Hosted</h3>
            <div style={styles.pricingPrice}>$29</div>
            <p style={styles.pricingDesc}>per month</p>
            <ul style={styles.pricingFeatures}>
              <li>We host it for you</li>
              <li>Custom domain</li>
              <li>SSL included</li>
              <li>Basic analytics</li>
            </ul>
          </div>
          <div style={styles.pricingCard}>
            <h3 style={styles.pricingTitle}>Premium Design</h3>
            <div style={styles.pricingPrice}>$499+</div>
            <p style={styles.pricingDesc}>one-time</p>
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
      <footer style={styles.footer}>
        <p>Built with Speak Your Site</p>
      </footer>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
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
    border: 'none',
    cursor: 'pointer',
    textAlign: 'center',
  },
  modalClose: {
    background: 'none',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '8px',
  },
  emailInput: {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    border: '2px solid #eee',
    borderRadius: '12px',
    marginBottom: '16px',
    outline: 'none',
    boxSizing: 'border-box',
    textAlign: 'center',
  },
  modalSubtext: {
    color: '#888',
    fontSize: '13px',
    marginTop: '8px',
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
  heroImage: {
    flex: '1',
    minWidth: '300px',
    display: 'flex',
    justifyContent: 'center',
  },
  browserMockup: {
    width: '100%',
    maxWidth: '500px',
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
}
