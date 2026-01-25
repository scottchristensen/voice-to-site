import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export async function GET(request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  )
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')

  if (!sessionId) {
    return Response.json({ error: 'Session ID required' }, { status: 400 })
  }

  try {
    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (!session.metadata?.site_id) {
      return Response.json({ error: 'Invalid session' }, { status: 400 })
    }

    const { site_id, subdomain, email } = session.metadata

    // Get the site details from database
    const { data: site, error } = await supabase
      .from('generated_sites')
      .select('business_name, subdomain')
      .eq('id', site_id)
      .single()

    if (error || !site) {
      return Response.json({ error: 'Site not found' }, { status: 404 })
    }

    return Response.json({
      businessName: site.business_name,
      subdomain: site.subdomain || subdomain,
      email: email
    })

  } catch (error) {
    console.error('Verify session error:', error)
    return Response.json({ error: 'Failed to verify session' }, { status: 500 })
  }
}
