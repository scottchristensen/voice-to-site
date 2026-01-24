import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

// Reserved subdomains that can't be claimed
const RESERVED_SUBDOMAINS = [
  'www', 'api', 'admin', 'app', 'mail', 'ftp', 'blog', 'shop', 'store',
  'help', 'support', 'docs', 'status', 'cdn', 'static', 'assets',
  'dashboard', 'login', 'signup', 'register', 'account', 'billing',
  'preview', 'test', 'demo', 'staging', 'dev', 'prod', 'production'
]

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const subdomain = searchParams.get('subdomain')

  if (!subdomain) {
    return Response.json({ error: 'Subdomain required' }, { status: 400 })
  }

  // Normalize subdomain
  const normalized = subdomain.toLowerCase().trim()

  // Validate subdomain format (RFC 1123)
  // Must start with letter/number, can contain hyphens, 1-63 chars
  const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/

  if (!subdomainRegex.test(normalized)) {
    return Response.json({
      available: false,
      error: 'Invalid format. Use only lowercase letters, numbers, and hyphens. Must start and end with a letter or number.'
    })
  }

  // Check minimum length
  if (normalized.length < 3) {
    return Response.json({
      available: false,
      error: 'Subdomain must be at least 3 characters.'
    })
  }

  // Check reserved subdomains
  if (RESERVED_SUBDOMAINS.includes(normalized)) {
    return Response.json({
      available: false,
      error: 'This subdomain is reserved.'
    })
  }

  // Check if subdomain is already taken
  const { data: existing, error } = await supabase
    .from('generated_sites')
    .select('id')
    .eq('subdomain', normalized)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found (which is good - means available)
    console.error('Database error:', error)
    return Response.json({ error: 'Database error' }, { status: 500 })
  }

  return Response.json({
    available: !existing,
    subdomain: normalized
  })
}
