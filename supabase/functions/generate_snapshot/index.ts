/**
 * Generate Analytics Snapshot Edge Function
 * Manually trigger snapshot generation for a user or all users
 *
 * Usage:
 * - POST with user_id and scope: Generate snapshot for specific user
 * - POST with scope='daily': Generate daily snapshots for all active users (cron job)
 */

import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface GenerateSnapshotRequest {
  user_id?: string
  scope: "partial_baseline" | "full_baseline" | "cycle_end" | "checkpoint" | "daily"
  generate_all?: boolean // If true with scope='daily', generate for all active users
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Get authorization token
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      throw new Error("Missing authorization header")
    }

    const token = authHeader.replace("Bearer ", "")
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify user token
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData.user) {
      throw new Error("Invalid user token")
    }

    const requestingUserId = userData.user.id

    // Check if user is admin for bulk operations
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", requestingUserId)
      .single()

    const isAdmin = profile?.role === "admin"

    // Parse request body
    const body: GenerateSnapshotRequest = await req.json()
    const { user_id, scope, generate_all } = body

    // Validate scope
    const validScopes = ["partial_baseline", "full_baseline", "cycle_end", "checkpoint", "daily"]
    if (!validScopes.includes(scope)) {
      return new Response(
        JSON.stringify({ error: `Invalid scope. Must be one of: ${validScopes.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // =====================================================
    // OPTION 1: Generate for all active users (admin only)
    // =====================================================
    if (generate_all && scope === "daily") {
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: "Admin access required for bulk snapshot generation" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      // Call the batch function
      const { data: count, error: batchError } = await supabase.rpc("generate_daily_snapshots")

      if (batchError) {
        throw batchError
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Generated ${count} daily snapshots`,
          count: count
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    // =====================================================
    // OPTION 2: Generate for specific user
    // =====================================================
    const targetUserId = user_id || requestingUserId

    // Non-admins can only generate for themselves
    if (!isAdmin && targetUserId !== requestingUserId) {
      return new Response(
        JSON.stringify({ error: "You can only generate snapshots for yourself" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Generate snapshot
    const { data: snapshotId, error: generateError } = await supabase.rpc(
      "generate_analytics_snapshot",
      {
        p_user_id: targetUserId,
        p_scope: scope
      }
    )

    if (generateError) {
      throw generateError
    }

    // Fetch the generated snapshot
    const { data: snapshot, error: fetchError } = await supabase
      .from("analytics_snapshots")
      .select("*")
      .eq("id", snapshotId)
      .single()

    if (fetchError) {
      throw fetchError
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Snapshot generated successfully",
        snapshot: snapshot
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )

  } catch (error) {
    console.error("Generate snapshot error:", error)

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  }
})
