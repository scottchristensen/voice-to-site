import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export const config = {
  matcher: [
    // Match all paths except static files, api routes, and Next.js internals
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/account', '/billing']
// Auth routes (login, signup) - redirect to dashboard if already logged in
const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password']

export async function middleware(request) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') || ''
  const pathname = url.pathname

  // Create base response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Check if Supabase env vars are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let user = null

  if (supabaseUrl && supabaseKey) {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    // Refresh the session (important for keeping auth active)
    const { data } = await supabase.auth.getUser()
    user = data?.user
  }

  // Define allowed hosts (main domain variations)
  const mainHosts = [
    'speakyour.site',
    'www.speakyour.site',
    'localhost:3000',
    'localhost',
  ]

  // Check if this is the main domain (not a subdomain)
  const isMainDomain = mainHosts.some(host => hostname === host)

  if (isMainDomain) {
    // Handle protected routes - require authentication
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

    if (isProtectedRoute && !user) {
      // Not logged in, trying to access protected route - redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (isAuthRoute && user) {
      // Already logged in, trying to access auth routes - redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
  }

  // Extract subdomain from hostname
  let subdomain = null

  if (hostname.includes('.speakyour.site')) {
    // Production: mybusiness.speakyour.site
    const parts = hostname.split('.speakyour.site')[0]
    if (parts && parts !== 'www') {
      subdomain = parts
    }
  } else if (hostname.includes('.localhost')) {
    // Local development: mybusiness.localhost:3000
    const parts = hostname.split('.localhost')[0]
    if (parts) {
      subdomain = parts
    }
  }

  // If no subdomain detected, proceed normally
  if (!subdomain) {
    return NextResponse.next()
  }

  // Look up the site by subdomain
  // Note: We make a fetch to our own API to avoid importing Supabase in middleware edge runtime
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    const lookupResponse = await fetch(`${baseUrl}/api/lookup-subdomain?subdomain=${subdomain}`, {
      headers: {
        'x-middleware-request': 'true'
      }
    })

    if (!lookupResponse.ok) {
      // Subdomain not found - redirect to main site
      return NextResponse.redirect(new URL('/', baseUrl))
    }

    const data = await lookupResponse.json()

    if (!data.siteId) {
      return NextResponse.redirect(new URL('/', baseUrl))
    }

    // Check if site is active
    if (data.subscriptionStatus !== 'active' || data.paymentStatus !== 'paid') {
      // Site not paid or subscription lapsed - redirect to preview with message
      return NextResponse.redirect(
        new URL(`/preview/${data.siteId}?expired=subscription`, baseUrl)
      )
    }

    // Rewrite to the site render route (preserving query params like ?lang=es)
    url.pathname = `/site/${data.siteId}`
    // Query params (like ?lang=es) are automatically preserved
    return NextResponse.rewrite(url)

  } catch (error) {
    console.error('Middleware error:', error)
    // On error, redirect to main site
    return NextResponse.redirect(new URL('/', baseUrl))
  }
}
