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

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent translation
        maxOutputTokens: 32000,
      }
    })

    // Build the prompt for translation (not regeneration)
    const prompt = buildTranslationPrompt(site.html_code, targetLanguage)

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

function buildTranslationPrompt(htmlCode, targetLanguage) {
  const langName = targetLanguage === 'es' ? 'Spanish' : 'English'
  const langToggleText = targetLanguage === 'es' ? '🇺🇸 English' : '🇪🇸 Español'
  const langToggleLink = targetLanguage === 'es' ? '?lang=en' : '?lang=es'

  return `You are a website translator. Your task is to translate ONLY the text content of this HTML website to ${langName}.

CRITICAL INSTRUCTIONS:
1. DO NOT change the HTML structure, layout, or design in ANY way
2. DO NOT modify CSS styles, colors, fonts, spacing, or any visual properties
3. DO NOT change image URLs or any src/href attributes (except language toggle)
4. DO NOT add, remove, or rearrange any HTML elements
5. ONLY translate the visible text content (headings, paragraphs, button text, labels, etc.)
6. Keep the business name as-is (do not translate proper nouns)
7. Preserve all HTML tags, attributes, classes, and IDs exactly as they are
8. If there's a language toggle link, update it to say "${langToggleText}" and link to "${langToggleLink}"

TRANSLATION GUIDELINES:
- Translate naturally, not word-for-word
- Keep the same tone and style as the original
- Common translations:
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
  - "Home" → "Inicio"
  - "About" → "Nosotros"

HERE IS THE HTML TO TRANSLATE:

${htmlCode}

OUTPUT ONLY THE TRANSLATED HTML CODE - no explanations, no markdown code blocks, just the complete HTML starting with <!DOCTYPE html> (or the existing doctype)`
}
