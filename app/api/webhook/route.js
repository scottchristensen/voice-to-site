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

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      await handleSuccessfulPayment(session)
      break
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object
      console.log('Subscription event:', event.type, subscription.id)
      break
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      console.log('Subscription canceled:', subscription.id)
      // TODO: Handle subscription cancellation (unpublish site?)
      break
    }
    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return Response.json({ received: true })
}

async function handleSuccessfulPayment(session) {
  const { siteId, productType, customSlug } = session.metadata

  console.log('Processing successful payment:', {
    siteId,
    productType,
    customSlug,
    email: session.customer_email,
  })

  if (!siteId) {
    console.error('No siteId in session metadata')
    return
  }

  // Build update data based on product type
  const updateData = {
    payment_status: 'paid',
    status: 'published',
    email: session.customer_email,
    claimed_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
  }

  // Handle custom slug if provided
  if (productType === 'custom_url' && customSlug) {
    // Check if slug is available
    const { data: existing } = await supabase
      .from('generated_sites')
      .select('id')
      .eq('slug', customSlug)
      .neq('id', siteId)
      .single()

    if (!existing) {
      updateData.slug = customSlug
      updateData.custom_slug = true
    } else {
      console.warn('Custom slug already taken, keeping original')
    }
  }

  // Update the site in database
  const { error } = await supabase
    .from('generated_sites')
    .update(updateData)
    .eq('id', siteId)

  if (error) {
    console.error('Failed to update site after payment:', error)
  } else {
    console.log('Site updated successfully after payment')

    // Send claimed confirmation email
    if (session.customer_email) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://voice-to-site.vercel.app'
        await fetch(`${baseUrl}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteId,
            email: session.customer_email,
            type: 'claimed'
          })
        })
        console.log('Claimed email sent to:', session.customer_email)
      } catch (emailError) {
        console.error('Failed to send claimed email:', emailError)
        // Don't fail the webhook if email fails
      }
    }
  }
}
