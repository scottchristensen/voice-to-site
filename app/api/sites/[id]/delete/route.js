import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function DELETE(request, { params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get the site
  const { data: site, error: fetchError } = await supabase
    .from('generated_sites')
    .select('*')
    .eq('id', id)
    .eq('email', user.email)
    .single()

  if (fetchError || !site) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 })
  }

  // If site has an active subscription, cancel it first
  if (site.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(site.stripe_subscription_id)
    } catch (stripeError) {
      console.error('Stripe cancellation error:', stripeError)
      // Continue with deletion even if Stripe fails
    }
  }

  // Update the site to mark as deleted (soft delete)
  // We keep the record but remove subdomain and mark as cancelled
  const { error: updateError } = await supabase
    .from('generated_sites')
    .update({
      subdomain: null,
      subscription_status: 'cancelled',
      payment_status: 'unpaid',
    })
    .eq('id', id)

  if (updateError) {
    console.error('Delete error:', updateError)
    return NextResponse.json({ error: 'Failed to delete site' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
