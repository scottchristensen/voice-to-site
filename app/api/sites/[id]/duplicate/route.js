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
    .eq('email', user.email)
    .single()

  if (fetchError || !originalSite) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 })
  }

  // Create a duplicate (unpaid, no subdomain)
  const { data: newSite, error: insertError } = await supabase
    .from('generated_sites')
    .insert({
      business_name: `${originalSite.business_name} (Copy)`,
      industry: originalSite.industry,
      requirements: originalSite.requirements,
      html_code: originalSite.html_code,
      email: user.email,
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
