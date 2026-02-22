/**
 * finalize_baseline_module Edge Function
 * Phase 2: Question Runner & Assessment Engine
 *
 * LOGIC:
 * 1. Record module completion
 * 2. Compute partial analytics snapshot
 * 3. Update user state if all modules complete
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FinalizeRequest {
  module_id: string
  score: number
  total_questions: number
  correct_count: number
  started_at: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      throw new Error('Unauthorized')
    }

    const body: FinalizeRequest = await req.json()
    const { module_id, score, total_questions, correct_count, started_at } = body

    const now = new Date().toISOString()

    // 1. Record module completion
    const { data: completion, error: completionError } = await supabase
      .from('module_completions')
      .insert({
        user_id: user.id,
        module_id,
        context_type: 'baseline',
        score,
        total_questions,
        correct_count,
        total_time_sec: Math.floor((new Date().getTime() - new Date(started_at).getTime()) / 1000),
        started_at,
      })
      .select()
      .single()

    if (completionError) {
      throw completionError
    }

    // 2. Compute partial analytics (readiness and construct snapshot)
    const { data: constructStates } = await supabase
      .from('user_construct_state')
      .select('*')
      .eq('user_id', user.id)

    const constructProfile: any = {}
    ;['teliti', 'speed', 'reasoning', 'computation', 'reading'].forEach(construct => {
      const state = constructStates?.find(s => s.construct_name === construct)
      constructProfile[`${construct}_score`] = state?.score || 50
    })

    // Simple readiness score = average of construct scores
    const readinessScore = Object.values(constructProfile).reduce((a: any, b: any) => a + b, 0) / 5

    // Update completion record with analytics
    await supabase
      .from('module_completions')
      .update({
        readiness_score: readinessScore,
        construct_profile: constructProfile,
      })
      .eq('id', completion.id)

    // 3. Check if all baseline modules are complete
    const { data: allBaselineModules } = await supabase
      .from('baseline_modules')
      .select('module_id')
      .eq('is_active', true)

    const { data: completedModules } = await supabase
      .from('module_completions')
      .select('module_id')
      .eq('user_id', user.id)
      .eq('context_type', 'baseline')

    const allModuleIds = (allBaselineModules || []).map(m => m.module_id)
    const completedModuleIds = (completedModules || []).map(m => m.module_id)

    const allComplete = allModuleIds.every(id => completedModuleIds.includes(id))

    // 4. Update user state if all complete
    if (allComplete) {
      // Create baseline_complete snapshot
      await supabase.from('analytics_snapshots').insert({
        user_id: user.id,
        snapshot_type: 'baseline_complete',
        readiness_score: readinessScore,
        ...constructProfile,
        skills_tested: 0, // TODO: count from user_skill_state
        skills_strong: 0,
        skills_weak: 0,
      })

      // Update user phase to BASELINE_COMPLETE
      await supabase
        .from('user_state')
        .update({
          current_phase: 'BASELINE_COMPLETE',
          baseline_completed_at: now,
        })
        .eq('user_id', user.id)
    }

    return new Response(
      JSON.stringify({
        success: true,
        completion,
        all_complete: allComplete,
        readiness_score: readinessScore,
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
