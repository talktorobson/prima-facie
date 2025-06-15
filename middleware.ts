import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Database } from '@/types/database'

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  // Check if using mock authentication
  const USE_MOCK_AUTH = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true'
  
  let session = null
  let userProfile = null

  if (USE_MOCK_AUTH) {
    // For mock auth, check if user is stored in cookie
    const mockUser = req.cookies.get('mock_auth_user')?.value
    if (mockUser) {
      try {
        const user = JSON.parse(mockUser)
        session = { user: { id: user.id, email: user.email } }
        userProfile = user.profile
      } catch (error) {
        console.error('Error parsing mock auth cookie:', error)
      }
    }
  } else {
    // Use Supabase authentication
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
  }

  const path = req.nextUrl.pathname

  // Route definitions
  const publicPaths = ['/', '/pricing', '/about', '/contact']
  const authPaths = ['/login', '/register', '/forgot-password', '/reset-password']
  const dashboardPaths = ['/dashboard', '/matters', '/clients', '/billing', '/calendar', '/tasks', '/documents', '/reports', '/settings']
  const adminPaths = ['/admin']
  const portalPaths = ['/portal/client', '/portal/staff']

  const isPublicPath = publicPaths.includes(path)
  const isAuthPath = authPaths.some((authPath) => path.startsWith(authPath))
  const isDashboardPath = dashboardPaths.some((dashboardPath) => path.startsWith(dashboardPath))
  const isAdminPath = adminPaths.some((adminPath) => path.startsWith(adminPath))
  const isPortalPath = portalPaths.some((portalPath) => path.startsWith(portalPath))

  // Allow public paths
  if (isPublicPath) {
    return response
  }

  // Redirect to login if accessing protected routes without session
  if (!session && (isDashboardPath || isAdminPath || isPortalPath)) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users away from auth pages
  if (session && isAuthPath) {
    const defaultRedirect = userProfile?.user_type === 'client' ? '/portal/client' : '/dashboard'
    return NextResponse.redirect(new URL(defaultRedirect, req.url))
  }

  // Admin route protection
  if (isAdminPath && userProfile?.user_type !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Portal route protection
  if (isPortalPath) {
    if (path.startsWith('/portal/client') && userProfile?.user_type !== 'client') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    
    if (path.startsWith('/portal/staff') && !['admin', 'lawyer', 'staff'].includes(userProfile?.user_type || '')) {
      return NextResponse.redirect(new URL('/portal/client', req.url))
    }
  }

  // Default dashboard redirect for authenticated users on root
  if (path === '/' && session) {
    const defaultRedirect = userProfile?.user_type === 'client' ? '/portal/client' : '/dashboard'
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