import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function GET(request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Get the user's stripe customer ID from their sites
  const { data: sites } = await supabase
    .from('generated_sites')
    .select('stripe_customer_id')
    .eq('email', user.email)
    .eq('payment_status', 'paid')
    .not('stripe_customer_id', 'is', null)
    .limit(1)

  if (!sites || sites.length === 0 || !sites[0].stripe_customer_id) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 404 })
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: sites[0].stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://speakyour.site'}/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe portal error:', error)
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 })
  }
}
