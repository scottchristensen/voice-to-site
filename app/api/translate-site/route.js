import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds for generation

export async function POST(request) {
  try {
    const { siteId, targetLanguage = 'es' } = await request.json()

    if (!siteId) {
      return Response.json({ error: 'siteId is required' }, { status: 400 })
    }

    // Initialize Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    )

    // Fetch the site with its requirements
    const { data: site, error: fetchError } = await supabase
      .from('generated_sites')
      .select('id, requirements, html_code, html_code_es, business_name, industry')
      .eq('id', siteId)
      .single()

    if (fetchError || !site) {
      return Response.json({ error: 'Site not found' }, { status: 404 })
    }

    // If Spanish version already exists, return it
    if (targetLanguage === 'es' && site.html_code_es) {
      return Response.json({
        success: true,
        html: site.html_code_es,
        cached: true
      })
    }

    // Get the requirements from the stored data
    const requirements = site.requirements || {
      businessName: site.business_name,
      industry: site.industry
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 32000,
      }
    })

    // Build the prompt for Spanish version
    const prompt = buildSpanishWebsitePrompt(requirements)

    console.log(`Generating Spanish version for site ${siteId}...`)
    const result = await model.generateContent(prompt)
    const htmlCode = result.response.text()

    // Clean up the response
    const cleanedHtml = htmlCode
      .replace(/```html\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    console.log('Generated Spanish HTML length:', cleanedHtml.length)

    // Save to Supabase
    const { error: updateError } = await supabase
      .from('generated_sites')
      .update({ html_code_es: cleanedHtml })
      .eq('id', siteId)

    if (updateError) {
      console.error('Failed to save Spanish version:', updateError)
      return Response.json({ error: 'Failed to save Spanish version' }, { status: 500 })
    }

    return Response.json({
      success: true,
      html: cleanedHtml,
      cached: false
    })

  } catch (error) {
    console.error('Error generating Spanish version:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

function buildSpanishWebsitePrompt(requirements) {
  return `Create a complete, production-ready single-page marketing website IN SPANISH.

IMPORTANT: All text content must be in SPANISH. This is for Spanish-speaking customers.

BUSINESS DETAILS:
- Business Name: ${requirements.businessName || 'Mi Negocio'}
- Industry: ${requirements.industry || 'General'}
- Main Service/Product: ${requirements.mainOffering || 'Servicios profesionales'}
- Target Audience: ${requirements.targetAudience || 'Público general'}
- Unique Value Proposition: ${requirements.valueProposition || 'Calidad y confiabilidad'}
- Call to Action: ${requirements.callToAction || 'Contáctenos hoy'}
- Color Preference: ${requirements.colorPreference || 'Professional blue'}
- Tone/Style: ${requirements.tone || 'Professional and friendly'}

ADDITIONAL DETAILS:
${requirements.additionalInfo || 'None provided'}

REQUIREMENTS:
1. Create a COMPLETE, standalone HTML file with embedded CSS and minimal JavaScript
2. ALL TEXT MUST BE IN SPANISH - headings, paragraphs, buttons, navigation, footer, everything
3. Make it mobile-responsive using CSS media queries
4. Use a modern, clean design with good typography (use Google Fonts like Inter or Poppins)
5. Include these sections: Hero (Inicio), About/Services (Servicios), Features/Benefits (Beneficios), Testimonials (Testimonios), Contact/CTA (Contacto)
6. Use placeholder images from https://placehold.co (e.g., https://placehold.co/600x400/1a1a2e/ffffff?text=Imagen+Principal)
7. Include smooth scroll behavior for navigation links
8. Make the color scheme match: ${requirements.colorPreference || 'professional blue'} - use a cohesive palette
9. Add subtle hover animations and transitions for polish
10. Include proper meta tags for SEO with Spanish content (title, description, viewport)
11. The design should look premium, modern, and professional
12. Include a sticky/fixed navigation header
13. Add a footer with social media placeholder links
14. Include a language toggle link in the header that says "🇺🇸 English" linking to "?lang=en"

SPANISH TRANSLATIONS TO USE:
- "Learn More" → "Más Información"
- "Contact Us" → "Contáctenos"
- "Get Started" → "Comenzar"
- "About Us" → "Sobre Nosotros"
- "Services" → "Servicios"
- "Testimonials" → "Testimonios"
- "Contact" → "Contacto"
- "Submit" → "Enviar"
- "Name" → "Nombre"
- "Email" → "Correo Electrónico"
- "Message" → "Mensaje"
- "Phone" → "Teléfono"

OUTPUT ONLY THE HTML CODE - no explanations, no markdown, just the complete HTML file starting with <!DOCTYPE html>`
}
