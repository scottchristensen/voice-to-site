import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

// Lazy creation of admin client (only when needed at runtime)
function getSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function POST(request) {
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
        const { site_id, subdomain, email, phone, account_token } = session.metadata

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
            claimed_at: new Date().toISOString(),
            user_id: userId
          })
          .eq('id', site_id)

        if (error) {
          console.error('Failed to update site:', error)
        } else {
          console.log(`Site ${site_id} claimed with subdomain ${subdomain}${userId ? ` by user ${userId}` : ''}`)
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
