import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EditSiteClient from './EditSiteClient'

export default async function EditSitePage({ params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch the site data
  const { data: site, error } = await supabase
    .from('generated_sites')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !site) {
    redirect('/dashboard?error=site_not_found')
  }

  // Verify ownership (by email or user_id)
  if (site.email !== user.email && site.user_id !== user.id) {
    redirect('/dashboard?error=unauthorized')
  }

  return <EditSiteClient site={site} />
}
