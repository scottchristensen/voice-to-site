import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic'

// Set maximum execution time to 55 seconds (just under Vercel Pro's 60s limit)
// This allows time for Gemini 3 Pro to generate higher-quality websites
export const maxDuration = 55

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

    console.log('[1/4] Parsing requirements...')
    console.log('Parsed requirements:', requirements)

    console.log('[2/4] Building prompt...')
    // Build the prompt for Gemini
    const prompt = buildWebsitePrompt(requirements)

    // Call Gemini 3 Pro for higher quality website generation
    // Requires Vercel Pro plan (60s timeout) - configured via maxDuration above
    const model = genAI.getGenerativeModel({
      model: 'gemini-3-pro-preview',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 64000, // Increased from 32000 - Gemini 3 Pro supports up to 64K tokens
      }
    })

    console.log('[3/4] Calling Gemini 3 Pro (may take 10-20 seconds)...')
    const startTime = Date.now()

    let htmlCode
    try {
      const result = await model.generateContent(prompt)
      const duration = (Date.now() - startTime) / 1000
      console.log(`✅ Gemini 3 Pro completed in ${duration.toFixed(2)}s`)

      htmlCode = result.response.text()
    } catch (error) {
      // Enhanced error handling for timeout scenarios
      if (error.message?.includes('timeout') || error.code === 'DEADLINE_EXCEEDED') {
        console.error('Gemini 3 Pro timeout error:', error)

        if (isVapiRequest) {
          return Response.json({
            results: [{
              toolCallId: toolCallId || 'unknown',
              result: 'Sorry, the website generation took longer than expected. This is unusual - please try again and it should work.'
            }]
          }, { status: 200 })
        }

        return Response.json({
          error: 'Website generation timeout',
          details: 'The AI took too long to generate your site. Please try again.'
        }, { status: 504 })
      }

      // Re-throw other errors to be caught by outer try-catch
      throw error
    }

    // Clean up the response (remove markdown code blocks if present)
    const cleanedHtml = htmlCode
      .replace(/```html\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    console.log('Generated HTML length:', cleanedHtml.length)

    console.log('[4/4] Saving to database...')
    // Save to Supabase
    const { data, error } = await supabase
      .from('generated_sites')
      .insert({
        business_name: requirements.businessName,
        industry: requirements.industry,
        requirements: requirements,
        html_code: cleanedHtml,
        status: 'preview'
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
