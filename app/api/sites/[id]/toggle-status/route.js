import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request, { params }) {
  const { id } = await params

  try {
    const body = await request.json()
    const { published } = body

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    )

    const newStatus = published ? 'active' : 'inactive'

    const { error } = await supabase
      .from('generated_sites')
      .update({ subscription_status: newStatus })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, status: newStatus })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update status' }, { status: 500 })
  }
}
