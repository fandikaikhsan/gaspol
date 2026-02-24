/**
 * Generate Snapshot API Route
 *
 * Proxies to generate_snapshot Edge Function with SERVICE_ROLE_KEY.
 * User JWT (ES256) cannot be sent directly to Edge Functions.
 *
 * @see /docs/TROUBLESHOOTING-JWT-ES256.md
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // 1. VERIFY USER
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // 2. PARSE CLIENT BODY
    const body = await request.json().catch(() => ({}))

    // 3. PROXY TO EDGE FUNCTION with SERVICE_ROLE_KEY
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate_snapshot`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          scope: body.scope || 'checkpoint',
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.warn('[generate-snapshot] Edge function failed:', data)
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('[generate-snapshot] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
