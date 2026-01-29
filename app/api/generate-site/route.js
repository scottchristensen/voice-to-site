import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic'

// Import address processing functions
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY

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

    // Process address and fetch imagery if physical location is provided
    let imagery = null
    let geocodeData = null
    let googlePlaceId = null
    let googlePlaceData = null

    if (requirements.hasPhysicalLocation && requirements.businessAddress && GOOGLE_MAPS_API_KEY) {
      console.log('Processing business address for imagery...')
      try {
        const addressResult = await processAddressAndFetchImagery(
          requirements.businessAddress,
          requirements.businessName,
          requirements.industry
        )

        if (addressResult.valid) {
          geocodeData = addressResult.geocode
          googlePlaceId = addressResult.place?.placeId
          googlePlaceData = addressResult.place
          imagery = addressResult.imagery
          console.log(`Imagery fetched: source=${imagery.source}, photos=${imagery.photos?.length || 0}`)
        }
      } catch (err) {
        console.error('Address processing failed, continuing with placeholders:', err)
      }
    }

    // Build the prompt for Gemini (with imagery if available)
    const prompt = buildWebsitePrompt(requirements, imagery)

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
    const geminiStart = Date.now()
    const result = await model.generateContent(prompt)
    const htmlCode = result.response.text()
    console.log(`⏱️ Gemini generation took ${Date.now() - geminiStart}ms`)

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
        business_address: requirements.businessAddress || null,
        // Geocoding and Places data
        geocode_data: geocodeData,
        google_place_id: googlePlaceId,
        google_place_data: googlePlaceData,
        business_imagery: imagery
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
function buildWebsitePrompt(requirements, imagery = null) {
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

  // Build imagery instructions based on what's available
  const imagerySection = buildImageryInstructions(imagery, requirements.businessName)

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
${imagerySection}
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
9. Follow the IMAGE REQUIREMENTS section above for which images to use
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

/**
 * Build imagery instructions for the Gemini prompt
 */
function buildImageryInstructions(imagery, businessName) {
  // Default to placeholders if no imagery available
  if (!imagery || imagery.source === 'placeholder') {
    return `
IMAGE REQUIREMENTS:
- Use placeholder images from https://placehold.co
- Example: https://placehold.co/600x400/1a1a2e/ffffff?text=Hero+Image
- Use descriptive text in placeholder URLs that match the section (e.g., ?text=Our+Services)
`
  }

  let instructions = `
IMAGE REQUIREMENTS:
`

  // If we have real business photos from Google Places
  if (imagery.photos && imagery.photos.length > 0) {
    instructions += `
USE THESE REAL BUSINESS PHOTOS (use them in order of preference):
${imagery.photos.map((photo, i) => `${i + 1}. ${photo.url}`).join('\n')}

IMPORTANT PHOTO INSTRUCTIONS:
- Use photo #1 as the HERO IMAGE (make it full-width, prominent at the top)
- Use remaining photos in the About, Services, or Gallery sections
- Add descriptive alt text for each image (describe the business)
- Make sure images are responsive (max-width: 100%, height: auto)
`
  }

  // If we have Street View imagery
  if (imagery.streetView) {
    instructions += `
STREET VIEW IMAGE (shows the actual storefront/building):
- URL: ${imagery.streetView.url}
- Use this in a "Visit Us" or "Location" section to show the physical storefront
- This helps customers recognize the business when they arrive
`
  }

  // Map image for contact/location section
  if (imagery.mapImage) {
    instructions += `
MAP IMAGE (for Contact/Location section):
- URL: ${imagery.mapImage}
- Include this map image in the Contact section
- Add a "Get Directions" button/link next to or below the map
`
  }

  // If we still need some placeholders
  if (imagery.photos?.length < 3) {
    instructions += `
For any additional images needed beyond the real photos provided, use placeholders:
- https://placehold.co/400x300/667eea/ffffff?text=Our+Services
- https://placehold.co/400x300/667eea/ffffff?text=Quality+Work
`
  }

  return instructions
}

/**
 * Process address and fetch all business imagery
 * Optimized: Geocode first (required), then Places + Imagery in parallel
 */
async function processAddressAndFetchImagery(businessAddress, businessName, industry) {
  const startTime = Date.now()

  const fullAddress = businessAddress.fullAddress ||
    `${businessAddress.street || ''}, ${businessAddress.city || ''}, ${businessAddress.state || ''} ${businessAddress.zip || ''}`.trim()

  // Step 1: Geocode the address (must complete first)
  const geocodeStart = Date.now()
  const geocodeResult = await geocodeAddress(fullAddress)
  console.log(`⏱️ Geocoding took ${Date.now() - geocodeStart}ms`)

  if (!geocodeResult.valid) {
    return {
      valid: false,
      error: geocodeResult.error,
      geocode: null,
      place: null,
      imagery: null
    }
  }

  // Step 2 & 3: Run Places search and determine storefront type
  const hasStorefront = isStorefrontBusiness(industry)

  // Step 4: Find business AND fetch imagery in parallel where possible
  const placesStart = Date.now()
  const placeResult = await findBusinessPlace(businessName, geocodeResult.location)
  console.log(`⏱️ Places search took ${Date.now() - placesStart}ms`)

  // Step 5: Fetch all imagery (photos + street view run in parallel)
  const imageryStart = Date.now()
  const imagery = await fetchBusinessImagery({
    placeId: placeResult?.placeId,
    location: geocodeResult.location,
    hasStorefront,
    businessName
  })
  console.log(`⏱️ Imagery fetch took ${Date.now() - imageryStart}ms`)

  console.log(`⏱️ Total address processing: ${Date.now() - startTime}ms`)

  return {
    valid: true,
    geocode: geocodeResult,
    place: placeResult,
    imagery
  }
}

/**
 * Geocode an address using Google Geocoding API
 */
async function geocodeAddress(address) {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?` +
      `address=${encodeURIComponent(address)}` +
      `&key=${GOOGLE_MAPS_API_KEY}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status !== 'OK' || !data.results[0]) {
      return {
        valid: false,
        error: data.status === 'ZERO_RESULTS' ? 'Address not found' : `Geocoding error: ${data.status}`
      }
    }

    const result = data.results[0]
    return {
      valid: true,
      formattedAddress: result.formatted_address,
      location: result.geometry.location,
      placeId: result.place_id,
      addressComponents: result.address_components
    }
  } catch (error) {
    return { valid: false, error: error.message }
  }
}

/**
 * Find a business on Google Places
 */
async function findBusinessPlace(businessName, location) {
  try {
    const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
      `location=${location.lat},${location.lng}` +
      `&radius=150` +
      `&keyword=${encodeURIComponent(businessName)}` +
      `&key=${GOOGLE_MAPS_API_KEY}`

    const response = await fetch(searchUrl)
    const data = await response.json()

    if (data.status !== 'OK' || !data.results[0]) {
      return null
    }

    const place = data.results[0]
    return {
      placeId: place.place_id,
      name: place.name,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      types: place.types,
      vicinity: place.vicinity
    }
  } catch (error) {
    return null
  }
}

/**
 * Check if an industry typically has a visible storefront
 */
function isStorefrontBusiness(industry) {
  if (!industry) return false

  const storefrontIndustries = [
    'restaurant', 'cafe', 'bakery', 'bar', 'salon', 'barbershop', 'spa',
    'retail', 'store', 'shop', 'boutique', 'gym', 'fitness',
    'dental', 'medical', 'clinic', 'auto', 'mechanic',
    'hotel', 'pharmacy', 'florist', 'pet', 'coffee', 'pizza'
  ]

  const lowercaseIndustry = industry.toLowerCase()
  return storefrontIndustries.some(type => lowercaseIndustry.includes(type))
}

/**
 * Fetch all business imagery (photos, map, street view)
 * Runs photo and street view fetches in PARALLEL for speed
 */
async function fetchBusinessImagery({ placeId, location, hasStorefront, businessName }) {
  const imagery = {
    photos: [],
    mapImage: null,
    streetView: null,
    source: 'placeholder'
  }

  // Generate map image URL (no API call needed - just URL construction)
  if (location) {
    imagery.mapImage = `https://maps.googleapis.com/maps/api/staticmap?` +
      `center=${location.lat},${location.lng}` +
      `&zoom=15&size=600x400&maptype=roadmap` +
      `&markers=color:red%7C${location.lat},${location.lng}` +
      `&key=${GOOGLE_MAPS_API_KEY}`
  }

  // Run photo fetch and street view fetch in PARALLEL
  const promises = []

  // Promise for business photos
  if (placeId) {
    promises.push(
      (async () => {
        try {
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?` +
            `place_id=${placeId}` +
            `&fields=photos` +
            `&key=${GOOGLE_MAPS_API_KEY}`

          const response = await fetch(detailsUrl)
          const data = await response.json()

          if (data.status === 'OK' && data.result?.photos) {
            return data.result.photos.slice(0, 5).map(photo => ({
              url: `https://maps.googleapis.com/maps/api/place/photo?` +
                `maxwidth=800&photo_reference=${photo.photo_reference}` +
                `&key=${GOOGLE_MAPS_API_KEY}`,
              attribution: photo.html_attributions?.[0] || '',
              width: photo.width,
              height: photo.height
            }))
          }
        } catch (error) {
          console.error('Photo fetch error:', error)
        }
        return []
      })()
    )
  } else {
    promises.push(Promise.resolve([]))
  }

  // Promise for Street View
  if (hasStorefront && location) {
    promises.push(
      (async () => {
        try {
          const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?` +
            `location=${location.lat},${location.lng}` +
            `&key=${GOOGLE_MAPS_API_KEY}`

          const metaResponse = await fetch(metadataUrl)
          const metadata = await metaResponse.json()

          if (metadata.status === 'OK') {
            return {
              url: `https://maps.googleapis.com/maps/api/streetview?` +
                `size=600x400&location=${location.lat},${location.lng}` +
                `&pitch=10&key=${GOOGLE_MAPS_API_KEY}`,
              panoId: metadata.pano_id,
              date: metadata.date
            }
          }
        } catch (error) {
          console.error('Street View error:', error)
        }
        return null
      })()
    )
  } else {
    promises.push(Promise.resolve(null))
  }

  // Wait for both in parallel
  const [photos, streetView] = await Promise.all(promises)

  imagery.photos = photos
  imagery.streetView = streetView

  // Determine source
  if (imagery.photos.length > 0) {
    imagery.source = 'google_places'
  } else if (imagery.streetView) {
    imagery.source = 'street_view'
  }

  return imagery
}
