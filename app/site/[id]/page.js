import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const { id } = await params

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  )

  const { data: site } = await supabase
    .from('generated_sites')
    .select('business_name, industry')
    .eq('id', id)
    .single()

  return {
    title: site?.business_name || 'Website',
    description: site?.industry ? `${site.business_name} - ${site.industry}` : site?.business_name
  }
}

export default async function SitePage({ params, searchParams }) {
  const { id } = await params
  const resolvedSearchParams = await searchParams
  const lang = resolvedSearchParams?.lang || 'en'

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  )

  const { data: site, error } = await supabase
    .from('generated_sites')
    .select('html_code, html_code_es, business_name, subdomain, payment_status, subscription_status')
    .eq('id', id)
    .single()

  // If site not found or not paid, show error
  if (error || !site) {
    return (
      <html>
        <head>
          <title>Site Not Found</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body style={styles.errorBody}>
          <div style={styles.errorContainer}>
            <h1 style={styles.errorTitle}>Site Not Found</h1>
            <p style={styles.errorText}>This website doesn&apos;t exist or has been removed.</p>
            <a href="https://speakyour.site" style={styles.errorLink}>
              Create Your Own Site
            </a>
          </div>
        </body>
      </html>
    )
  }

  // If subscription is not active, show subscription expired message
  if (site.payment_status !== 'paid' || (site.subscription_status && site.subscription_status !== 'active')) {
    return (
      <html>
        <head>
          <title>Site Unavailable</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body style={styles.errorBody}>
          <div style={styles.errorContainer}>
            <h1 style={styles.errorTitle}>Site Unavailable</h1>
            <p style={styles.errorText}>This website&apos;s subscription has expired.</p>
            <a href="https://speakyour.site" style={styles.errorLink}>
              Create Your Own Site
            </a>
          </div>
        </body>
      </html>
    )
  }

  // Form handling script to inject
  const formHandlerScript = `
    (function() {
      const SITE_ID = '${id}';
      const API_URL = 'https://www.speakyour.site/api/form-submit';

      // Find all forms on the page
      document.addEventListener('DOMContentLoaded', function() {
        const forms = document.querySelectorAll('form');

        forms.forEach(function(form) {
          form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(form);
            const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
            const originalText = submitBtn ? submitBtn.textContent || submitBtn.value : '';

            // Show loading state
            if (submitBtn) {
              submitBtn.disabled = true;
              if (submitBtn.tagName === 'BUTTON') {
                submitBtn.textContent = 'Sending...';
              } else {
                submitBtn.value = 'Sending...';
              }
            }

            // Extract common form fields
            const data = {
              siteId: SITE_ID,
              name: formData.get('name') || formData.get('full_name') || formData.get('fullname') || '',
              email: formData.get('email') || formData.get('e-mail') || '',
              phone: formData.get('phone') || formData.get('tel') || formData.get('telephone') || '',
              message: formData.get('message') || formData.get('comments') || formData.get('inquiry') || '',
              formType: form.getAttribute('data-form-type') || 'contact',
              additionalFields: {}
            };

            // Capture any additional fields
            for (const [key, value] of formData.entries()) {
              if (!['name', 'full_name', 'fullname', 'email', 'e-mail', 'phone', 'tel', 'telephone', 'message', 'comments', 'inquiry'].includes(key)) {
                data.additionalFields[key] = value;
              }
            }

            try {
              const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              });

              const result = await response.json();

              if (response.ok) {
                // Show success message
                const successMsg = document.createElement('div');
                successMsg.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#10b981;color:white;padding:16px 24px;border-radius:8px;font-family:system-ui;font-weight:500;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15);';
                successMsg.textContent = 'Thank you! Your message has been sent.';
                document.body.appendChild(successMsg);
                setTimeout(() => successMsg.remove(), 5000);
                form.reset();
              } else {
                throw new Error(result.error || 'Failed to send');
              }
            } catch (err) {
              const errorMsg = document.createElement('div');
              errorMsg.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#ef4444;color:white;padding:16px 24px;border-radius:8px;font-family:system-ui;font-weight:500;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15);';
              errorMsg.textContent = 'Sorry, there was an error. Please try again.';
              document.body.appendChild(errorMsg);
              setTimeout(() => errorMsg.remove(), 5000);
            } finally {
              // Restore button state
              if (submitBtn) {
                submitBtn.disabled = false;
                if (submitBtn.tagName === 'BUTTON') {
                  submitBtn.textContent = originalText;
                } else {
                  submitBtn.value = originalText;
                }
              }
            }
          });
        });

        // Add Enter key support for form inputs (in case forms lack submit buttons)
        const inputs = document.querySelectorAll('form input, form textarea');
        inputs.forEach(function(input) {
          input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey && input.tagName !== 'TEXTAREA') {
              e.preventDefault();
              const form = input.closest('form');
              if (form) {
                form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
              }
            }
          });
        });
      });
    })();
  `;

  // Select the appropriate HTML based on language
  const htmlContent = lang === 'es' && site.html_code_es
    ? site.html_code_es
    : site.html_code

  // Render the site's HTML directly with form handler
  return (
    <html>
      <head>
        <title>{site.business_name || 'Website'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="generator" content="SpeakYour.Site" />
        <script dangerouslySetInnerHTML={{ __html: formHandlerScript }} />
      </head>
      <body
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        style={{ margin: 0, padding: 0 }}
      />
    </html>
  )
}

const styles = {
  errorBody: {
    margin: 0,
    padding: 0,
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  errorContainer: {
    textAlign: 'center',
    padding: '40px',
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)',
    maxWidth: '400px'
  },
  errorTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: '12px'
  },
  errorText: {
    color: '#666',
    marginBottom: '24px',
    lineHeight: '1.6'
  },
  errorLink: {
    display: 'inline-block',
    padding: '14px 28px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: '600'
  }
}
