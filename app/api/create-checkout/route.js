import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

// Tier pricing configuration
const TIER_CONFIG = {
  basic: {
    name: 'Basic',
    price: 900, // $9/mo
    description: 'Hosting, subdomain, forms & email notifications'
  },
  pro: {
    name: 'Pro',
    price: 2900, // $29/mo
    description: 'Everything in Basic + unlimited AI edits'
  },
  premium: {
    name: 'Premium',
    price: 5900, // $59/mo
    description: 'Everything in Pro + 3 designer-reviewed edits/month'
  }
}

export async function POST(request) {
  try {
    const { siteId, subdomain, email, phone, tier = 'pro' } = await request.json()

    // Validate required fields
    if (!siteId || !subdomain || !email) {
      return Response.json(
        { error: 'Missing required fields: siteId, subdomain, email' },
        { status: 400 }
      )
    }

    // Validate tier
    if (!TIER_CONFIG[tier]) {
      return Response.json(
        { error: 'Invalid tier. Must be basic, pro, or premium' },
        { status: 400 }
      )
    }

    const tierConfig = TIER_CONFIG[tier]

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return Response.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Normalize subdomain
    const normalizedSubdomain = subdomain.toLowerCase().trim()

    // Verify site exists and hasn't been claimed
    const { data: site, error: siteError } = await supabase
      .from('generated_sites')
      .select('id, business_name, payment_status, subdomain')
      .eq('id', siteId)
      .single()

    if (siteError || !site) {
      return Response.json({ error: 'Site not found' }, { status: 404 })
    }

    if (site.payment_status === 'paid') {
      return Response.json({ error: 'Site has already been claimed' }, { status: 400 })
    }

    // Check subdomain availability (exclude current site in case they're reclaiming)
    const { data: existing } = await supabase
      .from('generated_sites')
      .select('id')
      .eq('subdomain', normalizedSubdomain)
      .neq('id', siteId)
      .single()

    if (existing) {
      return Response.json({ error: 'Subdomain is already taken' }, { status: 400 })
    }

    // Create or retrieve Stripe customer
    let customer
    const existingCustomers = await stripe.customers.list({ email, limit: 1 })

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
      // Update phone if provided
      if (phone) {
        customer = await stripe.customers.update(customer.id, { phone })
      }
    } else {
      customer = await stripe.customers.create({
        email,
        phone: phone || undefined,
        metadata: {
          site_id: siteId,
          subdomain: normalizedSubdomain
        }
      })
    }

    // Create Stripe Checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${tierConfig.name} Plan - ${site.business_name || 'Your Site'}`,
              description: `${tierConfig.description} • ${normalizedSubdomain}.speakyour.site`
            },
            unit_amount: tierConfig.price,
            recurring: {
              interval: 'month'
            }
          },
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/claim-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/preview/${siteId}?cancelled=true`,
      metadata: {
        site_id: siteId,
        subdomain: normalizedSubdomain,
        email,
        phone: phone || '',
        plan_tier: tier
      }
    })

    return Response.json({
      checkoutUrl: session.url,
      sessionId: session.id
    })

  } catch (error) {
    console.error('Checkout error:', error)
    return Response.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
