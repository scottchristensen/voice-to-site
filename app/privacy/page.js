'use client'

import { useState, useEffect } from 'react'

export default function PrivacyPolicy() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDarkMode(darkModeMediaQuery.matches)
    const handleChange = (e) => setIsDarkMode(e.matches)
    darkModeMediaQuery.addEventListener('change', handleChange)
    return () => darkModeMediaQuery.removeEventListener('change', handleChange)
  }, [])

  return (
    <div style={{...styles.container, ...(isDarkMode && styles.containerDark)}}>
      {/* Header */}
      <header style={{...styles.header, ...(isDarkMode && styles.headerDark)}}>
        <a href="/" style={styles.logo}>SpeakYour.Site</a>
      </header>

      {/* Content */}
      <main style={styles.main}>
        <article style={styles.article}>
          <h1 style={{...styles.title, ...(isDarkMode && styles.titleDark)}}>Privacy Policy</h1>
          <p style={styles.lastUpdated}>Last updated: January 27, 2025</p>

          <section style={styles.section}>
            <h2 style={{...styles.heading, ...(isDarkMode && styles.headingDark)}}>1. Introduction</h2>
            <p style={{...styles.paragraph, ...(isDarkMode && styles.paragraphDark)}}>
              Welcome to SpeakYour.Site ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={{...styles.heading, ...(isDarkMode && styles.headingDark)}}>2. Information We Collect</h2>
            <p style={{...styles.paragraph, ...(isDarkMode && styles.paragraphDark)}}>
              We collect information that you provide directly to us, including:
            </p>
            <ul style={{...styles.list, ...(isDarkMode && styles.listDark)}}>
              <li>Account information (email address, password)</li>
              <li>Business information (business name, industry, contact details)</li>
              <li>Payment information (processed securely through Stripe)</li>
              <li>Voice recordings when using our voice-to-website feature</li>
              <li>Website content you create through our platform</li>
              <li>Communications with us (support requests, feedback)</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={{...styles.heading, ...(isDarkMode && styles.headingDark)}}>3. How We Use Your Information</h2>
            <p style={{...styles.paragraph, ...(isDarkMode && styles.paragraphDark)}}>
              We use the information we collect to:
            </p>
            <ul style={{...styles.list, ...(isDarkMode && styles.listDark)}}>
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices, updates, and support messages</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Generate websites based on your voice input and preferences</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, investigate, and prevent fraudulent transactions</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={{...styles.heading, ...(isDarkMode && styles.headingDark)}}>4. Voice Data</h2>
            <p style={{...styles.paragraph, ...(isDarkMode && styles.paragraphDark)}}>
              When you use our voice-to-website feature, your voice is processed in real-time to generate website content. Voice recordings may be temporarily stored for processing purposes but are not permanently retained unless you explicitly consent. We use third-party services (including VAPI) to process voice data, which have their own privacy policies.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={{...styles.heading, ...(isDarkMode && styles.headingDark)}}>5. Information Sharing</h2>
            <p style={{...styles.paragraph, ...(isDarkMode && styles.paragraphDark)}}>
              We may share your information with:
            </p>
            <ul style={{...styles.list, ...(isDarkMode && styles.listDark)}}>
              <li>Service providers who perform services on our behalf (hosting, payment processing, analytics)</li>
              <li>Professional advisors (lawyers, accountants, insurers)</li>
              <li>Law enforcement or government agencies when required by law</li>
              <li>Other parties in connection with a merger, acquisition, or sale of assets</li>
            </ul>
            <p style={{...styles.paragraph, ...(isDarkMode && styles.paragraphDark)}}>
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={{...styles.heading, ...(isDarkMode && styles.headingDark)}}>6. Data Security</h2>
            <p style={{...styles.paragraph, ...(isDarkMode && styles.paragraphDark)}}>
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={{...styles.heading, ...(isDarkMode && styles.headingDark)}}>7. Your Rights</h2>
            <p style={{...styles.paragraph, ...(isDarkMode && styles.paragraphDark)}}>
              Depending on your location, you may have the right to:
            </p>
            <ul style={{...styles.list, ...(isDarkMode && styles.listDark)}}>
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your personal information</li>
              <li>Object to or restrict certain processing</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={{...styles.heading, ...(isDarkMode && styles.headingDark)}}>8. Cookies</h2>
            <p style={{...styles.paragraph, ...(isDarkMode && styles.paragraphDark)}}>
              We use cookies and similar tracking technologies to collect and track information about your browsing activities. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={{...styles.heading, ...(isDarkMode && styles.headingDark)}}>9. Third-Party Services</h2>
            <p style={{...styles.paragraph, ...(isDarkMode && styles.paragraphDark)}}>
              Our service integrates with third-party services including Stripe (payments), Supabase (database), VAPI (voice processing), and OpenAI/Anthropic (AI generation). Each of these services has their own privacy policies that govern their use of your data.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={{...styles.heading, ...(isDarkMode && styles.headingDark)}}>10. Children's Privacy</h2>
            <p style={{...styles.paragraph, ...(isDarkMode && styles.paragraphDark)}}>
              Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={{...styles.heading, ...(isDarkMode && styles.headingDark)}}>11. Changes to This Policy</h2>
            <p style={{...styles.paragraph, ...(isDarkMode && styles.paragraphDark)}}>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={{...styles.heading, ...(isDarkMode && styles.headingDark)}}>12. Contact Us</h2>
            <p style={{...styles.paragraph, ...(isDarkMode && styles.paragraphDark)}}>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p style={{...styles.paragraph, ...(isDarkMode && styles.paragraphDark)}}>
              Email: support@speakyour.site
            </p>
          </section>
        </article>
      </main>

      {/* Footer */}
      <footer style={{...styles.footer, ...(isDarkMode && styles.footerDark)}}>
        <p>&copy; 2025 SpeakYour.Site. All rights reserved.</p>
        <div style={styles.footerLinks}>
          <a href="/privacy" style={styles.footerLink}>Privacy Policy</a>
          <a href="/terms" style={styles.footerLink}>Terms of Service</a>
        </div>
      </footer>
    </div>
  )
}

const styles = {
  container: {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    minHeight: '100vh',
    background: '#ffffff',
    color: '#1a1a2e',
  },
  containerDark: {
    background: '#0a0a0a',
    color: '#e5e5e5',
  },
  header: {
    padding: '20px 40px',
    borderBottom: '1px solid #eee',
  },
  headerDark: {
    borderBottom: '1px solid #222',
  },
  logo: {
    fontSize: '24px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textDecoration: 'none',
  },
  main: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '60px 40px',
  },
  article: {
    lineHeight: '1.8',
  },
  title: {
    fontSize: '42px',
    fontWeight: '700',
    marginBottom: '8px',
    color: '#1a1a2e',
  },
  titleDark: {
    color: '#e5e5e5',
  },
  lastUpdated: {
    color: '#888',
    marginBottom: '48px',
    fontSize: '14px',
  },
  section: {
    marginBottom: '40px',
  },
  heading: {
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#1a1a2e',
  },
  headingDark: {
    color: '#e5e5e5',
  },
  paragraph: {
    color: '#555',
    marginBottom: '16px',
  },
  paragraphDark: {
    color: '#b0b0b0',
  },
  list: {
    color: '#555',
    marginLeft: '24px',
    marginBottom: '16px',
  },
  listDark: {
    color: '#b0b0b0',
  },
  footer: {
    padding: '32px 40px',
    background: '#1a1a2e',
    color: '#888',
    textAlign: 'center',
  },
  footerDark: {
    background: '#0a0a0a',
    borderTop: '1px solid #222',
  },
  footerLinks: {
    marginTop: '16px',
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
  },
  footerLink: {
    color: '#888',
    textDecoration: 'none',
    fontSize: '14px',
  },
}
