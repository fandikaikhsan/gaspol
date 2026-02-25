/**
 * Middleware for Authentication and Route Protection
 * Phase 1: Authentication & State Machine
 */

import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Update session and get user
  const { response, user, supabase } = await updateSession(request)

  const path = request.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/', '/auth/callback']
  const isPublicRoute = publicRoutes.includes(path) || path.startsWith('/auth/')

  // Admin routes
  const isAdminRoute = path.startsWith('/admin')

  // Shared routes (both student and admin)
  const isSharedRoute = path.startsWith('/settings')

  // Student routes
  const isStudentRoute =
    path.startsWith('/onboarding') ||
    path.startsWith('/baseline') ||
    path.startsWith('/plan') ||
    path.startsWith('/locked-in') ||
    path.startsWith('/taktis') ||
    path.startsWith('/analytics') ||
    path.startsWith('/recycle')

  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated
  if (user) {
    // Get user profile and state
    const [{ data: profile }, { data: userState }] = await Promise.all([
      supabase.from('profiles').select('role').eq('id', user.id).single(),
      supabase.from('user_state').select('current_phase').eq('user_id', user.id).single(),
    ])

    // Redirect to login if profile not found (shouldn't happen)
    if (!profile) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      return NextResponse.redirect(redirectUrl)
    }

    const isAdmin = profile.role === 'admin'

    // Admin role check
    if (isAdminRoute && !isAdmin) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/plan'
      return NextResponse.redirect(redirectUrl)
    }

    // Student trying to access admin routes (but allow shared routes)
    if (isStudentRoute && isAdmin && !isSharedRoute) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/admin'
      return NextResponse.redirect(redirectUrl)
    }

    // Redirect authenticated users away from login/signup
    if (path === '/login' || path === '/signup') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = isAdmin ? '/admin' : '/plan'
      return NextResponse.redirect(redirectUrl)
    }

    // Redirect from root to appropriate dashboard
    if (path === '/') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = isAdmin ? '/admin' : '/plan'
      return NextResponse.redirect(redirectUrl)
    }

    // PHASE-BASED ROUTING GUARD (students only)
    // Ensure students can't skip onboarding or access features they haven't unlocked
    if (!isAdmin && isStudentRoute && userState?.current_phase) {
      const phase = userState.current_phase

      // Users in ONBOARDING must complete onboarding first
      if (phase === 'ONBOARDING' && !path.startsWith('/onboarding')) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/onboarding'
        return NextResponse.redirect(redirectUrl)
      }

      // Users who completed onboarding should not go back to it
      if (phase !== 'ONBOARDING' && path.startsWith('/onboarding')) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/plan'
        return NextResponse.redirect(redirectUrl)
      }

      // Users in BASELINE phase can only access baseline + analytics
      if (phase === 'BASELINE_ASSESSMENT_IN_PROGRESS' &&
          !path.startsWith('/baseline') && !path.startsWith('/analytics')) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/baseline'
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
