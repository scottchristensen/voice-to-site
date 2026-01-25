import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const PLAN_PRICES = {
  starter: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter',
  standard: process.env.STRIPE_STANDARD_PRICE_ID || 'price_standard',
  premium: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium',
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { siteId, newPlan } = body

    if (!siteId || !newPlan) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    if (!PLAN_PRICES[newPlan]) {
      return NextResponse.json({ success: false, error: 'Invalid plan' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    )

    // Get the site and its subscription
    const { data: site, error: siteError } = await supabase
      .from('generated_sites')
      .select('*')
      .eq('id', siteId)
      .single()

    if (siteError || !site) {
      return NextResponse.json({ success: false, error: 'Site not found' }, { status: 404 })
    }

    // If the site has an existing Stripe subscription, update it
    if (site.stripe_subscription_id) {
      try {
        const subscription = await stripe.subscriptions.retrieve(site.stripe_subscription_id)

        // Update the subscription with the new price
        await stripe.subscriptions.update(site.stripe_subscription_id, {
          items: [{
            id: subscription.items.data[0].id,
            price: PLAN_PRICES[newPlan],
          }],
          proration_behavior: 'create_prorations',
        })

        // Update the plan type in the database
        await supabase
          .from('generated_sites')
          .update({ plan_type: newPlan })
          .eq('id', siteId)

        return NextResponse.json({ success: true })
      } catch (stripeError) {
        console.error('Stripe error:', stripeError)
        return NextResponse.json({ success: false, error: 'Failed to update subscription' }, { status: 500 })
      }
    }

    // If no existing subscription, create a checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: PLAN_PRICES[newPlan],
        quantity: 1,
      }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?plan_updated=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
      metadata: {
        siteId,
        plan: newPlan,
      },
    })

    return NextResponse.json({ checkoutUrl: session.url })
  } catch (error) {
    console.error('Change plan error:', error)
    return NextResponse.json({ success: false, error: 'Failed to change plan' }, { status: 500 })
  }
}
