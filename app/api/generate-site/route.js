import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export async function POST(request) {
  try {
    // Get the data sent from Vapi
    const body = await request.json()
    
    // Extract the website requirements from the conversation
    // (Vapi sends this in a specific format - we'll configure that later)
    const requirements = body.message?.toolCalls?.[0]?.function?.arguments
    
    if (!requirements) {
      return Response.json({ error: 'No requirements provided' }, { status: 400 })
    }

    console.log('Received requirements:', requirements)

    // Build the prompt for Gemini
    const prompt = buildWebsitePrompt(requirements)

    // Call Gemini 3 Pro to generate the website
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3-pro-preview',
      generationConfig: {
        // Use high thinking for better quality output
        temperature: 0.7,
        maxOutputTokens: 32000,
      }
    })

    const result = await model.generateContent(prompt)
    const htmlCode = result.response.text()

    // Clean up the response (remove markdown code blocks if present)
    const cleanedHtml = htmlCode
      .replace(/```html\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

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
      return Response.json({ error: 'Failed to save site' }, { status: 500 })
    }

    // Return the preview URL
    const previewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/preview/${data.id}`

    return Response.json({
      success: true,
      previewUrl: previewUrl,
      siteId: data.id
    })

  } catch (error) {
    console.error('Error generating site:', error)
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
3. Use a modern, clean design with good typography
4. Include these sections: Hero, About/Services, Features/Benefits, Testimonials (use placeholder text), Contact/CTA
5. Use placeholder images from https://placehold.co (e.g., https://placehold.co/600x400)
6. Include smooth scroll behavior
7. Make the color scheme match the preference: ${requirements.colorPreference || 'professional blue'}
8. Add subtle animations/transitions for polish
9. Include proper meta tags for SEO
10. Make sure the design looks premium and professional

OUTPUT ONLY THE HTML CODE - no explanations, no markdown, just the complete HTML file starting with <!DOCTYPE html>`
}
