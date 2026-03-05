/**
 * Admin Role Guard for API Route Handlers
 * Usage:
 *   const { user, supabase, errorResponse } = await requireAdmin()
 *   if (errorResponse) return errorResponse
 */
import { NextResponse } from "next/server"
import { createClient } from "./server"

export async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      user: null,
      supabase,
      errorResponse: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      ),
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") {
    return {
      user,
      supabase,
      errorResponse: NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      ),
    }
  }

  return { user, supabase, errorResponse: null }
}
