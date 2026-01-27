import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

// Admin client for operations that need to bypass RLS
function getSupabaseAdmin() {
  return createSupabaseClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function DELETE(request, { params }) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use admin client to get and delete the site (bypasses RLS)
  const adminSupabase = getSupabaseAdmin()

  // Get the site
  const { data: site, error: fetchError } = await adminSupabase
    .from('generated_sites')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !site) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 })
  }

  // Verify ownership (by email or user_id)
  const isOwner = site.email === user.email || site.user_id === user.id
  if (!isOwner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Check if this is a draft site (never claimed/paid)
  const isDraft = site.payment_status !== 'paid'

  if (isDraft) {
    // Hard delete for draft sites - they were never claimed
    const { error: deleteError } = await adminSupabase
      .from('generated_sites')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete site: ' + deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, hardDelete: true })
  }

  // For claimed sites: If site has an active subscription, cancel it first
  if (site.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(site.stripe_subscription_id)
    } catch (stripeError) {
      console.error('Stripe cancellation error:', stripeError)
      // Continue with deletion even if Stripe fails
    }
  }

  // Soft delete for claimed sites - we keep the record but remove subdomain
  const { error: updateError } = await adminSupabase
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

  return NextResponse.json({ success: true, hardDelete: false })
}
