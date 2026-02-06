import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Database } from '@/types/database'

// SECURITY: Path normalization utilities to prevent directory traversal
function normalizePath(path: string): string {
  // Remove multiple consecutive slashes
  path = path.replace(/\/+/g, '/')

  // Split path into segments
  const segments = path.split('/').filter(segment => segment !== '')
  const normalizedSegments: string[] = []

  for (const segment of segments) {
    if (segment === '..') {
      // Remove parent directory reference
      normalizedSegments.pop()
    } else if (segment !== '.') {
      // Keep valid segments (exclude current directory references)
      normalizedSegments.push(segment)
    }
  }

  // Reconstruct path
  const normalizedPath = '/' + normalizedSegments.join('/')
  return normalizedPath === '/' ? '/' : normalizedPath
}

function containsTraversalAttempt(path: string): boolean {
  // Check for common directory traversal patterns
  const traversalPatterns = [
    '../',
    '..\\',
    '%2e%2e%2f',  // URL encoded ../
    '%2e%2e%5c',  // URL encoded ..\
    '%2e%2e/',    // Partially encoded
    '..%2f',      // Partially encoded
    '%252e%252e%252f', // Double URL encoded
  ]

  const lowerPath = path.toLowerCase()
  return traversalPatterns.some(pattern => lowerPath.includes(pattern))
}

function validatePortalAccess(normalizedPath: string, userType: string | null): boolean {
  // SECURITY: Strict portal route validation
  if (!userType) return false

  // Client access validation - MUST be exactly within /portal/client/* routes
  if (userType === 'client') {
    return normalizedPath === '/portal/client' || normalizedPath.startsWith('/portal/client/')
  }

  // Staff access validation - can access /portal/staff/* routes
  if (['super_admin', 'admin', 'lawyer', 'staff'].includes(userType)) {
    return normalizedPath === '/portal/staff' || normalizedPath.startsWith('/portal/staff/')
  }

  return false
}

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  let session = null
  let userProfile = null

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Get session and user profile
  const {
    data: { session: supabaseSession },
  } = await supabase.auth.getSession()

  session = supabaseSession

  if (session?.user) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', session.user.id)
      .single()

    userProfile = data
  }

  const rawPath = req.nextUrl.pathname

  // SECURITY: Normalize path to prevent directory traversal attacks
  // Remove consecutive slashes and resolve relative path segments
  const path = normalizePath(rawPath)

  // SECURITY: Detect and block path traversal attempts
  if (containsTraversalAttempt(rawPath)) {
    console.warn(`[SECURITY] Path traversal attempt blocked: ${rawPath} from ${req.ip}`)
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Route definitions
  const publicPaths = ['/', '/pricing', '/about', '/contact']
  const authPaths = ['/login', '/register', '/forgot-password', '/reset-password']
  const dashboardPaths = ['/dashboard', '/matters', '/clients', '/billing', '/calendar', '/tasks', '/documents', '/reports', '/settings']
  const adminPaths = ['/admin']
  const platformPaths = ['/platform']
  const portalPaths = ['/portal/client', '/portal/staff']

  const isPublicPath = publicPaths.includes(path)
  const isAuthPath = authPaths.some((authPath) => path.startsWith(authPath))
  const isDashboardPath = dashboardPaths.some((dashboardPath) => path.startsWith(dashboardPath))
  const isAdminPath = adminPaths.some((adminPath) => path.startsWith(adminPath))
  const isPlatformPath = platformPaths.some((platformPath) => path.startsWith(platformPath))
  const isPortalPath = portalPaths.some((portalPath) => path.startsWith(portalPath))

  // Allow public paths
  if (isPublicPath) {
    return response
  }

  // Redirect to login if accessing protected routes without session
  if (!session && (isDashboardPath || isAdminPath || isPlatformPath || isPortalPath)) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users away from auth pages
  if (session && isAuthPath) {
    const defaultRedirect = userProfile?.user_type === 'super_admin'
      ? '/platform'
      : userProfile?.user_type === 'client'
        ? '/portal/client'
        : '/dashboard'
    return NextResponse.redirect(new URL(defaultRedirect, req.url))
  }

  // Platform route protection - super_admin only
  if (isPlatformPath && userProfile?.user_type !== 'super_admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Admin route protection
  if (isAdminPath && !['admin', 'super_admin'].includes(userProfile?.user_type || '')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // SECURITY: Enhanced portal route protection with strict validation
  if (isPortalPath) {
    const userType = userProfile?.user_type || null

    // Validate portal access using normalized path
    if (!validatePortalAccess(path, userType)) {
      console.warn(`[SECURITY] Unauthorized portal access attempt: ${rawPath} by user type: ${userType}`)

      // Redirect based on user type
      if (userType === 'client') {
        return NextResponse.redirect(new URL('/portal/client', req.url))
      } else if (['super_admin', 'admin', 'lawyer', 'staff'].includes(userType || '')) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      } else {
        return NextResponse.redirect(new URL('/login', req.url))
      }
    }

    // Additional security: Ensure clients cannot access any other portal sections
    if (userType === 'client' && !path.startsWith('/portal/client')) {
      console.warn(`[SECURITY] Client attempted to access non-client portal: ${rawPath}`)
      return NextResponse.redirect(new URL('/portal/client', req.url))
    }
  }

  // Default dashboard redirect for authenticated users on root
  if (path === '/' && session) {
    const defaultRedirect = userProfile?.user_type === 'super_admin'
      ? '/platform'
      : userProfile?.user_type === 'client'
        ? '/portal/client'
        : '/dashboard'
    return NextResponse.redirect(new URL(defaultRedirect, req.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
