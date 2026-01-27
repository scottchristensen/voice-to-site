import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request, { params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get the original site
  const { data: originalSite, error: fetchError } = await supabase
    .from('generated_sites')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !originalSite) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 })
  }

  // Verify ownership (by email or user_id)
  const isOwner = originalSite.email === user.email || originalSite.user_id === user.id
  if (!isOwner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Generate unique copy name
  // Extract base name (remove existing " Copy" or " Copy X" suffix)
  let baseName = originalSite.business_name
  const copyPattern = / Copy( \d+)?$/
  baseName = baseName.replace(copyPattern, '')

  // Find all existing sites with similar copy names
  const { data: existingSites } = await supabase
    .from('generated_sites')
    .select('business_name')
    .eq('email', user.email)
    .like('business_name', `${baseName} Copy%`)

  // Determine the next copy number
  let copyName = `${baseName} Copy`
  if (existingSites && existingSites.length > 0) {
    const copyNumbers = existingSites.map(site => {
      const match = site.business_name.match(/ Copy( (\d+))?$/)
      if (match) {
        return match[2] ? parseInt(match[2], 10) : 0
      }
      return -1
    }).filter(n => n >= 0)

    if (copyNumbers.length > 0) {
      const maxNum = Math.max(...copyNumbers)
      copyName = `${baseName} Copy ${maxNum + 1}`
    }
  }

  // Create a duplicate (unpaid, no subdomain, linked to current user)
  const { data: newSite, error: insertError } = await supabase
    .from('generated_sites')
    .insert({
      business_name: copyName,
      industry: originalSite.industry,
      requirements: originalSite.requirements,
      html_code: originalSite.html_code,
      email: user.email,
      user_id: user.id,
      phone: originalSite.phone,
      status: 'preview',
      payment_status: 'unpaid',
      subscription_status: 'none',
    })
    .select()
    .single()

  if (insertError) {
    console.error('Duplicate error:', insertError)
    return NextResponse.json({ error: 'Failed to duplicate site' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    site: newSite,
    previewUrl: `/preview/${newSite.id}`
  })
}
