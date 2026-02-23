/**
 * Generate Plan API Route
 *
 * Proxies to generate_plan Edge Function with proper auth verification.
 * The Edge Function handles AI plan generation.
 *
 * Note: Edge Function uses SERVICE_ROLE_KEY internally, so JWT is passed
 * for user identification only after we verify auth here.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATE USER FIRST
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // 2. GET SESSION FOR FORWARDING
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.access_token) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      )
    }

    // 3. PROXY TO EDGE FUNCTION
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate_plan`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({}),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.warn('[generate-plan] Edge function failed:', data)
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('[generate-plan] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
