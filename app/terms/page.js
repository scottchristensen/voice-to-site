'use client'

import { useState, useEffect } from 'react'

export default function TermsOfService() {
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
          <h1 style={{...styles.title, ...(isDarkMode && styles.titleDark)}}>Terms of Service</h1>
          <p style={styles.lastUpdated}>Last updated: January 27, 2025</p>

          <section style={styles.section}>
            <h2 style={{...styles.heading, ...(isDarkMode && styles.headingDark)}}>1. Agreement to Terms</h2>
            <p style={{...styles.paragraph, ...(isDarkMode && styles.paragraphDark)}}>
              By accessing or using SpeakYour.Site ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, you do not have permission to access the Service.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={{...styles.heading, ...(isDarkMode && styles.headingDark)}}>2. Description of Service</h2>
            <p style={{...styles.paragraph, ...(isDarkMode && styles.paragraphDark)}}>
              SpeakYour.Site is a platform that enables users to create professional websites using voice input and artificial intelligence. Our Service includes website generation, hosting, and related tools for business owners and individuals.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={{...styles.heading, ...(isDarkMode && styles.headingDark)}}>3. User Accounts</h2>
            <p style={{...styles.paragraph, ...(isDarkMode && styles.paragraphDark)}}>
              When you create an account with us, you must provide accurate, complete, and current information. You are responsible for safeguarding your password and for all activities that occur under your account. You must notify us immediately of any unauthorized access or use of your account.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={{...styles.heading, ...(isDarkMode && styles.headingDark)}}>4. Subscriptions and Payments</h2>
            <p style={{...styles.paragraph, ...(isDarkMode && styles.paragraphDark)}}>
              Some parts of the Service are billed on a subscription basis. You will be billed in advance on a recurring monthly basis. Subscription fees are non-refundable except as required by law or as explicitly stated in these Terms.
            </p>
            <ul style={{...styles.list, ...(isDarkMode && styles.listDark)}}>
              <li><strong>Basic Plan:</strong> $9/month - Hosting, subdomain, forms, email notifications</li>
              <li><strong>Pro Plan:</strong> $29/month - Everything in Basic plus unlimited AI edits</li>
              <li><strong>Premium Plan:</strong> $59/month - Everything in Pro plus designer-reviewed edits</li>
            </ul>
            <p style={{...styles.paragraph, ...(isDarkMode && styles.paragraphDark)}}>
              You may cancel your subscription at any time. Cancellation will take effect at the end of the current billing period.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={{...styles.heading, ...(isDarkMode && styles.headingDark)}}>5. Acceptable Use</h2>
            <p style={{...styles.paragraph, ...(isDarkMode && styles.paragraphDark)}}>
              You agree not to use the Service to:
            </p>
            <ul style={{...styles.list, ...(isDarkMode && styles.listDark)}}>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon the rights of others</li>
              <li>Distribute malware, spam, or harmful content</li>
              <li>Create websites promoting illegal activities</li>
              <li>Impersonate others or provide false information</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Attempt to gain unauthorized access to systems</li>
              <li>Create websites containing adult content, hate speech, or violence</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={{...styles.heading, ...(isDarkMode && styles.headingDark)}}>6. Intellectual Property</h2>
            <p style={{...styles.paragraph, ...(isDarkMode && styles.paragraphDark)}}>
              <strong>Your Content:</strong> You retain ownership of any content you provide to create your website. By using our Service, you grant us a license to use, host, and display your content as necessary to provide the Service.
            </p>
            <p style={{...styles.paragraph, ...(isDarkMode && styles.paragraphDark)}}>
              <strong>Our Service:</strong> The Service, including its original content, features, and functionality, is owned by SpeakYour.Site and is protected by copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={{...styles.heading, ...(isDarkMode && styles.headingDark)}}>7. AI-Generated Content</h2>
            <p style={{...styles.paragraph, ...(isDarkMode && styles.paragraphDark)}}>
              Websites and content generated through our Service use artificial intelligence. While we strive for accuracy, AI-generated content may contain errors or inaccuracies. You are responsible for reviewing and editing your website content before publishing.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={{...styles.heading, ...(isDarkMode && styles.headingDark)}}>8. Website Hosting</h2>
            <p style={{...styles.paragraph, ...(isDarkMode && styles.paragraphDark)}}>
              Websites created through our Service are hosted on subdomains of speakyour.site. We reserve the right to remove or suspend websites that violate these Terms. Unclaimed preview sites may be deleted after 24 hours.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={{...styles.heading, ...(isDarkMode && styles.headingDark)}}>9. Limitation of Liability</h2>
            <p style={{...styles.paragraph, ...(isDarkMode && styles.paragraphDark)}}>
              To the maximum extent permitted by law, SpeakYour.Site shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising from your use of the Service.
            </p>
            <p style={{...styles.paragraph, ...(isDarkMode && styles.paragraphDark)}}>
              Our total liability for any claims arising from the Service is limited to the amount you paid us in the 12 months preceding the claim.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={{...styles.heading, ...(isDarkMode && styles.headingDark)}}>10. Disclaimer of Warranties</h2>
            <p style={{...styles.paragraph, ...(isDarkMode && styles.paragraphDark)}}>
              The Service is provided "as is" and "as available" without warranties of any kind, whether express or implied. We do not warrant that the Service will be uninterrupted, secure, or error-free.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={{...styles.heading, ...(isDarkMode && styles.headingDark)}}>11. Indemnification</h2>
            <p style={{...styles.paragraph, ...(isDarkMode && styles.paragraphDark)}}>
              You agree to indemnify and hold harmless SpeakYour.Site and its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the Service or violation of these Terms.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={{...styles.heading, ...(isDarkMode && styles.headingDark)}}>12. Termination</h2>
            <p style={{...styles.paragraph, ...(isDarkMode && styles.paragraphDark)}}>
              We may terminate or suspend your account and access to the Service immediately, without prior notice, for any reason, including breach of these Terms. Upon termination, your right to use the Service will cease immediately.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={{...styles.heading, ...(isDarkMode && styles.headingDark)}}>13. Governing Law</h2>
            <p style={{...styles.paragraph, ...(isDarkMode && styles.paragraphDark)}}>
              These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law principles.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={{...styles.heading, ...(isDarkMode && styles.headingDark)}}>14. Changes to Terms</h2>
            <p style={{...styles.paragraph, ...(isDarkMode && styles.paragraphDark)}}>
              We reserve the right to modify these Terms at any time. We will notify users of material changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={{...styles.heading, ...(isDarkMode && styles.headingDark)}}>15. Contact Us</h2>
            <p style={{...styles.paragraph, ...(isDarkMode && styles.paragraphDark)}}>
              If you have any questions about these Terms, please contact us at:
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
