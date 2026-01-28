import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const body = await request.json()

    let siteId, credential
    let toolCallId = null
    let isVapiRequest = false

    // Check for VAPI tool call format
    if (body.message?.toolCallList?.[0]) {
      const toolCall = body.message.toolCallList[0]
      toolCallId = toolCall.id
      const args = toolCall.function?.arguments || toolCall.arguments
      const parsed = typeof args === 'string' ? JSON.parse(args) : args
      siteId = parsed.siteId
      credential = parsed.credential || parsed.pin || parsed.passphrase
      isVapiRequest = true
    } else if (body.message?.toolCalls?.[0]) {
      const toolCall = body.message.toolCalls[0]
      toolCallId = toolCall.id
      const args = toolCall.function?.arguments || toolCall.arguments
      const parsed = typeof args === 'string' ? JSON.parse(args) : args
      siteId = parsed.siteId
      credential = parsed.credential || parsed.pin || parsed.passphrase
      isVapiRequest = true
    } else {
      // Direct API call - accept pin, passphrase, or credential
      siteId = body.siteId
      credential = body.credential || body.pin || body.passphrase
    }

    if (!siteId || !credential) {
      const errorResult = { verified: false, error: 'siteId and credential (PIN or passphrase) are required' }
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

    // Normalize credential (remove extra spaces, normalize dashes)
    const normalizedCredential = credential.toString().trim().toLowerCase().replace(/\s+/g, '-')

    // Initialize Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    )

    // Look up the site and verify PIN or passphrase
    const { data: site, error } = await supabase
      .from('generated_sites')
      .select('id, business_name, edit_pin, edit_passphrase, subdomain, status')
      .eq('id', siteId)
      .single()

    if (error || !site) {
      const errorResult = { verified: false, error: 'Site not found' }
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

    // Check if site has credentials set
    if (!site.edit_pin && !site.edit_passphrase) {
      const errorResult = { verified: false, error: 'No PIN or passphrase set for this site' }
      if (isVapiRequest) {
        return Response.json({
          results: [{
            toolCallId,
            result: JSON.stringify(errorResult)
          }]
        })
      }
      return Response.json(errorResult, { status: 400 })
    }

    // Verify against PIN or passphrase (case-insensitive)
    const pinMatch = site.edit_pin && site.edit_pin.toString().toLowerCase() === normalizedCredential.replace(/-/g, '')
    const passphraseMatch = site.edit_passphrase && site.edit_passphrase.toLowerCase() === normalizedCredential
    const verified = pinMatch || passphraseMatch

    const result = {
      verified,
      businessName: verified ? site.business_name : undefined,
      subdomain: verified ? site.subdomain : undefined,
      status: verified ? site.status : undefined
    }

    if (isVapiRequest) {
      return Response.json({
        results: [{
          toolCallId,
          result: JSON.stringify(result)
        }]
      })
    }

    return Response.json(result)

  } catch (error) {
    console.error('PIN verification error:', error)
    return Response.json({ verified: false, error: error.message }, { status: 500 })
  }
}
