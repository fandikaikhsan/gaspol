/**
 * generate_plan Edge Function
 * Phase 4: Plan Generation & Task System
 *
 * ADAPTIVE PLANNING ENGINE:
 * 1. Read latest analytics snapshot
 * 2. Identify weak skills (red zone)
 * 3. Calculate task count based on package_days + time_budget
 * 4. Generate balanced task mix (drill_focus, drill_mixed, mock, flashcard, review)
 * 5. Create plan_cycle and plan_tasks
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse body first to check for user_id (API route proxy pattern)
    const body = await req.json().catch(() => ({}))

    let userId: string

    if (body.user_id) {
      // Called from API route with SERVICE_ROLE_KEY — user_id pre-verified
      userId = body.user_id
    } else {
      // Direct call with user JWT (legacy/fallback)
      const authHeader = req.headers.get('Authorization')!
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      if (!user) {
        throw new Error('Unauthorized')
      }
      userId = user.id
    }

    // 1. Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('package_days, time_budget_min')
      .eq('id', userId)
      .single()

    if (!profile || !profile.package_days || !profile.time_budget_min) {
      const missing = []
      if (!profile?.package_days) missing.push('package_days')
      if (!profile?.time_budget_min) missing.push('time_budget_min')
      return new Response(
        JSON.stringify({
          error: 'User profile incomplete',
          detail: `Missing fields: ${missing.join(', ')}. Please complete onboarding first.`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Get latest analytics snapshot
    const { data: snapshot } = await supabase
      .from('analytics_snapshots')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // 3. Identify weak skills
    const { data: weakSkills } = await supabase
      .from('user_skill_state')
      .select('micro_skill_id, accuracy')
      .eq('user_id', userId)
      .lt('accuracy', 60)
      .order('accuracy')
      .limit(10)

    const weakSkillIds = (weakSkills || []).map(s => s.micro_skill_id)

    // 4. Calculate plan parameters
    const daysRemaining = profile.package_days
    const dailyTimeBudget = profile.time_budget_min

    // Task count formula: 3-7 tasks per cycle
    // More time = more tasks
    let taskCount = 3
    if (dailyTimeBudget >= 120) taskCount = 7
    else if (dailyTimeBudget >= 90) taskCount = 6
    else if (dailyTimeBudget >= 60) taskCount = 5
    else if (dailyTimeBudget >= 30) taskCount = 4

    // 5. Calculate task mix
    const taskMix = calculateTaskMix(taskCount, daysRemaining, weakSkillIds.length)

    // 6. Get current cycle number
    const { data: existingCycles } = await supabase
      .from('plan_cycles')
      .select('cycle_number')
      .eq('user_id', userId)
      .order('cycle_number', { ascending: false })
      .limit(1)

    const cycleNumber = existingCycles && existingCycles.length > 0
      ? existingCycles[0].cycle_number + 1
      : 1

    // 7. Create plan cycle
    const { data: cycle, error: cycleError } = await supabase
      .from('plan_cycles')
      .insert({
        user_id: userId,
        cycle_number: cycleNumber,
        start_date: new Date().toISOString().split('T')[0],
        target_days_remaining: daysRemaining,
        generated_from_snapshot_id: snapshot?.id,
        weak_skills: weakSkillIds,
        task_count: taskCount,
        drill_focus_count: taskMix.drill_focus,
        drill_mixed_count: taskMix.drill_mixed,
        mock_count: taskMix.mock,
        flashcard_count: taskMix.flashcard,
        review_count: taskMix.review,
        required_task_count: Math.ceil(taskCount * 0.7), // 70% required
      })
      .select()
      .single()

    if (cycleError) throw cycleError

    // 8. Create individual tasks
    const tasks = []
    let taskOrder = 1

    // Drill focused tasks
    for (let i = 0; i < taskMix.drill_focus; i++) {
      const targetSkillId = weakSkillIds[i % weakSkillIds.length]
      tasks.push({
        cycle_id: cycle.id,
        user_id: userId,
        task_type: 'drill_focus',
        task_order: taskOrder++,
        is_required: taskOrder <= cycle.required_task_count,
        target_node_id: targetSkillId,
        title: `Focused Drill ${i + 1}`,
        subtitle: 'Target your weak areas',
        estimated_duration_min: 15,
      })
    }

    // Drill mixed tasks
    for (let i = 0; i < taskMix.drill_mixed; i++) {
      tasks.push({
        cycle_id: cycle.id,
        user_id: userId,
        task_type: 'drill_mixed',
        task_order: taskOrder++,
        is_required: taskOrder <= cycle.required_task_count,
        title: `Mixed Practice ${i + 1}`,
        subtitle: 'Varied question types',
        estimated_duration_min: 20,
      })
    }

    // Mock test tasks
    for (let i = 0; i < taskMix.mock; i++) {
      tasks.push({
        cycle_id: cycle.id,
        user_id: userId,
        task_type: 'mock',
        task_order: taskOrder++,
        is_required: true, // Mocks always required
        title: `Mock Test ${i + 1}`,
        subtitle: 'Full exam simulation',
        estimated_duration_min: 45,
      })
    }

    // Flashcard tasks
    for (let i = 0; i < taskMix.flashcard; i++) {
      tasks.push({
        cycle_id: cycle.id,
        user_id: userId,
        task_type: 'flashcard',
        task_order: taskOrder++,
        is_required: false,
        title: `Quick Review ${i + 1}`,
        subtitle: 'Flashcard practice',
        estimated_duration_min: 10,
      })
    }

    // Review tasks
    for (let i = 0; i < taskMix.review; i++) {
      tasks.push({
        cycle_id: cycle.id,
        user_id: userId,
        task_type: 'review',
        task_order: taskOrder++,
        is_required: false,
        title: `Past Mistakes Review ${i + 1}`,
        subtitle: 'Learn from errors',
        estimated_duration_min: 15,
      })
    }

    const { error: tasksError } = await supabase
      .from('plan_tasks')
      .insert(tasks)

    if (tasksError) throw tasksError

    // 9. Update user state
    await supabase
      .from('user_state')
      .update({
        current_phase: 'PLAN_ACTIVE',
        current_cycle_id: cycle.id,
        cycle_start_date: new Date().toISOString(),
      })
      .eq('user_id', userId)

    // 10. Create cycle_start snapshot
    await supabase.from('analytics_snapshots').insert({
      user_id: userId,
      snapshot_type: 'cycle_start',
      snapshot_context_id: cycle.id,
      readiness_score: snapshot?.readiness_score || 0,
      teliti_score: snapshot?.teliti_score || 50,
      speed_score: snapshot?.speed_score || 50,
      reasoning_score: snapshot?.reasoning_score || 50,
      computation_score: snapshot?.computation_score || 50,
      reading_score: snapshot?.reading_score || 50,
    })

    return new Response(
      JSON.stringify({
        success: true,
        cycle,
        task_count: tasks.length,
        required_count: cycle.required_task_count,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

/**
 * Calculate task mix based on parameters
 */
function calculateTaskMix(
  totalTasks: number,
  daysRemaining: number,
  weakSkillCount: number
): {
  drill_focus: number
  drill_mixed: number
  mock: number
  flashcard: number
  review: number
} {
  // Task allocation strategy:
  // - More weak skills = more focused drills
  // - Fewer days = more mocks
  // - Always include variety

  const mix = {
    drill_focus: 0,
    drill_mixed: 0,
    mock: 0,
    flashcard: 0,
    review: 0,
  }

  let remaining = totalTasks

  // 1. Always include at least 1 mock (if enough tasks)
  if (totalTasks >= 5 || daysRemaining <= 7) {
    mix.mock = 1
    remaining--
  }

  // 2. Focused drills for weak areas
  if (weakSkillCount > 0) {
    mix.drill_focus = Math.min(Math.ceil(remaining * 0.4), weakSkillCount, 3)
    remaining -= mix.drill_focus
  }

  // 3. Mixed drills for variety
  mix.drill_mixed = Math.min(Math.ceil(remaining * 0.4), 2)
  remaining -= mix.drill_mixed

  // 4. Split remaining between flashcards and review
  mix.flashcard = Math.floor(remaining / 2)
  mix.review = remaining - mix.flashcard

  return mix
}
