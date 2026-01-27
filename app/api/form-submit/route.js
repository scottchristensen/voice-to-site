import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

// CORS headers for cross-origin requests from subdomains
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// Handle OPTIONS preflight
export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders })
}

// Initialize Resend (or SES later for scale)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(request) {
  try {
    const body = await request.json()
    const { siteId, name, email, phone, message, formType = 'contact', additionalFields = {} } = body

    if (!siteId) {
      return Response.json({ error: 'Site ID is required' }, { status: 400, headers: corsHeaders })
    }

    // Parse siteId as number (database uses BIGINT)
    const siteIdNum = parseInt(siteId, 10)
    if (isNaN(siteIdNum)) {
      return Response.json({ error: 'Invalid site ID' }, { status: 400, headers: corsHeaders })
    }

    if (!email && !phone && !message) {
      return Response.json({ error: 'Please provide at least one contact method or message' }, { status: 400, headers: corsHeaders })
    }

    // Initialize Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    )

    // Verify the site exists and is paid
    const { data: site, error: siteError } = await supabase
      .from('generated_sites')
      .select('id, business_name, email, payment_status, subdomain, owner_language')
      .eq('id', siteIdNum)
      .single()

    if (siteError || !site) {
      console.error('Site lookup error:', siteError, 'siteId:', siteId)
      return Response.json({
        error: 'Site not found',
        details: siteError?.message || 'No site with this ID',
        siteId
      }, { status: 404, headers: corsHeaders })
    }

    if (site.payment_status !== 'paid') {
      return Response.json({ error: 'Site is not active' }, { status: 403, headers: corsHeaders })
    }

    // Store the submission
    const { data: submission, error: insertError } = await supabase
      .from('form_submissions')
      .insert({
        site_id: siteIdNum,
        form_type: formType,
        name: name || null,
        email: email || null,
        phone: phone || null,
        message: message || null,
        form_data: Object.keys(additionalFields).length > 0 ? additionalFields : null
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error storing submission:', insertError)
      return Response.json({ error: 'Failed to save submission' }, { status: 500, headers: corsHeaders })
    }

    // Send email notification to site owner
    let emailSent = false
    const ownerEmail = site.email
    const ownerLanguage = site.owner_language || 'en'
    if (ownerEmail && resend) {
      try {
        const emailSubject = ownerLanguage === 'es'
          ? `Nueva solicitud de ${formType === 'contact' ? 'contacto' : formType} para ${site.business_name || 'tu sitio'}`
          : `New ${formType} form submission for ${site.business_name || 'your site'}`

        await resend.emails.send({
          from: 'SpeakYour.Site <notifications@speakyour.site>',
          to: ownerEmail,
          subject: emailSubject,
          html: buildEmailHtml({
            businessName: site.business_name,
            subdomain: site.subdomain,
            formType,
            name,
            email,
            phone,
            message,
            additionalFields,
            language: ownerLanguage
          })
        })
        emailSent = true

        // Update the submission to mark email as sent
        await supabase
          .from('form_submissions')
          .update({ email_sent: true, email_sent_at: new Date().toISOString() })
          .eq('id', submission.id)

      } catch (emailError) {
        console.error('Error sending email:', emailError)
        // Don't fail the whole request if email fails - submission is still saved
      }
    }

    return Response.json({
      success: true,
      message: 'Form submitted successfully',
      emailSent
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Form submission error:', error)
    return Response.json({ error: 'Server error' }, { status: 500, headers: corsHeaders })
  }
}

function buildEmailHtml({ businessName, subdomain, formType, name, email, phone, message, additionalFields, language = 'en' }) {
  const siteUrl = subdomain ? `https://${subdomain}.speakyour.site` : null

  // Translations
  const t = {
    en: {
      newSubmission: `New ${formType} Submission`,
      yourWebsite: 'Your Website',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      message: 'Message',
      footer: 'This message was sent from your website hosted by'
    },
    es: {
      newSubmission: `Nueva Solicitud de ${formType === 'contact' ? 'Contacto' : formType}`,
      yourWebsite: 'Tu Sitio Web',
      name: 'Nombre',
      email: 'Correo Electrónico',
      phone: 'Teléfono',
      message: 'Mensaje',
      footer: 'Este mensaje fue enviado desde tu sitio web alojado por'
    }
  }

  const text = t[language] || t.en

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${text.newSubmission}</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">
          ${businessName || text.yourWebsite}${siteUrl ? ` - <a href="${siteUrl}" style="color: white;">${siteUrl}</a>` : ''}
        </p>
      </div>

      <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <table style="width: 100%; border-collapse: collapse;">
          ${name ? `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; width: 100px;">${text.name}</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${escapeHtml(name)}</td>
          </tr>` : ''}
          ${email ? `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${text.email}</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
              <a href="mailto:${escapeHtml(email)}" style="color: #667eea; font-weight: 500;">${escapeHtml(email)}</a>
            </td>
          </tr>` : ''}
          ${phone ? `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${text.phone}</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
              <a href="tel:${escapeHtml(phone)}" style="color: #667eea; font-weight: 500;">${escapeHtml(phone)}</a>
            </td>
          </tr>` : ''}
          ${Object.entries(additionalFields || {}).map(([key, value]) => `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${escapeHtml(key)}</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">${escapeHtml(String(value))}</td>
          </tr>`).join('')}
        </table>

        ${message ? `
        <div style="margin-top: 20px;">
          <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 14px;">${text.message}</p>
          <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; white-space: pre-wrap;">${escapeHtml(message)}</div>
        </div>` : ''}

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            ${text.footer} <a href="https://speakyour.site" style="color: #667eea;">SpeakYour.Site</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

function escapeHtml(text) {
  if (!text) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
