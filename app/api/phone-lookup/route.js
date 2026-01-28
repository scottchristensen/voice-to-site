import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const body = await request.json()

    // VAPI sends the caller's phone number in various formats
    // Handle both direct format and VAPI's tool call format
    let phoneNumber = body.phoneNumber || body.phone
    let toolCallId = null
    let isVapiRequest = false

    // Check for VAPI tool call format
    if (body.message?.toolCallList?.[0]) {
      const toolCall = body.message.toolCallList[0]
      toolCallId = toolCall.id
      const args = toolCall.function?.arguments || toolCall.arguments
      phoneNumber = typeof args === 'string' ? JSON.parse(args).phoneNumber : args?.phoneNumber
      isVapiRequest = true
    } else if (body.message?.toolCalls?.[0]) {
      const toolCall = body.message.toolCalls[0]
      toolCallId = toolCall.id
      const args = toolCall.function?.arguments || toolCall.arguments
      phoneNumber = typeof args === 'string' ? JSON.parse(args).phoneNumber : args?.phoneNumber
      isVapiRequest = true
    }

    if (!phoneNumber) {
      if (isVapiRequest) {
        return Response.json({
          results: [{
            toolCallId: toolCallId || 'unknown',
            result: JSON.stringify({ found: false, error: 'No phone number provided' })
          }]
        })
      }
      return Response.json({ error: 'phoneNumber is required' }, { status: 400 })
    }

    // Normalize phone number (remove non-digits, handle +1 prefix)
    const normalizedPhone = normalizePhoneNumber(phoneNumber)

    // Initialize Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    )

    // Look up sites associated with this phone number
    const { data: sites, error } = await supabase
      .from('generated_sites')
      .select('id, business_name, subdomain, status, created_at, owner_language')
      .eq('owner_phone', normalizedPhone)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Phone lookup error:', error)
      if (isVapiRequest) {
        return Response.json({
          results: [{
            toolCallId,
            result: JSON.stringify({ found: false, error: 'Database error' })
          }]
        })
      }
      return Response.json({ error: 'Database error' }, { status: 500 })
    }

    const found = sites && sites.length > 0
    const result = {
      found,
      siteCount: sites?.length || 0,
      sites: sites?.map(s => ({
        id: s.id,
        businessName: s.business_name,
        subdomain: s.subdomain,
        status: s.status,
        language: s.owner_language
      })) || []
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
    console.error('Phone lookup error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// Normalize phone number to consistent format (digits only, no country code)
function normalizePhoneNumber(phone) {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '')

  // Remove leading 1 if it's a US number with country code
  if (digits.length === 11 && digits.startsWith('1')) {
    digits = digits.slice(1)
  }

  return digits
}
