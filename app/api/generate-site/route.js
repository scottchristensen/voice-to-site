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

    // Use user-provided PIN/passphrase if available, otherwise generate defaults
    const editPin = requirements.editPin || Math.floor(1000 + Math.random() * 9000).toString()
    const editPassphrase = requirements.editPassphrase || generatePassphrase()

    // Normalize phone number if provided
    const ownerPhone = requirements.ownerPhone
      ? requirements.ownerPhone.replace(/\D/g, '').replace(/^1/, '')
      : null

    // Save to Supabase
    const { data, error } = await supabase
      .from('generated_sites')
      .insert({
        business_name: requirements.businessName,
        industry: requirements.industry,
        requirements: requirements,
        html_code: cleanedHtml,
        status: 'preview',
        owner_language: requirements.ownerLanguage || 'en',
        owner_phone: ownerPhone,
        edit_pin: editPin,
        edit_passphrase: editPassphrase,
        // Address and location fields
        has_physical_location: requirements.hasPhysicalLocation || false,
        business_address: requirements.businessAddress || null
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
      // For phone callers, they already set their own credentials, just remind them
      const securityReminder = ownerPhone
        ? ` Remember, you can use your PIN or password phrase to make changes over the phone anytime.`
        : ''

      return Response.json({
        results: [{
          toolCallId: toolCallId,
          result: `Great news! Your website is ready! You can view it at: ${previewUrl}${securityReminder}`
        }]
      }, { status: 200 })
    }

    return Response.json({
      success: true,
      previewUrl: previewUrl,
      siteId: data.id,
      editPin: editPin,
      editPassphrase: editPassphrase
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
  // Build location section if address is provided
  let locationSection = ''
  if (requirements.hasPhysicalLocation && requirements.businessAddress) {
    const addr = requirements.businessAddress
    const fullAddress = addr.fullAddress ||
      `${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''} ${addr.zip || ''}`.trim()

    locationSection = `
PHYSICAL LOCATION:
- Address: ${fullAddress}
- This is a physical storefront/location that customers visit
- IMPORTANT: Include the full address prominently in the Contact section
- Add a "Get Directions" button/link that opens Google Maps: https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}
- Consider mentioning the location in the hero or about section to establish local presence
`
  } else {
    locationSection = `
BUSINESS TYPE:
- This is a service-based or online business without a physical storefront
- Do NOT include a physical address in the contact section
- Focus on phone, email, and contact form for customer inquiries
`
  }

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
${locationSection}
ADDITIONAL DETAILS:
${requirements.additionalInfo || 'None provided'}

CRITICAL REQUIREMENTS:
1. This MUST be a SINGLE-PAGE landing page - NO multi-page navigation, NO links to other pages
2. ALL navigation links MUST be anchor links (e.g., href="#about", href="#services", href="#contact") that scroll within the same page
3. ALL call-to-action buttons (CTAs) MUST link to the contact form section (href="#contact") unless the user specifically requested otherwise
4. Include BOTH light mode and dark mode styles using CSS @media (prefers-color-scheme: dark) - the site should automatically adapt to the user's operating system preference

DESIGN REQUIREMENTS:
5. Create a COMPLETE, standalone HTML file with embedded CSS and minimal JavaScript
6. Make it mobile-responsive using CSS media queries
7. Use a modern, clean design with good typography (use Google Fonts like Inter or Poppins)
8. Include these sections with proper id attributes for anchor linking:
   - Hero section (id="hero")
   - About/Services section (id="about" or id="services")
   - Features/Benefits section (id="features")
   - Testimonials section (id="testimonials") with realistic placeholder text
   - Contact form section (id="contact") with a working form layout
9. Use placeholder images from https://placehold.co (e.g., https://placehold.co/600x400/1a1a2e/ffffff?text=Hero+Image)
10. Include smooth scroll behavior: html { scroll-behavior: smooth; }
11. Make the color scheme match: ${requirements.colorPreference || 'professional blue'} - use a cohesive palette for BOTH light and dark modes
12. Add subtle hover animations and transitions for polish
13. Include proper meta tags for SEO (title, description, viewport)
14. The design should look premium, modern, and professional - not like a generic template
15. Include a sticky/fixed navigation header with:
    - Logo/business name on the left
    - Nav links (all anchor links) in the center or right
    - A language toggle link that says "🇪🇸 Español" linking to "?lang=es" (positioned on the far right)
16. Add a footer with:
    - Social media placeholder links
    - Copyright text: "© 2026 ${requirements.businessName || 'Business Name'}. All rights reserved."

DARK MODE IMPLEMENTATION:
- Define CSS custom properties (variables) for colors at :root level
- Override those variables inside @media (prefers-color-scheme: dark) { :root { ... } }
- Use these variables throughout the CSS for backgrounds, text colors, borders, etc.
- Ensure good contrast and readability in both modes
- Example structure:
  :root {
    --bg-primary: #ffffff;
    --text-primary: #1a1a2e;
    /* etc */
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg-primary: #1a1a2e;
      --text-primary: #f5f5f5;
      /* etc */
    }
  }

OUTPUT ONLY THE HTML CODE - no explanations, no markdown, just the complete HTML file starting with <!DOCTYPE html>`
}

// Generate a memorable passphrase for voice authentication
function generatePassphrase() {
  const adjectives = [
    'happy', 'sunny', 'bright', 'golden', 'silver', 'cosmic', 'mighty', 'swift',
    'gentle', 'brave', 'calm', 'clever', 'eager', 'fancy', 'grand', 'jolly',
    'kind', 'lucky', 'merry', 'noble', 'proud', 'quick', 'royal', 'shiny',
    'super', 'vivid', 'warm', 'wise', 'zesty', 'cool', 'fresh', 'bold'
  ]
  const nouns = [
    'tiger', 'eagle', 'river', 'mountain', 'forest', 'ocean', 'sunset', 'rainbow',
    'dolphin', 'falcon', 'garden', 'harbor', 'island', 'jasper', 'meadow', 'phoenix',
    'sapphire', 'thunder', 'voyage', 'willow', 'breeze', 'canyon', 'crystal', 'dragon',
    'ember', 'flame', 'glacier', 'horizon', 'lantern', 'maple', 'orchid', 'pearl'
  ]

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num = Math.floor(10 + Math.random() * 90) // 10-99

  return `${adj}-${noun}-${num}`
}
