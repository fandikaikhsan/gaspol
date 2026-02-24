/**
 * Finalize Baseline Module API Route
 *
 * Handles baseline module completion:
 * - Records module completion with score
 * - Computes analytics snapshot
 * - Updates user state when all modules complete
 *
 * @see /docs/TROUBLESHOOTING-JWT-ES256.md for why we use API route instead of Edge Function
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

interface FinalizeRequest {
  module_id: string
  score: number
  total_questions: number
  correct_count: number
  started_at: string
}

export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATION
    const supabaseAuth = await createServerClient()
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // 2. PARSE REQUEST
    const body: FinalizeRequest = await request.json()
    const { module_id, score, total_questions, correct_count, started_at } = body

    if (!module_id) {
      return NextResponse.json(
        { error: 'Missing required field: module_id' },
        { status: 400 }
      )
    }

    // 3. CREATE ADMIN CLIENT
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const now = new Date().toISOString()
    const totalTimeSec = started_at
      ? Math.max(0, Math.floor((new Date().getTime() - new Date(started_at).getTime()) / 1000))
      : 0

    // 4. RECORD MODULE COMPLETION
    const { data: completion, error: completionError } = await supabase
      .from('module_completions')
      .insert({
        user_id: user.id,
        module_id,
        context_type: 'baseline',
        score: score || 0,
        total_questions: total_questions || 0,
        correct_count: correct_count || 0,
        total_time_sec: totalTimeSec,
        started_at: started_at || now,
        completed_at: now,
      })
      .select()
      .single()

    if (completionError) {
      console.error('[finalize-baseline] Failed to insert completion:', completionError)
      return NextResponse.json(
        { error: 'Failed to record completion' },
        { status: 500 }
      )
    }

    // 5. COMPUTE CONSTRUCT PROFILE
    const { data: constructStates } = await supabase
      .from('user_construct_state')
      .select('*')
      .eq('user_id', user.id)

    const constructProfile: Record<string, number> = {}
    const constructs = ['teliti', 'speed', 'reasoning', 'computation', 'reading']

    constructs.forEach(construct => {
      const state = constructStates?.find(s => s.construct_name === construct)
      constructProfile[`${construct}_score`] = state?.score || 50
    })

    // Simple readiness score = average of construct scores
    const readinessScore = Object.values(constructProfile).reduce((a, b) => a + b, 0) / constructs.length

    // 6. UPDATE COMPLETION WITH ANALYTICS
    await supabase
      .from('module_completions')
      .update({
        readiness_score: readinessScore,
        construct_profile: constructProfile,
      })
      .eq('id', completion.id)

    // 7. CHECK IF ALL BASELINE MODULES ARE COMPLETE
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
    const allComplete = allModuleIds.length > 0 && allModuleIds.every(id => completedModuleIds.includes(id))

    // 8. UPDATE USER STATE IF ALL COMPLETE
    if (allComplete) {
      // Create baseline_complete snapshot
      await supabase.from('analytics_snapshots').insert({
        user_id: user.id,
        // Legacy columns
        snapshot_type: 'baseline_complete',
        readiness_score: readinessScore,
        ...constructProfile,
        skills_tested: 0,
        skills_strong: 0,
        skills_weak: 0,
        // New JSONB columns
        scope: 'full_baseline',
        readiness: readinessScore,
        constructs: {
          'C.ATTENTION': constructProfile.teliti_score || 50,
          'C.SPEED': constructProfile.speed_score || 50,
          'C.REASONING': constructProfile.reasoning_score || 50,
          'C.COMPUTATION': constructProfile.computation_score || 50,
          'C.READING': constructProfile.reading_score || 50,
        },
      })

      // Update user phase
      await supabase
        .from('user_state')
        .update({
          current_phase: 'BASELINE_COMPLETE',
          baseline_completed_at: now,
        })
        .eq('user_id', user.id)
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[finalize-baseline] Success: user=${user.id}, module=${module_id}, allComplete=${allComplete}`)
    }

    return NextResponse.json({
      success: true,
      completion,
      all_complete: allComplete,
      readiness_score: readinessScore,
    })

  } catch (error) {
    console.error('[finalize-baseline] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
