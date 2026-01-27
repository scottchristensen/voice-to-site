import { createClient } from '@/lib/supabase/server'
import DashboardContent from '../../components/DashboardContent'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch user's sites by email (both paid and draft/unpaid)
  const { data: sites } = await supabase
    .from('generated_sites')
    .select('*')
    .eq('email', user.email)
    .order('created_at', { ascending: false })

  return <DashboardContent sites={sites || []} />
}
