import { getResend, getSupabase } from '../../_lib/clients'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const supabase = getSupabase()
  const resend = getResend()

  // Verify cron secret in production (Vercel sets this header)
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Find sites that:
    // - Were created 19-20 hours ago (4-5 hours before 24h expiry)
    // - Are not claimed/published
    // - Haven't received a reminder email yet
    const now = new Date()
    const twentyHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000)
    const nineteenHoursAgo = new Date(now.getTime() - 19 * 60 * 60 * 1000)

    const { data: sites, error } = await supabase
      .from('generated_sites')
      .select('*')
      .gte('created_at', twentyHoursAgo.toISOString())
      .lte('created_at', nineteenHoursAgo.toISOString())
      .neq('status', 'published')
      .neq('payment_status', 'paid')
      .is('reminder_sent_at', null)
      .not('email', 'is', null)

    if (error) {
      console.error('Error querying sites:', error)
      return Response.json({ error: 'Database error' }, { status: 500 })
    }

    console.log(`Found ${sites?.length || 0} sites needing reminders`)

    const results = []
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://voice-to-site.vercel.app'

    for (const site of sites || []) {
      try {
        const previewUrl = `${baseUrl}/preview/${site.id}`

        // Send reminder email
        const { data, error: emailError } = await resend.emails.send({
          from: 'Speak Your Site <noreply@speakyour.site>',
          to: site.email,
          subject: `Only 4 hours left to claim ${site.business_name || 'your website'}!`,
          html: buildReminderEmailHtml(site, previewUrl, baseUrl),
        })

        if (emailError) {
          console.error(`Failed to send reminder to ${site.email}:`, emailError)
          results.push({ siteId: site.id, success: false, error: emailError.message })
        } else {
          // Update reminder_sent_at
          await supabase
            .from('generated_sites')
            .update({ reminder_sent_at: new Date().toISOString() })
            .eq('id', site.id)

          console.log(`Reminder sent to ${site.email} for site ${site.id}`)
          results.push({ siteId: site.id, success: true, emailId: data?.id })
        }
      } catch (err) {
        console.error(`Error processing site ${site.id}:`, err)
        results.push({ siteId: site.id, success: false, error: err.message })
      }
    }

    return Response.json({
      success: true,
      processed: results.length,
      results
    })

  } catch (error) {
    console.error('Cron error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

function buildReminderEmailHtml(site, previewUrl, baseUrl) {
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
