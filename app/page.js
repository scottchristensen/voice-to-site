'use client'

import { useState, useEffect } from 'react'

const translations = {
  en: {
    nav: {
      logo: 'SpeakYour.Site',
      howItWorks: 'How It Works',
      pricing: 'Pricing',
      login: 'Log In'
    },
    modal: {
      title: 'Your Website is Ready!',
      text: 'Sarah created a beautiful website for you. Click below to see it!',
      viewButton: 'View Your Website',
      close: 'Close'
    },
    hero: {
      title: 'Build Your Website',
      titleAccent: 'Just By Talking',
      subtitle: 'Describe your business to our AI voice agent and get a beautiful, professional marketing website in under 5 minutes. No coding, no design skills, no hassle.',
      ctaStart: 'Start Building Your Site',
      ctaConnecting: 'Connecting...',
      ctaEnd: 'End Call',
      ctaEnded: 'Call Ended',
      callIndicator: 'Speaking with Sarah...',
      previewReady: 'Your site is ready! ',
      previewLink: 'View it here →',
      freeCta: 'Free preview. No credit card required.',
      testButton: '🧪 Test Modal (Joe\'s Pizza)'
    },
    valueProps: {
      title: 'Get More Business In Just 5 Minutes',
      subtitle: 'Uplevel your professional business with an online presence that drives real results',
      revenue: {
        title: 'Increase Revenue',
        desc: 'Get discovered by more customers and convert them with a professional website that builds trust and credibility.'
      },
      discover: {
        title: 'Get Discovered Easier',
        desc: 'SEO and AI-optimized websites help customers find you on Google and AI search engines like ChatGPT and Perplexity.'
      },
      setup: {
        title: '5-Minute Setup',
        desc: 'Just have a quick conversation. No coding, no design skills, no technical hassle—your site is ready instantly.'
      },
      credibility: {
        title: 'Instant Credibility',
        desc: 'A polished, professional website makes your business look established and trustworthy—critical for winning new customers.'
      }
    },
    howItWorks: {
      title: 'How It Works',
      step1: {
        title: 'Talk to Sarah',
        desc: 'Click the button above and have a quick conversation with our AI assistant. Tell them about your business, what you offer, and who you serve.'
      },
      step2: {
        title: 'AI Builds Your Site',
        desc: 'Our AI takes your conversation and generates a complete, professional marketing website tailored to your business in seconds.'
      },
      step3: {
        title: 'Preview & Claim',
        desc: 'See your new site instantly. Make quick edits with AI, then claim your site to go live with your own subdomain.'
      }
    },
    pricing: {
      title: 'Simple Pricing',
      basic: {
        title: 'Basic',
        price: '$9',
        period: 'per month',
        features: ['Hosting included', 'Custom subdomain', 'Contact forms', 'Email notifications']
      },
      pro: {
        badge: 'Most Popular',
        title: 'Pro',
        price: '$29',
        period: 'per month',
        features: ['Everything in Basic', 'Unlimited AI edits', 'Priority support']
      },
      premium: {
        title: 'Premium',
        price: '$59',
        period: 'per month',
        features: ['Everything in Pro', '3 designer edits/month', 'Human-reviewed changes']
      }
    },
    bottomCta: {
      title: 'Ready to Build Your Website?',
      subtitle: 'Join thousands of business owners who have created their professional website in minutes.',
      button: 'Start Building Your Site'
    },
    footer: {
      brand: 'SpeakYour.Site',
      tagline: 'Build beautiful websites just by talking.',
      copyright: '2025 SpeakYour.Site. All rights reserved.',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service'
    }
  },
  es: {
    nav: {
      logo: 'SpeakYour.Site',
      howItWorks: 'Cómo Funciona',
      pricing: 'Precios',
      login: 'Iniciar Sesión'
    },
    modal: {
      title: '¡Tu Sitio Web Está Listo!',
      text: 'Sarah creó un hermoso sitio web para ti. ¡Haz clic abajo para verlo!',
      viewButton: 'Ver Tu Sitio Web',
      close: 'Cerrar'
    },
    hero: {
      title: 'Crea Tu Sitio Web',
      titleAccent: 'Solo Hablando',
      subtitle: 'Describe tu negocio a nuestro agente de voz AI y obtén un hermoso sitio web de marketing profesional en menos de 5 minutos. Sin programación, sin habilidades de diseño, sin complicaciones.',
      ctaStart: 'Comienza a Crear Tu Sitio',
      ctaConnecting: 'Conectando...',
      ctaEnd: 'Finalizar Llamada',
      ctaEnded: 'Llamada Finalizada',
      callIndicator: 'Hablando con Sarah...',
      previewReady: '¡Tu sitio está listo! ',
      previewLink: 'Míralo aquí →',
      freeCta: 'Vista previa gratuita. No se requiere tarjeta de crédito.',
      testButton: '🧪 Probar Modal (Joe\'s Pizza)'
    },
    valueProps: {
      title: 'Obtén Más Negocios En Solo 5 Minutos',
      subtitle: 'Mejora tu negocio profesional con una presencia en línea que genera resultados reales',
      revenue: {
        title: 'Aumenta Ingresos',
        desc: 'Que más clientes te descubran y conviértelos con un sitio web profesional que genera confianza y credibilidad.'
      },
      discover: {
        title: 'Sé Descubierto Más Fácil',
        desc: 'Los sitios web optimizados para SEO e IA ayudan a los clientes a encontrarte en Google y motores de búsqueda de IA como ChatGPT y Perplexity.'
      },
      setup: {
        title: 'Configuración de 5 Minutos',
        desc: 'Solo ten una conversación rápida. Sin programación, sin habilidades de diseño, sin complicaciones técnicas—tu sitio está listo al instante.'
      },
      credibility: {
        title: 'Credibilidad Instantánea',
        desc: 'Un sitio web pulido y profesional hace que tu negocio se vea establecido y confiable—crítico para ganar nuevos clientes.'
      }
    },
    howItWorks: {
      title: 'Cómo Funciona',
      step1: {
        title: 'Habla con Sarah',
        desc: 'Haz clic en el botón de arriba y ten una conversación rápida con nuestro asistente de IA. Cuéntales sobre tu negocio, lo que ofreces y a quién sirves.'
      },
      step2: {
        title: 'La IA Crea Tu Sitio',
        desc: 'Nuestra IA toma tu conversación y genera un sitio web de marketing completo y profesional adaptado a tu negocio en segundos.'
      },
      step3: {
        title: 'Vista Previa y Reclama',
        desc: 'Mira tu nuevo sitio al instante. Haz ediciones rápidas con IA, luego reclama tu sitio para publicarlo con tu propio subdominio.'
      }
    },
    pricing: {
      title: 'Precios Simples',
      basic: {
        title: 'Básico',
        price: '$9',
        period: 'por mes',
        features: ['Alojamiento incluido', 'Subdominio personalizado', 'Formularios de contacto', 'Notificaciones por email']
      },
      pro: {
        badge: 'Más Popular',
        title: 'Pro',
        price: '$29',
        period: 'por mes',
        features: ['Todo lo de Básico', 'Ediciones AI ilimitadas', 'Soporte prioritario']
      },
      premium: {
        title: 'Premium',
        price: '$59',
        period: 'por mes',
        features: ['Todo lo de Pro', '3 ediciones de diseñador/mes', 'Cambios revisados por humanos']
      }
    },
    bottomCta: {
      title: '¿Listo para Crear Tu Sitio Web?',
      subtitle: 'Únete a miles de dueños de negocios que han creado su sitio web profesional en minutos.',
      button: 'Comienza a Crear Tu Sitio'
    },
    footer: {
      brand: 'SpeakYour.Site',
      tagline: 'Crea sitios web hermosos solo hablando.',
      copyright: '2025 SpeakYour.Site. Todos los derechos reservados.',
      privacy: 'Política de Privacidad',
      terms: 'Términos de Servicio'
    }
  }
}

export default function Home() {
  const [isCallActive, setIsCallActive] = useState(false)
  const [callStatus, setCallStatus] = useState('idle') // idle, connecting, connected, ended
  const [vapi, setVapi] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [language, setLanguage] = useState('en') // 'en' or 'es'
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Detect OS dark mode preference
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDarkMode(darkModeMediaQuery.matches)

    // Listen for changes to OS dark mode setting
    const handleChange = (e) => setIsDarkMode(e.matches)
    darkModeMediaQuery.addEventListener('change', handleChange)

    return () => darkModeMediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Load language from localStorage on mount
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

  // Detect mobile for language toggle UI
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
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
          console.log('Vapi message received:', message)
          console.log('Message type:', message.type)

          // Try to extract URL from various message formats
          let textToSearch = ''

          // Check for tool call results
          if (message.type === 'tool-call-result' || message.type === 'function-call-result') {
            textToSearch = message.result || message.output || ''
            console.log('Tool call result text:', textToSearch)
          }

          // Check transcript
          if (message.type === 'transcript' && message.transcript) {
            textToSearch = message.transcript
            console.log('Transcript text:', textToSearch)
          }

          // Check if entire message object contains URL (stringify and search)
          if (!textToSearch) {
            textToSearch = JSON.stringify(message)
            console.log('Searching entire message object for URL')
          }

          // Extract URL from whatever text we found
          if (textToSearch) {
            const urlMatch = textToSearch.match(/https?:\/\/[^\s"',]+\/preview\/[^\s"',]+/)
            if (urlMatch) {
              const url = urlMatch[0].replace(/[.,!?]$/, '') // Remove trailing punctuation
              console.log('✅ Found preview URL:', url)
              setPreviewUrl(url)
              setShowModal(true)
            } else {
              console.log('❌ No preview URL found in text')
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
      // Route to Spanish or English VAPI assistant based on language
      const assistantId = language === 'es'
        ? process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID_ES
        : process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID

      // Fall back to default if Spanish assistant ID not configured
      await vapi.start(assistantId || process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID)
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

  const t = translations[language]

  return (
    <div style={{...styles.container, ...(isDarkMode && styles.containerDark)}}>
      <style>{`
        /* Hover states for interactive elements */
        .home-nav-link {
          transition: color 0.2s, opacity 0.2s !important;
        }
        .home-nav-link:hover {
          color: #667eea !important;
        }
        .lang-toggle:hover {
          background: rgba(102, 126, 234, 0.1) !important;
          border-color: #667eea !important;
          color: #667eea !important;
        }
        .lang-toggle:active {
          transform: scale(0.98);
        }
        .login-link:hover {
          color: #4f46e5 !important;
        }
        .cta-btn:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4) !important;
        }
        .cta-btn:active:not(:disabled) {
          transform: scale(0.98);
        }
        .modal-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4) !important;
        }
        .modal-close:hover {
          color: #667eea !important;
        }
        .pricing-card {
          transition: transform 0.2s, box-shadow 0.2s !important;
        }
        .pricing-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
        }
        .footer-link {
          transition: color 0.2s !important;
        }
        .footer-link:hover {
          color: #a5b4fc !important;
        }
      `}</style>
      {/* Success Modal */}
      {showModal && previewUrl && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalIcon}>🎉</div>
            <h2 style={styles.modalTitle}>{t.modal.title}</h2>
            <p style={styles.modalText}>
              {t.modal.text}
            </p>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="modal-btn"
              style={styles.modalButton}
            >
              {t.modal.viewButton}
            </a>
            <button
              onClick={() => setShowModal(false)}
              className="modal-close"
              style={styles.modalClose}
            >
              {t.modal.close}
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{...styles.navWrapper, ...(isDarkMode && styles.navWrapperDark)}}>
      <nav style={{...styles.nav, ...(isMobile && styles.navMobile)}}>
        <div style={styles.logo}>{t.nav.logo}</div>
        <div style={{...styles.navLinks, ...(isMobile && styles.navLinksMobile)}}>
          {/* Hide nav links on mobile */}
          {!isMobile && (
            <>
              <a href="#how-it-works" className="home-nav-link" style={{...styles.navLink, ...(isDarkMode && styles.navLinkDark)}}>{t.nav.howItWorks}</a>
              <a href="#pricing" className="home-nav-link" style={{...styles.navLink, ...(isDarkMode && styles.navLinkDark)}}>{t.nav.pricing}</a>
            </>
          )}
          {/* Language Toggle - Sliding for desktop, minimal dropdown for mobile */}
          {isMobile ? (
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="lang-dropdown-mobile"
              style={{...styles.langDropdownMobile, ...(isDarkMode && styles.langDropdownMobileDark)}}
            >
              <option value="en">🇺🇸 EN</option>
              <option value="es">🇪🇸 ES</option>
            </select>
          ) : (
            <div style={{...styles.langToggleContainer, ...(isDarkMode && styles.langToggleContainerDark)}}>
              <button
                onClick={() => setLanguage('en')}
                style={{
                  ...styles.langToggleBtn,
                  ...(language === 'en' ? styles.langToggleBtnActive : {}),
                  ...(isDarkMode && (language === 'en' ? styles.langToggleBtnActiveDark : styles.langToggleBtnDark))
                }}
              >
                🇺🇸 EN
              </button>
              <button
                onClick={() => setLanguage('es')}
                style={{
                  ...styles.langToggleBtn,
                  ...(language === 'es' ? styles.langToggleBtnActive : {}),
                  ...(isDarkMode && (language === 'es' ? styles.langToggleBtnActiveDark : styles.langToggleBtnDark))
                }}
              >
                🇪🇸 ES
              </button>
              <div
                style={{
                  ...styles.langToggleSlider,
                  ...(isDarkMode && styles.langToggleSliderDark),
                  transform: language === 'es' ? 'translateX(100%)' : 'translateX(0)'
                }}
              />
            </div>
          )}
          <span style={{...styles.pipeDivider, ...(isDarkMode && styles.pipeDividerDark)}}>|</span>
          <a href="/login" className="login-link" style={{...styles.loginLink, ...(isDarkMode && styles.loginLinkDark)}}>
            {t.nav.login}
          </a>
        </div>
      </nav>
      </div>

      {/* Hero Section */}
      <section style={{...styles.hero, ...(isDarkMode && styles.heroDark)}}>
        <div style={styles.heroContent}>
          <h1 style={{...styles.heroTitle, ...(isDarkMode && styles.heroTitleDark)}}>
            {t.hero.title}<br />
            <span style={styles.heroAccent}>{t.hero.titleAccent}</span>
          </h1>
          <p style={{...styles.heroSubtitle, ...(isDarkMode && styles.heroSubtitleDark)}}>
            {t.hero.subtitle}
          </p>

          {/* CTA Button */}
          <button
            onClick={isCallActive ? endCall : startCall}
            disabled={callStatus === 'connecting'}
            className="cta-btn"
            style={{
              ...styles.ctaButton,
              ...(isMobile && styles.ctaButtonMobile),
              ...(isCallActive ? styles.ctaButtonActive : {}),
              ...(callStatus === 'connecting' ? styles.ctaButtonDisabled : {})
            }}
          >
            {callStatus === 'idle' && (
              <>
                <MicIcon />
                {t.hero.ctaStart}
              </>
            )}
            {callStatus === 'connecting' && (
              <>
                <LoadingSpinner />
                {t.hero.ctaConnecting}
              </>
            )}
            {callStatus === 'connected' && (
              <>
                <PhoneOffIcon />
                {t.hero.ctaEnd}
              </>
            )}
            {callStatus === 'ended' && (
              <>
                <CheckIcon />
                {t.hero.ctaEnded}
              </>
            )}
          </button>

          {isCallActive && (
            <div style={styles.callIndicator}>
              <span style={styles.pulse}></span>
              {t.hero.callIndicator}
            </div>
          )}

          {/* Show link to preview if URL exists but modal is closed */}
          {previewUrl && !showModal && !isCallActive && (
            <div style={styles.previewLink}>
              <span>{t.hero.previewReady}</span>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.previewLinkAnchor}
              >
                {t.hero.previewLink}
              </a>
            </div>
          )}

          <p style={{...styles.heroCta, ...(isMobile && styles.heroCtaMobile)}}>
            {t.hero.freeCta}
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
              {t.hero.testButton}
            </button>
          )}
        </div>

        {/* Demo Preview */}
        <div style={styles.heroImage}>
          <div style={styles.interactionMockup}>
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

            {/* Microphone/Voice Indicator - Overlayed on top right */}
            <div style={styles.microphoneContainer}>
              <div style={styles.soundWave}></div>
              <div style={styles.soundWave}></div>
              <div style={styles.soundWave}></div>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.microphoneIcon}>
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" x2="12" y1="19" y2="22"></line>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section style={{...styles.valuePropsSection, ...(isDarkMode && styles.valuePropsSectionDark)}}>
        <div style={styles.valuePropsContainer}>
          <h2 style={{...styles.valuePropsTitle, ...(isDarkMode && styles.valuePropsTitleDark)}}>
            {t.valueProps.title}
          </h2>
          <p style={{...styles.valuePropsSubtitle, ...(isDarkMode && styles.valuePropsSubtitleDark)}}>
            {t.valueProps.subtitle}
          </p>
          <div style={styles.valuePropsGrid}>
            <div style={{...styles.valueProp, ...(isDarkMode && styles.valuePropDark)}}>
              <div style={styles.valuePropIcon}>💰</div>
              <h3 style={{...styles.valuePropTitle, ...(isDarkMode && styles.valuePropTitleDark)}}>{t.valueProps.revenue.title}</h3>
              <p style={{...styles.valuePropDesc, ...(isDarkMode && styles.valuePropDescDark)}}>
                {t.valueProps.revenue.desc}
              </p>
            </div>
            <div style={{...styles.valueProp, ...(isDarkMode && styles.valuePropDark)}}>
              <div style={styles.valuePropIcon}>🔍</div>
              <h3 style={{...styles.valuePropTitle, ...(isDarkMode && styles.valuePropTitleDark)}}>{t.valueProps.discover.title}</h3>
              <p style={{...styles.valuePropDesc, ...(isDarkMode && styles.valuePropDescDark)}}>
                {t.valueProps.discover.desc}
              </p>
            </div>
            <div style={{...styles.valueProp, ...(isDarkMode && styles.valuePropDark)}}>
              <div style={styles.valuePropIcon}>⚡</div>
              <h3 style={{...styles.valuePropTitle, ...(isDarkMode && styles.valuePropTitleDark)}}>{t.valueProps.setup.title}</h3>
              <p style={{...styles.valuePropDesc, ...(isDarkMode && styles.valuePropDescDark)}}>
                {t.valueProps.setup.desc}
              </p>
            </div>
            <div style={{...styles.valueProp, ...(isDarkMode && styles.valuePropDark)}}>
              <div style={styles.valuePropIcon}>✨</div>
              <h3 style={{...styles.valuePropTitle, ...(isDarkMode && styles.valuePropTitleDark)}}>{t.valueProps.credibility.title}</h3>
              <p style={{...styles.valuePropDesc, ...(isDarkMode && styles.valuePropDescDark)}}>
                {t.valueProps.credibility.desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{...styles.section, ...(isDarkMode && styles.sectionDark)}}>
        <h2 style={{...styles.sectionTitle, ...(isDarkMode && styles.sectionTitleDark)}}>{t.howItWorks.title}</h2>
        <div style={styles.steps}>
          <div style={styles.step}>
            <div style={styles.stepNumber}>1</div>
            <h3 style={{...styles.stepTitle, ...(isDarkMode && styles.stepTitleDark)}}>{t.howItWorks.step1.title}</h3>
            <p style={{...styles.stepDesc, ...(isDarkMode && styles.stepDescDark)}}>
              {t.howItWorks.step1.desc}
            </p>
          </div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>2</div>
            <h3 style={{...styles.stepTitle, ...(isDarkMode && styles.stepTitleDark)}}>{t.howItWorks.step2.title}</h3>
            <p style={{...styles.stepDesc, ...(isDarkMode && styles.stepDescDark)}}>
              {t.howItWorks.step2.desc}
            </p>
          </div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>3</div>
            <h3 style={{...styles.stepTitle, ...(isDarkMode && styles.stepTitleDark)}}>{t.howItWorks.step3.title}</h3>
            <p style={{...styles.stepDesc, ...(isDarkMode && styles.stepDescDark)}}>
              {t.howItWorks.step3.desc}
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{...styles.pricingSection, ...(isDarkMode && styles.pricingSectionDark)}}>
        <h2 style={{...styles.sectionTitle, ...(isDarkMode && styles.sectionTitleDark)}}>{t.pricing.title}</h2>
        <div style={styles.pricingCards}>
          <div className="pricing-card" style={{...styles.pricingCard, ...(isDarkMode && styles.pricingCardDark)}}>
            <h3 style={styles.pricingTitle}>{t.pricing.basic.title}</h3>
            <div style={styles.pricingPrice}>{t.pricing.basic.price}</div>
            <p style={{...styles.pricingDesc, ...(isDarkMode && styles.pricingDescDark)}}>{t.pricing.basic.period}</p>
            <ul style={styles.pricingFeatures}>
              {t.pricing.basic.features.map((feature, i) => <li key={i}>{feature}</li>)}
            </ul>
          </div>
          <div className="pricing-card" style={{ ...styles.pricingCard, ...styles.pricingCardFeatured, ...(isDarkMode && styles.pricingCardDark) }}>
            <div style={styles.pricingBadge}>{t.pricing.pro.badge}</div>
            <h3 style={styles.pricingTitle}>{t.pricing.pro.title}</h3>
            <div style={styles.pricingPrice}>{t.pricing.pro.price}</div>
            <p style={{...styles.pricingDesc, ...(isDarkMode && styles.pricingDescDark)}}>{t.pricing.pro.period}</p>
            <ul style={styles.pricingFeatures}>
              {t.pricing.pro.features.map((feature, i) => <li key={i}>{feature}</li>)}
            </ul>
          </div>
          <div className="pricing-card" style={{...styles.pricingCard, ...(isDarkMode && styles.pricingCardDark)}}>
            <h3 style={styles.pricingTitle}>{t.pricing.premium.title}</h3>
            <div style={styles.pricingPrice}>{t.pricing.premium.price}</div>
            <p style={{...styles.pricingDesc, ...(isDarkMode && styles.pricingDescDark)}}>{t.pricing.premium.period}</p>
            <ul style={styles.pricingFeatures}>
              {t.pricing.premium.features.map((feature, i) => <li key={i}>{feature}</li>)}
            </ul>
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section style={{...styles.bottomCtaSection, ...(isDarkMode && styles.bottomCtaSectionDark)}}>
        <div style={styles.bottomCtaContainer}>
          <h2 style={{...styles.bottomCtaTitle, ...(isDarkMode && styles.bottomCtaTitleDark)}}>
            {t.bottomCta.title}
          </h2>
          <p style={{...styles.bottomCtaSubtitle, ...(isDarkMode && styles.bottomCtaSubtitleDark)}}>
            {t.bottomCta.subtitle}
          </p>
          <button
            onClick={isCallActive ? endCall : startCall}
            disabled={callStatus === 'connecting'}
            className="cta-btn"
            style={{
              ...styles.ctaButton,
              ...styles.ctaButtonWhite,
              ...(isCallActive ? styles.ctaButtonActive : {}),
              ...(callStatus === 'connecting' ? styles.ctaButtonDisabled : {})
            }}
          >
            {callStatus === 'idle' && (
              <>
                <MicIcon />
                {t.bottomCta.button}
              </>
            )}
            {callStatus === 'connecting' && (
              <>
                <LoadingSpinner />
                {t.hero.ctaConnecting}
              </>
            )}
            {callStatus === 'connected' && (
              <>
                <PhoneOffIcon />
                {t.hero.ctaEnd}
              </>
            )}
            {callStatus === 'ended' && (
              <>
                <CheckIcon />
                {t.hero.ctaEnded}
              </>
            )}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{...styles.footer, ...(isDarkMode && styles.footerDark)}}>
        <div style={styles.footerContent}>
          <div style={styles.footerBrand}>
            <span style={styles.footerLogo}>{t.footer.brand}</span>
            <p style={styles.footerTagline}>{t.footer.tagline}</p>
          </div>
          <div style={styles.footerLinks}>
            <a href="/privacy" className="footer-link" style={{...styles.footerLink, ...(isDarkMode && styles.footerLinkDark)}}>{t.footer.privacy}</a>
            <a href="/terms" className="footer-link" style={{...styles.footerLink, ...(isDarkMode && styles.footerLinkDark)}}>{t.footer.terms}</a>
          </div>
        </div>
        <div style={styles.footerBottom}>
          <p style={styles.footerCopyright}>{t.footer.copyright}</p>
        </div>
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
  navWrapper: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: '#ffffff',
    borderBottom: '1px solid #eee',
  },
  navWrapperDark: {
    background: '#0a0a0a',
    borderBottom: '1px solid #222',
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 40px',
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
    alignItems: 'center',
  },
  navLink: {
    color: '#555',
    textDecoration: 'none',
    fontWeight: '500',
  },
  // Desktop: Sliding toggle
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
  langToggleBtnDark: {
    color: '#aaa',
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
    pointerEvents: 'none',
  },
  langToggleSliderDark: {
    background: '#444',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  },
  langToggleBtnActiveDark: {
    color: '#fff',
  },
  // Mobile: Dropdown
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
  langDropdownDark: {
    background: '#2a2a3e',
    color: '#ddd',
    borderColor: '#444',
  },
  // Mobile-specific dropdown (minimal, no border)
  langDropdownMobile: {
    background: 'transparent',
    color: '#555',
    border: 'none',
    padding: '4px 2px',
    fontWeight: '500',
    fontSize: '14px',
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0 center',
    paddingRight: '14px',
  },
  langDropdownMobileDark: {
    color: '#ddd',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23aaa' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  },
  // Login link style
  loginLink: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: '500',
  },
  loginLinkDark: {
    color: '#a5b4fc',
  },
  // Pipe divider between language toggle and login
  pipeDivider: {
    color: '#ddd',
    fontSize: '14px',
    fontWeight: '300',
  },
  pipeDividerDark: {
    color: '#555',
  },
  // Mobile nav adjustments
  navMobile: {
    padding: '16px 20px',
  },
  navLinksMobile: {
    gap: '16px',
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
  ctaButtonWhite: {
    background: 'white',
    color: '#667eea',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
  },
  ctaButtonMobile: {
    width: '100%',
    textAlign: 'center',
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
  heroCtaMobile: {
    textAlign: 'center',
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
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  microphoneContainer: {
    position: 'absolute',
    top: '-20px',
    right: '-30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100px',
    height: '100px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '50%',
    boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
    zIndex: 10,
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
  browserMockup: {
    width: '100%',
    maxWidth: '440px',
    aspectRatio: '16 / 10',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
    border: '1px solid #e5e5e5',
    display: 'flex',
    flexDirection: 'column',
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
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  mockupHero: {
    height: '100px',
    background: '#e5e5e5',
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
  // Bottom CTA Section
  bottomCtaSection: {
    padding: '80px 40px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    textAlign: 'center',
  },
  bottomCtaSectionDark: {
    background: 'linear-gradient(135deg, #4c5fd7 0%, #5c3d8a 100%)',
  },
  bottomCtaContainer: {
    maxWidth: '700px',
    margin: '0 auto',
  },
  bottomCtaTitle: {
    fontSize: '36px',
    fontWeight: '700',
    color: 'white',
    marginBottom: '16px',
  },
  bottomCtaTitleDark: {
    color: 'white',
  },
  bottomCtaSubtitle: {
    fontSize: '18px',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: '32px',
    lineHeight: '1.6',
  },
  bottomCtaSubtitleDark: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  footer: {
    padding: '48px 40px 24px',
    background: '#1a1a2e',
    color: '#888',
  },
  footerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '32px',
    marginBottom: '32px',
  },
  footerBrand: {
    textAlign: 'left',
  },
  footerLogo: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'white',
    display: 'block',
    marginBottom: '8px',
  },
  footerTagline: {
    color: '#888',
    fontSize: '14px',
  },
  footerLinks: {
    display: 'flex',
    gap: '24px',
  },
  footerLink: {
    color: '#888',
    textDecoration: 'none',
    fontSize: '14px',
    transition: 'color 0.2s',
  },
  footerLinkDark: {
    color: '#888',
  },
  footerBottom: {
    maxWidth: '1200px',
    margin: '0 auto',
    paddingTop: '24px',
    borderTop: '1px solid #333',
    textAlign: 'center',
  },
  footerCopyright: {
    color: '#666',
    fontSize: '13px',
  },
  // Value Props Section
  valuePropsSection: {
    padding: '80px 40px',
    background: '#f8f9fa',
  },
  valuePropsContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  valuePropsTitle: {
    fontSize: '36px',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: '16px',
  },
  valuePropsSubtitle: {
    fontSize: '18px',
    color: '#666',
    textAlign: 'center',
    marginBottom: '48px',
  },
  valuePropsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '32px',
  },
  valueProp: {
    background: 'white',
    padding: '32px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    textAlign: 'center',
  },
  valuePropIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  valuePropTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '12px',
  },
  valuePropDesc: {
    color: '#666',
    lineHeight: '1.6',
    fontSize: '15px',
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
  langToggleContainerDark: {
    background: '#2a2a3e',
  },
  heroDark: {
    background: '#0a0a0a',
  },
  heroTitleDark: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  heroSubtitleDark: {
    color: '#b0b0b0',
  },
  sectionDark: {
    background: '#0a0a0a',
  },
  sectionTitleDark: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  stepTitleDark: {
    color: 'rgba(255, 255, 255, 0.9)',
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
  valuePropsSectionDark: {
    background: '#111',
  },
  valuePropsTitleDark: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  valuePropsSubtitleDark: {
    color: '#b0b0b0',
  },
  valuePropDark: {
    background: '#1a1a1a',
    border: '1px solid #333',
  },
  valuePropTitleDark: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  valuePropDescDark: {
    color: '#b0b0b0',
  },
}
