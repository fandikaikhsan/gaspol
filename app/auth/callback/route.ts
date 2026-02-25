/**
 * OAuth Callback Route
 * Handles the callback from OAuth providers like Google
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/plan'
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Check if user needs onboarding
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: userState } = await supabase
          .from('user_state')
          .select('current_phase')
          .eq('user_id', user.id)
          .single()
        
        // If no user state exists or in onboarding, redirect to onboarding
        if (!userState || userState.current_phase === 'ONBOARDING') {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
