import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * ROLE → ALLOWED PATH PREFIX MAP
 * Each role may only navigate within its own prefix.
 * SUPER_ADMIN is an alias handled identically to ADMIN.
 */
const ROLE_PREFIX: Record<string, string> = {
  ADMIN: '/admin',
  SUPER_ADMIN: '/admin',
  STAFF: '/staff',
  TEACHER: '/teacher',
  FACULTY: '/staff',
  STUDENT: '/student',
}

/** Routes that are always publicly accessible — no auth required. */
const PUBLIC_PATHS = new Set(['/', '/login', '/unauthorized'])

/**
 * Prefixes that are always open (print previews, API handlers,
 * Next.js internals). Keep this list as short as possible.
 */
const PUBLIC_PREFIXES = ['/print', '/api', '/_next']

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
}

/**
 * Returns the role-specific home dashboard path.
 */
function roleHome(role: string) {
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') return '/admin/dashboard'
  if (role === 'STAFF') return '/staff/dashboard'
  if (role === 'TEACHER') return '/teacher'
  if (role === 'FACULTY') return '/staff/dashboard'
  if (role === 'STUDENT') return '/student/dashboard'
  return '/login'
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── 1. Always allow public paths ────────────────────────────────────
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // ── 2. Build a lightweight supabase client that can read cookies ─────
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write refreshed session cookies back to the response
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() validates the JWT with Supabase — more secure than getSession()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ── 3. Not authenticated → redirect to /login ────────────────────────
  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── 4. Authenticated — fetch role from profiles ──────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role as string | undefined

  // No profile / unknown role → kick to unauthorized
  if (!role || !ROLE_PREFIX[role]) {
    const unauthorized = request.nextUrl.clone()
    unauthorized.pathname = '/unauthorized'
    return NextResponse.redirect(unauthorized)
  }

  // ── 5. Role-based path enforcement ───────────────────────────────────
  const allowedPrefix = ROLE_PREFIX[role]

  // Admin and Super-Admin may also access /principal/*
  const isAdminAccessingPrincipal =
    (role === 'ADMIN' || role === 'SUPER_ADMIN') &&
    pathname.startsWith('/principal')

  // Admin/Super-Admin impersonation:
  // Allow access to /student/* or /staff/* when ?viewAs= / ?viewAsStudentId= / ?viewAsStaffId= query param is present.
  const viewAsParam =
    request.nextUrl.searchParams.get('viewAs') ||
    request.nextUrl.searchParams.get('viewAsStudentId') ||
    request.nextUrl.searchParams.get('viewAsStaffId')
  const isImpersonating =
    (role === 'ADMIN' || role === 'SUPER_ADMIN') &&
    !!viewAsParam &&
    (pathname.startsWith('/student') || pathname.startsWith('/staff'))

  const isTeacherAccess =
    (role === 'STAFF' || role === 'TEACHER' || role === 'FACULTY') &&
    (pathname.startsWith('/staff') || pathname.startsWith('/teacher'))

  const pathIsAllowed =
    pathname.startsWith(allowedPrefix) ||
    isAdminAccessingPrincipal ||
    isImpersonating ||
    isTeacherAccess

  if (!pathIsAllowed) {
    // Redirect to their correct home rather than a blank 403
    const home = request.nextUrl.clone()
    home.pathname = roleHome(role)
    return NextResponse.redirect(home)
  }

  // ── 6. All good — return the response with refreshed cookies ─────────
  return response
}

export const config = {
  // Run on everything except static assets, images, and favicons
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
