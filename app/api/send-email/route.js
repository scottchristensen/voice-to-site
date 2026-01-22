import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

export async function POST(request) {
  try {
    const body = await request.json()
    const { siteId, email, type = 'preview' } = body

    if (!siteId || !email) {
      return Response.json({ error: 'Missing siteId or email' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return Response.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Fetch the site
    const { data: site, error: fetchError } = await supabase
      .from('generated_sites')
      .select('*')
      .eq('id', siteId)
      .single()

    if (fetchError || !site) {
      return Response.json({ error: 'Site not found' }, { status: 404 })
    }

    // Update site with email
    await supabase
      .from('generated_sites')
      .update({ email })
      .eq('id', siteId)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://voice-to-site.vercel.app'
    const previewUrl = `${baseUrl}/preview/${siteId}`
    const publishedUrl = site.slug ? `${baseUrl}/s/${site.slug}` : null

    // Build email based on type
    let subject, html

    if (type === 'preview') {
      subject = `Your website for ${site.business_name || 'your business'} is ready!`
      html = buildPreviewEmail(site, previewUrl, baseUrl)
    } else if (type === 'reminder') {
      subject = `Only 4 hours left to claim ${site.business_name || 'your website'}!`
      html = buildReminderEmail(site, previewUrl, baseUrl)
    } else if (type === 'claimed') {
      subject = `${site.business_name || 'Your website'} is now live!`
      html = buildClaimedEmail(site, publishedUrl, baseUrl)
    } else {
      subject = `Your Speak Your Site update`
      html = buildPreviewEmail(site, previewUrl, baseUrl)
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'Speak Your Site <noreply@speakyour.site>',
      to: email,
      subject,
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      // Don't fail the request if email fails - just log it
      return Response.json({
        success: true,
        emailSent: false,
        previewUrl,
        error: error.message
      })
    }

    console.log('Email sent:', data?.id)

    return Response.json({
      success: true,
      emailSent: true,
      emailId: data?.id,
      previewUrl,
    })

  } catch (error) {
    console.error('Send email error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// Email template for preview
function buildPreviewEmail(site, previewUrl, baseUrl) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                Your Website is Ready!
              </h1>
              <p style="margin: 12px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                ${site.business_name || 'Your new site'} is waiting for you
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px; color: #333; font-size: 16px; line-height: 1.6;">
                Great news! Sarah has finished creating your website. Click below to see your personalized marketing site.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 16px 0 32px;">
                    <a href="${previewUrl}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 18px;">
                      View Your Website
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Preview expiry notice -->
              <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.5;">
                  <strong style="color: #333;">Preview expires in 24 hours</strong><br>
                  Claim your site to keep it permanently and get a shareable link.
                </p>
              </div>

              <!-- What's next -->
              <h3 style="margin: 0 0 16px; color: #333; font-size: 18px;">What's next?</h3>
              <ul style="margin: 0 0 24px; padding: 0 0 0 20px; color: #555; line-height: 1.8;">
                <li>Preview your site and make sure you love it</li>
                <li>Claim it for free to get a permanent link</li>
                <li>Upgrade for a custom URL or premium features</li>
              </ul>

              <!-- Link fallback -->
              <p style="margin: 0; color: #888; font-size: 13px;">
                Can't click the button? Copy this link:<br>
                <a href="${previewUrl}" style="color: #667eea; word-break: break-all;">${previewUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background: #f8f9fa; border-top: 1px solid #eee;">
              <p style="margin: 0; color: #888; font-size: 13px; text-align: center;">
                Built with <a href="${baseUrl}" style="color: #667eea; text-decoration: none;">Speak Your Site</a> - Create websites just by talking
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

// Email template for expiring soon reminder
function buildReminderEmail(site, previewUrl, baseUrl) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 40px 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 12px;">⏰</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                Time is Running Out!
              </h1>
              <p style="margin: 12px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                Only 4 hours left to claim your site
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px; color: #333; font-size: 16px; line-height: 1.6;">
                Your website for <strong>${site.business_name || 'your business'}</strong> is about to expire! Don't lose all the work Sarah put into creating it for you.
              </p>

              <!-- Urgency Box -->
              <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
                <p style="margin: 0; color: #92400e; font-size: 16px; font-weight: 600;">
                  Your preview expires in approximately 4 hours
                </p>
              </div>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 32px;">
                    <a href="${previewUrl}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 18px;">
                      Claim Your Site Now
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Benefits reminder -->
              <h3 style="margin: 0 0 16px; color: #333; font-size: 18px;">Why claim your site?</h3>
              <ul style="margin: 0 0 24px; padding: 0 0 0 20px; color: #555; line-height: 1.8;">
                <li>Get a permanent, shareable link</li>
                <li>Keep your AI-generated website forever</li>
                <li>Upgrade to a custom URL anytime</li>
              </ul>

              <!-- Link fallback -->
              <p style="margin: 0; color: #888; font-size: 13px;">
                Can't click the button? Copy this link:<br>
                <a href="${previewUrl}" style="color: #667eea; word-break: break-all;">${previewUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background: #f8f9fa; border-top: 1px solid #eee;">
              <p style="margin: 0; color: #888; font-size: 13px; text-align: center;">
                Built with <a href="${baseUrl}" style="color: #667eea; text-decoration: none;">Speak Your Site</a> - Create websites just by talking
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

// Email template for claimed/published site
function buildClaimedEmail(site, publishedUrl, baseUrl) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 40px 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 12px;">🎉</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                Your Site is Live!
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px; color: #333; font-size: 16px; line-height: 1.6;">
                Congratulations! <strong>${site.business_name || 'Your website'}</strong> is now published and ready to share with the world.
              </p>

              <!-- Live URL Box -->
              <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
                <p style="margin: 0 0 8px; color: #166534; font-size: 14px; font-weight: 500;">Your site is live at:</p>
                <a href="${publishedUrl}" style="color: #166534; font-size: 16px; font-weight: 600; word-break: break-all;">${publishedUrl}</a>
              </div>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 32px;">
                    <a href="${publishedUrl}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 18px;">
                      Visit Your Site
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Share tips -->
              <h3 style="margin: 0 0 16px; color: #333; font-size: 18px;">Share your site</h3>
              <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6;">
                Copy your link and share it on social media, add it to your email signature, or print it on business cards!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background: #f8f9fa; border-top: 1px solid #eee;">
              <p style="margin: 0; color: #888; font-size: 13px; text-align: center;">
                Built with <a href="${baseUrl}" style="color: #667eea; text-decoration: none;">Speak Your Site</a> - Create websites just by talking
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}
