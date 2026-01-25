import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function GET(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
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
    // No Stripe customer found - redirect back to billing with error
    return NextResponse.redirect(new URL('/billing?error=no_customer', request.url))
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: sites[0].stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://speakyour.site'}/billing`,
    })

    return NextResponse.redirect(session.url)
  } catch (error) {
    console.error('Stripe portal error:', error)
    return NextResponse.redirect(new URL('/billing?error=portal_failed', request.url))
  }
}
