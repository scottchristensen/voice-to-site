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

  // Get customerId from query params
  const { searchParams } = new URL(request.url)
  const customerId = searchParams.get('customerId')

  if (!customerId) {
    return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
  }

  // Verify the user owns a site with this customer ID
  const { data: sites } = await supabase
    .from('generated_sites')
    .select('stripe_customer_id')
    .eq('email', user.email)
    .eq('stripe_customer_id', customerId)
    .limit(1)

  if (!sites || sites.length === 0) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://speakyour.site'}/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe portal error:', error)
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 })
  }
}
