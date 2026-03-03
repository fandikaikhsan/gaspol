/**
 * Suggest Taxonomy Node API Route — proxies to edge function with SERVICE_ROLE_KEY
 * @see /docs/TROUBLESHOOTING-JWT-ES256.md
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/require-admin'

export async function POST(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireAdmin()
    if (errorResponse) return errorResponse

    const body = await request.json()

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/suggest_taxonomy_node`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ ...body, user_id: user.id }),
      }
    )

    const data = await response.json()
    if (!response.ok) return NextResponse.json(data, { status: response.status })
    return NextResponse.json(data)
  } catch (error) {
    console.error('[admin/suggest-taxonomy-node] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
