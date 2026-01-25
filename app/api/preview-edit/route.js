import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const { siteId, editInstruction } = await request.json()

    if (!siteId || !editInstruction) {
      return Response.json({ error: 'Site ID and edit instruction are required' }, { status: 400 })
    }

    // Initialize Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    )

    // Fetch the site
    const { data: site, error: fetchError } = await supabase
      .from('generated_sites')
      .select('id, html_code, payment_status, preview_edits_used')
      .eq('id', siteId)
      .single()

    if (fetchError || !site) {
      return Response.json({ error: 'Site not found' }, { status: 404 })
    }

    // Check if site is already claimed
    if (site.payment_status === 'paid') {
      return Response.json({ error: 'Site already claimed. Use the post-claim edit feature.' }, { status: 403 })
    }

    // Check edit limit (5 free edits)
    const editsUsed = site.preview_edits_used || 0
    if (editsUsed >= 5) {
      return Response.json({ error: 'limit_reached', editsRemaining: 0 }, { status: 200 })
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.3, // Lower temperature for more precise edits
        maxOutputTokens: 32000,
      }
    })

    // Build the edit prompt
    const prompt = `You are a website editor. Apply the following edit to the HTML code below.

EDIT INSTRUCTION:
${editInstruction}

CURRENT HTML:
${site.html_code}

RULES:
1. Only modify what is necessary to fulfill the edit instruction
2. Preserve ALL existing styling, structure, and functionality
3. Return the COMPLETE HTML document with the edit applied
4. Do not add explanations or markdown - only return the HTML code
5. Start your response with <!DOCTYPE html>

OUTPUT THE MODIFIED HTML:`

    // Call Gemini to apply the edit
    const result = await model.generateContent(prompt)
    const newHtml = result.response.text()
      .replace(/```html\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    // Validate the response looks like HTML
    if (!newHtml.includes('<!DOCTYPE html>') && !newHtml.includes('<html')) {
      return Response.json({ error: 'Failed to generate valid HTML' }, { status: 500 })
    }

    // Update the site with new HTML and increment edit counter
    const newEditsUsed = editsUsed + 1
    const { error: updateError } = await supabase
      .from('generated_sites')
      .update({
        html_code: newHtml,
        preview_edits_used: newEditsUsed
      })
      .eq('id', siteId)

    if (updateError) {
      console.error('Error updating site:', updateError)
      return Response.json({ error: 'Failed to save edit' }, { status: 500 })
    }

    return Response.json({
      success: true,
      html: newHtml,
      editsRemaining: 5 - newEditsUsed
    })

  } catch (error) {
    console.error('Preview edit error:', error)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
