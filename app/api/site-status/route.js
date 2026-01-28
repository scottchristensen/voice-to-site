import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const body = await request.json()

    let siteId
    let toolCallId = null
    let isVapiRequest = false

    // Check for VAPI tool call format
    if (body.message?.toolCallList?.[0]) {
      const toolCall = body.message.toolCallList[0]
      toolCallId = toolCall.id
      const args = toolCall.function?.arguments || toolCall.arguments
      const parsed = typeof args === 'string' ? JSON.parse(args) : args
      siteId = parsed.siteId
      isVapiRequest = true
    } else if (body.message?.toolCalls?.[0]) {
      const toolCall = body.message.toolCalls[0]
      toolCallId = toolCall.id
      const args = toolCall.function?.arguments || toolCall.arguments
      const parsed = typeof args === 'string' ? JSON.parse(args) : args
      siteId = parsed.siteId
      isVapiRequest = true
    } else {
      siteId = body.siteId
    }

    if (!siteId) {
      const errorResult = { error: 'siteId is required' }
      if (isVapiRequest) {
        return Response.json({
          results: [{
            toolCallId: toolCallId || 'unknown',
            result: JSON.stringify(errorResult)
          }]
        })
      }
      return Response.json(errorResult, { status: 400 })
    }

    // Initialize Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    )

    // Fetch site details
    const { data: site, error } = await supabase
      .from('generated_sites')
      .select(`
        id,
        business_name,
        subdomain,
        status,
        created_at,
        claimed_at,
        owner_email,
        industry,
        owner_language
      `)
      .eq('id', siteId)
      .single()

    if (error || !site) {
      const errorResult = { error: 'Site not found' }
      if (isVapiRequest) {
        return Response.json({
          results: [{
            toolCallId,
            result: JSON.stringify(errorResult)
          }]
        })
      }
      return Response.json(errorResult, { status: 404 })
    }

    // Build status description
    const statusDescriptions = {
      preview: 'Your site is ready for preview but has not been claimed yet.',
      claimed: 'Your site has been claimed and is live!',
      published: 'Your site is published and accessible to everyone.',
      expired: 'Your site preview has expired. Please create a new one.'
    }

    // Calculate time since creation
    const createdAt = new Date(site.created_at)
    const now = new Date()
    const hoursSinceCreation = Math.floor((now - createdAt) / (1000 * 60 * 60))

    // Build preview URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://speakyour.site'
    const previewUrl = `${baseUrl}/preview/${site.id}`
    const liveUrl = site.subdomain ? `https://${site.subdomain}.speakyour.site` : null

    const result = {
      businessName: site.business_name,
      industry: site.industry,
      status: site.status,
      statusDescription: statusDescriptions[site.status] || 'Status unknown',
      previewUrl,
      liveUrl,
      isClaimed: !!site.claimed_at,
      createdAt: site.created_at,
      hoursSinceCreation,
      language: site.owner_language || 'en'
    }

    // For VAPI, format as a friendly spoken response
    if (isVapiRequest) {
      let spokenStatus = `Your site for ${site.business_name} `

      if (site.status === 'preview') {
        spokenStatus += `is ready for preview. It was created ${hoursSinceCreation} hours ago. `
        spokenStatus += `You can view it at ${previewUrl}. `
        spokenStatus += `Remember, preview sites expire after 24 hours unless claimed.`
      } else if (site.status === 'claimed' || site.status === 'published') {
        spokenStatus += `is live and published! `
        if (site.subdomain) {
          spokenStatus += `Your site is accessible at ${site.subdomain}.speakyour.site. `
        }
      } else if (site.status === 'expired') {
        spokenStatus += `preview has expired. You'll need to create a new site.`
      }

      return Response.json({
        results: [{
          toolCallId,
          result: spokenStatus
        }]
      })
    }

    return Response.json(result)

  } catch (error) {
    console.error('Site status error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
