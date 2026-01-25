import { createClient } from '@supabase/supabase-js'

export async function GET(request) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  )
  // Only allow requests from middleware
  const isMiddlewareRequest = request.headers.get('x-middleware-request') === 'true'
  if (!isMiddlewareRequest) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const subdomain = searchParams.get('subdomain')

  if (!subdomain) {
    return Response.json({ error: 'Subdomain required' }, { status: 400 })
  }

  const normalized = subdomain.toLowerCase().trim()

  const { data: site, error } = await supabase
    .from('generated_sites')
    .select('id, payment_status, subscription_status')
    .eq('subdomain', normalized)
    .single()

  if (error || !site) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  return Response.json({
    siteId: site.id,
    paymentStatus: site.payment_status,
    subscriptionStatus: site.subscription_status
  })
}
