import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

export async function POST(request) {
  try {
    const body = await request.json()
    const { siteId, email, customSlug, claimType } = body

    if (!siteId || !email) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return Response.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Fetch the current site
    const { data: site, error: fetchError } = await supabase
      .from('generated_sites')
      .select('*')
      .eq('id', siteId)
      .single()

    if (fetchError || !site) {
      return Response.json({ error: 'Site not found' }, { status: 404 })
    }

    // Check if already claimed
    if (site.payment_status === 'paid') {
      return Response.json({ error: 'Site already claimed' }, { status: 400 })
    }

    // Prepare update data
    const updateData = {
      email,
      status: 'published',
      payment_status: claimType === 'custom' ? 'paid' : 'free',
      claimed_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
    }

    // Handle custom slug if provided
    if (claimType === 'custom' && customSlug) {
      // Validate custom slug format
      const slugRegex = /^[a-z0-9-]+$/
      if (!slugRegex.test(customSlug) || customSlug.length < 3 || customSlug.length > 30) {
        return Response.json({
          error: 'Invalid slug. Use 3-30 lowercase letters, numbers, and hyphens only.'
        }, { status: 400 })
      }

      // Check if custom slug is available
      const { data: existing } = await supabase
        .from('generated_sites')
        .select('id')
        .eq('slug', customSlug)
        .neq('id', siteId)
        .single()

      if (existing) {
        return Response.json({ error: 'This URL is already taken' }, { status: 400 })
      }

      updateData.slug = customSlug
      updateData.custom_slug = true
    }

    // Update the site
    const { data: updatedSite, error: updateError } = await supabase
      .from('generated_sites')
      .update(updateData)
      .eq('id', siteId)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return Response.json({ error: 'Failed to claim site' }, { status: 500 })
    }

    // Build the published URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://voice-to-site.vercel.app'
    const publishedUrl = `${baseUrl}/s/${updatedSite.slug}`

    // Send claimed confirmation email
    try {
      await fetch(`${baseUrl}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          email,
          type: 'claimed'
        })
      })
      console.log('Claimed email sent to:', email)
    } catch (emailError) {
      console.error('Failed to send claimed email:', emailError)
      // Don't fail the claim if email fails
    }

    console.log(`Site claimed! ID: ${siteId}, Email: ${email}, URL: ${publishedUrl}`)

    return Response.json({
      success: true,
      publishedUrl,
      slug: updatedSite.slug,
    })

  } catch (error) {
    console.error('Claim error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
