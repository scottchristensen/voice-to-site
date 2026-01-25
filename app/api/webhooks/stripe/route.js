import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

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
        const { site_id, subdomain, email, phone, plan_tier } = session.metadata

        if (!site_id || !subdomain) {
          console.error('Missing metadata in checkout session:', session.id)
          break
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
            claimed_at: new Date().toISOString()
          })
          .eq('id', site_id)

        if (error) {
          console.error('Failed to update site:', error)
        } else {
          console.log(`Site ${site_id} claimed with subdomain ${subdomain}, tier: ${plan_tier || 'pro'}`)
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
