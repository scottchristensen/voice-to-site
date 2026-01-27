import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    // Initialize Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    )

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const body = await request.json()

    console.log('Received request body:', JSON.stringify(body, null, 2))

    // Handle both Vapi format and direct test format
    let requirements
    let toolCallId = null
    let isVapiRequest = false

    // Check for Vapi's tool call format (toolCallList)
    if (body.message?.toolCallList?.[0]) {
      const toolCall = body.message.toolCallList[0]
      toolCallId = toolCall.id
      requirements = toolCall.function?.arguments || toolCall.arguments
      isVapiRequest = true
      console.log('Detected Vapi format, toolCallId:', toolCallId)
    }
    // Also check for alternative Vapi format (toolCalls)
    else if (body.message?.toolCalls?.[0]) {
      const toolCall = body.message.toolCalls[0]
      toolCallId = toolCall.id
      requirements = toolCall.function?.arguments || toolCall.arguments
      isVapiRequest = true
      console.log('Detected alternative Vapi format, toolCallId:', toolCallId)
    }
    // Direct test format - requirements sent directly
    else if (body.businessName || body.requirements) {
      requirements = body.requirements || body
      console.log('Detected direct test format')
    }

    // Parse requirements if it's a string (Vapi sometimes sends stringified JSON)
    if (typeof requirements === 'string') {
      try {
        requirements = JSON.parse(requirements)
      } catch (e) {
        console.error('Failed to parse requirements string:', e)
      }
    }

    if (!requirements) {
      const errorResponse = { error: 'No requirements provided' }
      if (isVapiRequest) {
        return Response.json({
          results: [{
            toolCallId: toolCallId || 'unknown',
            result: 'Error: No requirements were provided. Please try again.'
          }]
        })
      }
      return Response.json(errorResponse, { status: 400 })
    }

    console.log('Parsed requirements:', requirements)

    // Build the prompt for Gemini
    const prompt = buildWebsitePrompt(requirements)

    // Call Gemini 2.0 Flash (faster, fits within Vercel's 10s timeout)
    // Note: Upgrade to Vercel Pro for 60s timeout to use Gemini 3 Pro
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 32000,
      }
    })

    console.log('Calling Gemini to generate website...')
    const result = await model.generateContent(prompt)
    const htmlCode = result.response.text()

    // Clean up the response (remove markdown code blocks if present)
    const cleanedHtml = htmlCode
      .replace(/```html\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    console.log('Generated HTML length:', cleanedHtml.length)

    // Save to Supabase
    const { data, error } = await supabase
      .from('generated_sites')
      .insert({
        business_name: requirements.businessName,
        industry: requirements.industry,
        requirements: requirements,
        html_code: cleanedHtml,
        status: 'preview',
        owner_language: requirements.ownerLanguage || 'en'
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      if (isVapiRequest) {
        return Response.json({
          results: [{
            toolCallId: toolCallId || 'unknown',
            result: 'Sorry, there was an error saving your website. Please try again.'
          }]
        }, { status: 200 })
      }
      return Response.json({ error: 'Failed to save site', details: error.message }, { status: 500 })
    }

    // Build the preview URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const previewUrl = `${baseUrl}/preview/${data.id}`

    console.log('Website saved successfully! Preview URL:', previewUrl)

    // Return response in appropriate format
    if (isVapiRequest) {
      return Response.json({
        results: [{
          toolCallId: toolCallId,
          result: `Great news! Your website is ready! You can view it at: ${previewUrl}`
        }]
      }, { status: 200 })
    }

    return Response.json({
      success: true,
      previewUrl: previewUrl,
      siteId: data.id
    })

  } catch (error) {
    console.error('Error generating site:', error)

    // Check if this was a Vapi request
    const body = await request.clone().json().catch(() => ({}))
    const toolCallId = body.message?.toolCallList?.[0]?.id || body.message?.toolCalls?.[0]?.id

    if (toolCallId) {
      return Response.json({
        results: [{
          toolCallId: toolCallId,
          result: `Sorry, there was an error generating your website: ${error.message}. Please try again.`
        }]
      }, { status: 200 })
    }

    return Response.json({ error: error.message }, { status: 500 })
  }
}

// This function builds a detailed prompt for Gemini
function buildWebsitePrompt(requirements) {
  return `Create a complete, production-ready single-page marketing website.

BUSINESS DETAILS:
- Business Name: ${requirements.businessName || 'My Business'}
- Industry: ${requirements.industry || 'General'}
- Main Service/Product: ${requirements.mainOffering || 'Professional services'}
- Target Audience: ${requirements.targetAudience || 'General public'}
- Unique Value Proposition: ${requirements.valueProposition || 'Quality and reliability'}
- Call to Action: ${requirements.callToAction || 'Contact us today'}
- Color Preference: ${requirements.colorPreference || 'Professional blue'}
- Tone/Style: ${requirements.tone || 'Professional and friendly'}

ADDITIONAL DETAILS:
${requirements.additionalInfo || 'None provided'}

REQUIREMENTS:
1. Create a COMPLETE, standalone HTML file with embedded CSS and minimal JavaScript
2. Make it mobile-responsive using CSS media queries
3. Use a modern, clean design with good typography (use Google Fonts like Inter or Poppins)
4. Include these sections: Hero, About/Services, Features/Benefits, Testimonials (use realistic placeholder text), Contact/CTA
5. Use placeholder images from https://placehold.co (e.g., https://placehold.co/600x400/1a1a2e/ffffff?text=Hero+Image)
6. Include smooth scroll behavior for navigation links
7. Make the color scheme match: ${requirements.colorPreference || 'professional blue'} - use a cohesive palette
8. Add subtle hover animations and transitions for polish
9. Include proper meta tags for SEO (title, description, viewport)
10. The design should look premium, modern, and professional - not like a generic template
11. Include a sticky/fixed navigation header
12. Add a footer with social media placeholder links

OUTPUT ONLY THE HTML CODE - no explanations, no markdown, just the complete HTML file starting with <!DOCTYPE html>`
}
