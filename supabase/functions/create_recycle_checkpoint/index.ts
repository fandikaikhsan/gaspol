/**
 * Create Recycle Checkpoint Edge Function
 *
 * Creates a targeted checkpoint module from the user's weak skills:
 * 1. Fetches weak skills from user_skill_state
 * 2. Selects published questions targeting those micro-skills
 * 3. Creates a module (type 'recycle') with those questions
 * 4. Inserts a recycle_checkpoints row
 * 5. Returns checkpoint ID + module ID
 */

import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse body for user_id (API route proxy pattern)
    const body = await req.json().catch(() => ({}))
    let userId: string

    if (body.user_id) {
      // Called from API route with SERVICE_ROLE_KEY — user_id pre-verified
      userId = body.user_id
    } else {
      // Direct call with user JWT (legacy/fallback)
      const authHeader = req.headers.get("Authorization")
      if (!authHeader) {
        throw new Error("Missing authorization header")
      }
      const token = authHeader.replace("Bearer ", "")
      const { data: userData, error: userError } = await supabase.auth.getUser(token)
      if (userError || !userData.user) {
        throw new Error("Invalid user token")
      }
      userId = userData.user.id
    }

    // Get user state for cycle_id
    const { data: userState, error: stateError } = await supabase
      .from("user_state")
      .select("current_cycle_id")
      .eq("user_id", userId)
      .single()

    if (stateError || !userState?.current_cycle_id) {
      return new Response(
        JSON.stringify({ error: "No active cycle found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    // Get weak skills
    const { data: weakSkills, error: skillsError } = await supabase
      .from("user_skill_state")
      .select("micro_skill_id")
      .eq("user_id", userId)
      .eq("mastery_level", "weak")

    if (skillsError) {
      throw new Error(`Failed to fetch weak skills: ${skillsError.message}`)
    }

    const weakSkillIds = (weakSkills || []).map((s) => s.micro_skill_id)

    if (weakSkillIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "No weak skills found. Keep practicing!" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    // Select published questions targeting weak skills
    const { data: questions, error: questionsError } = await supabase
      .from("questions")
      .select("id")
      .in("micro_skill_id", weakSkillIds)
      .eq("status", "published")
      .limit(60)

    if (questionsError) {
      throw new Error(`Failed to fetch questions: ${questionsError.message}`)
    }

    if (!questions || questions.length === 0) {
      return new Response(
        JSON.stringify({ error: "No questions available for weak skills" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    // Shuffle and take up to 20 questions
    const shuffled = questions.sort(() => Math.random() - 0.5)
    const selectedQuestions = shuffled.slice(0, Math.min(20, shuffled.length))
    const questionIds = selectedQuestions.map((q) => q.id)

    // Get existing checkpoint count for numbering
    const { count: checkpointCount } = await supabase
      .from("recycle_checkpoints")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("cycle_id", userState.current_cycle_id)

    // Create module
    const { data: module, error: moduleError } = await supabase
      .from("modules")
      .insert({
        name: `Recycle Checkpoint #${(checkpointCount || 0) + 1}`,
        module_type: "recycle",
        question_count: questionIds.length,
        question_ids: questionIds,
        is_active: true,
      })
      .select("id")
      .single()

    if (moduleError || !module) {
      throw new Error(`Failed to create module: ${moduleError?.message}`)
    }

    // Create before snapshot reference
    const { data: latestSnapshot } = await supabase
      .from("analytics_snapshots")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    // Insert recycle checkpoint
    const { data: checkpoint, error: checkpointError } = await supabase
      .from("recycle_checkpoints")
      .insert({
        user_id: userId,
        cycle_id: userState.current_cycle_id,
        checkpoint_number: (checkpointCount || 0) + 1,
        target_weak_skills: weakSkillIds,
        module_id: module.id,
        question_count: questionIds.length,
        before_snapshot_id: latestSnapshot?.id || null,
      })
      .select("id")
      .single()

    if (checkpointError || !checkpoint) {
      throw new Error(`Failed to create checkpoint: ${checkpointError?.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        checkpoint_id: checkpoint.id,
        module_id: module.id,
        question_count: questionIds.length,
        weak_skills_targeted: weakSkillIds.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error("create_recycle_checkpoint error:", error)
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }
})
