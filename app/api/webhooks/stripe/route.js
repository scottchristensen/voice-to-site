import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// Lazy creation of admin client (only when needed at runtime)
function getSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function POST(request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  )

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const { site_id, subdomain, email, phone, plan_tier, account_token } = session.metadata

        if (!site_id || !subdomain) {
          console.error('Missing metadata in checkout session:', session.id)
          break
        }

        let userId = null
        const supabaseAdmin = getSupabaseAdmin()

        // Check if user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = existingUsers?.users?.find(u => u.email === email)

        if (existingUser) {
          userId = existingUser.id
        } else if (account_token) {
          // Create user account from pending account
          const { data: pendingAccount } = await supabase
            .from('pending_accounts')
            .select('*')
            .eq('token', account_token)
            .eq('email', email)
            .gt('expires_at', new Date().toISOString())
            .single()

          if (pendingAccount) {
            // Create the user with the stored password
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
              email,
              password: pendingAccount.password_hash,
              email_confirm: true
            })

            if (createError) {
              console.error('Failed to create user account:', createError)
            } else {
              userId = newUser.user.id
              console.log(`Created user account for ${email}`)

              // Clean up pending account
              await supabase
                .from('pending_accounts')
                .delete()
                .eq('token', account_token)
            }
          }
        }

        // Update site with claim information
        const { error } = await supabase
          .from('generated_sites')
          .update({
            subdomain: subdomain,
            email: email,
            phone: phone || null,
            payment_status: 'paid',
            subscription_status: 'active',
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            plan_tier: plan_tier || 'pro', // Default to pro for legacy checkouts
            claimed_at: new Date().toISOString(),
            user_id: userId
          })
          .eq('id', site_id)

        if (error) {
          console.error('Failed to update site:', error)
        } else {
          console.log(`Site ${site_id} claimed with subdomain ${subdomain}, tier: ${plan_tier || 'pro'}${userId ? `, user: ${userId}` : ''}`)

          // Send payment confirmation email
          if (resend && email) {
            try {
              const { data: siteData } = await supabase
                .from('generated_sites')
                .select('business_name')
                .eq('id', site_id)
                .single()

              await resend.emails.send({
                from: 'SpeakYour.Site <notifications@speakyour.site>',
                to: email,
                subject: `Your site is live! ${siteData?.business_name || ''}`.trim(),
                html: buildPaymentConfirmationEmail({
                  businessName: siteData?.business_name,
                  subdomain,
                  email
                })
              })
              console.log(`Payment confirmation email sent to ${email}`)
            } catch (emailError) {
              console.error('Failed to send confirmation email:', emailError)
            }
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object

        // Find site by subscription ID and update status
        const { error } = await supabase
          .from('generated_sites')
          .update({
            subscription_status: subscription.status
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('Failed to update subscription status:', error)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object

        // Mark site as cancelled
        const { error } = await supabase
          .from('generated_sites')
          .update({
            subscription_status: 'cancelled',
            payment_status: 'unpaid'
            // Keep subdomain reserved for potential reactivation
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('Failed to mark subscription as cancelled:', error)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object

        if (!invoice.subscription) break

        // Mark site as past_due
        const { error } = await supabase
          .from('generated_sites')
          .update({
            subscription_status: 'past_due'
          })
          .eq('stripe_subscription_id', invoice.subscription)

        if (error) {
          console.error('Failed to mark subscription as past_due:', error)
        }
        break
      }

      default:
        // Unhandled event type
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (error) {
    console.error('Error processing webhook:', error)
    return Response.json({ error: 'Webhook processing failed' }, { status: 500 })
  }

  return Response.json({ received: true })
}

function buildPaymentConfirmationEmail({ businessName, subdomain, email }) {
  const liveUrl = `https://${subdomain}.speakyour.site`
  const dashboardUrl = 'https://www.speakyour.site/dashboard'
  const createAnotherUrl = 'https://www.speakyour.site'

  // Social share URLs
  const twitterShare = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out my new website for ${businessName}!`)}&url=${encodeURIComponent(liveUrl)}`
  const facebookShare = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(liveUrl)}`
  const linkedinShare = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(liveUrl)}`

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 24px; text-align: center;">
          <div style="font-size: 64px; margin-bottom: 16px;">&#127881;</div>
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Your Site is Live!</h1>
        </div>

        <!-- Content -->
        <div style="padding: 32px 24px;">
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
            Congratulations! Your website for <strong>${businessName || 'your business'}</strong> is now live.
          </p>

          <!-- Live URL Box -->
          <a href="${liveUrl}" style="display: block; padding: 16px 24px; background: #f0f4f8; border-radius: 8px; color: #667eea; font-weight: 600; text-decoration: none; text-align: center; margin-bottom: 24px; word-break: break-all;">
            ${liveUrl}
          </a>

          <!-- Primary CTAs -->
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${liveUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 0 8px 12px 8px;">
              Visit Your Site
            </a>
            <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 28px; background: transparent; border: 2px solid #667eea; color: #667eea; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 0 8px 12px 8px;">
              Go to Dashboard
            </a>
          </div>

          <!-- Share Section -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-bottom: 24px;">
            <p style="color: #666; font-size: 14px; margin: 0 0 16px 0; text-align: center;">Share your new site</p>
            <div style="text-align: center;">
              <a href="${twitterShare}" style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background: #f0f4f8; border-radius: 50%; color: #667eea; text-decoration: none; margin: 0 6px;" title="Share on X">
                <span style="font-size: 18px;">𝕏</span>
              </a>
              <a href="${facebookShare}" style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background: #f0f4f8; border-radius: 50%; color: #667eea; text-decoration: none; margin: 0 6px;" title="Share on Facebook">
                <span style="font-size: 18px;">f</span>
              </a>
              <a href="${linkedinShare}" style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background: #f0f4f8; border-radius: 50%; color: #667eea; text-decoration: none; margin: 0 6px;" title="Share on LinkedIn">
                <span style="font-size: 18px;">in</span>
              </a>
            </div>
          </div>

          <!-- Create Another -->
          <div style="text-align: center; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            <a href="${createAnotherUrl}" style="color: #667eea; text-decoration: none; font-size: 14px;">
              Create Another Site
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            You're receiving this email because you claimed a site on <a href="https://speakyour.site" style="color: #667eea;">SpeakYour.Site</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
