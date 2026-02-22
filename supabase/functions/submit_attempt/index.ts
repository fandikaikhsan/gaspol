/**
 * submit_attempt Edge Function
 * Phase 2: Question Runner & Assessment Engine
 *
 * CORE BUSINESS LOGIC:
 * 1. Validate answer
 * 2. Compute score (is_correct)
 * 3. Derive error tags based on question difficulty + time spent
 * 4. Update user_skill_state (accuracy, speed, stability)
 * 5. Update user_construct_state based on construct_weights
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SubmitAttemptRequest {
  question_id: string
  user_answer: string
  time_spent_sec: number
  context_type: 'baseline' | 'drill' | 'mock' | 'recycle' | 'flashcard' | 'swipe'
  context_id: string
  module_id?: string
}

interface Question {
  id: string
  micro_skill_id: string
  difficulty: 'easy' | 'medium' | 'hard'
  cognitive_level: 'L1' | 'L2' | 'L3'
  question_format: 'MCQ5' | 'MCK-Table' | 'Fill-in'
  correct_answer: string
  construct_weights: {
    teliti: number
    speed: number
    reasoning: number
    computation: number
    reading: number
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from auth
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      throw new Error('Unauthorized')
    }

    // Parse request body
    const body: SubmitAttemptRequest = await req.json()
    const { question_id, user_answer, time_spent_sec, context_type, context_id, module_id } = body

    // Fetch question
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', question_id)
      .single()

    if (questionError || !question) {
      throw new Error('Question not found')
    }

    // 1. Validate answer and compute is_correct
    const isCorrect = validateAnswer(
      user_answer,
      question.correct_answer,
      question.question_format
    )

    // 2. Derive error tags
    const errorTags = deriveErrorTags(
      isCorrect,
      question.difficulty,
      time_spent_sec,
      question.cognitive_level
    )

    // 3. Compute construct impacts
    const constructImpacts = computeConstructImpacts(
      isCorrect,
      question.construct_weights,
      errorTags
    )

    // 4. Insert attempt record
    const { data: attempt, error: attemptError } = await supabase
      .from('attempts')
      .insert({
        user_id: user.id,
        question_id,
        context_type,
        context_id,
        module_id,
        user_answer,
        is_correct: isCorrect,
        time_spent_sec,
        error_tags: errorTags,
        construct_impacts: constructImpacts,
      })
      .select()
      .single()

    if (attemptError) {
      throw attemptError
    }

    // 5. Update user_skill_state
    await updateUserSkillState(supabase, user.id, question.micro_skill_id, isCorrect, time_spent_sec)

    // 6. Update user_construct_state
    await updateUserConstructState(supabase, user.id, constructImpacts)

    return new Response(
      JSON.stringify({
        success: true,
        attempt,
        is_correct: isCorrect,
        error_tags: errorTags,
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
 * Validate user answer against correct answer
 */
function validateAnswer(
  userAnswer: string,
  correctAnswer: string,
  format: string
): boolean {
  const cleanUser = userAnswer.trim()
  const cleanCorrect = correctAnswer.trim()

  switch (format) {
    case 'MCQ5':
      // Simple string comparison (A, B, C, D, E)
      return cleanUser.toUpperCase() === cleanCorrect.toUpperCase()

    case 'MCK-Table':
      // Compare arrays of selected cells
      const userCells = cleanUser.split(',').map(s => s.trim()).sort()
      const correctCells = cleanCorrect.split(',').map(s => s.trim()).sort()
      return JSON.stringify(userCells) === JSON.stringify(correctCells)

    case 'Fill-in':
      // Numeric comparison with tolerance
      const userNum = parseFloat(cleanUser)
      const correctNum = parseFloat(cleanCorrect)

      if (!isNaN(userNum) && !isNaN(correctNum)) {
        // Allow 0.1% tolerance for floating point
        const tolerance = Math.abs(correctNum) * 0.001
        return Math.abs(userNum - correctNum) <= tolerance
      }

      // Text comparison (case-insensitive)
      return cleanUser.toLowerCase() === cleanCorrect.toLowerCase()

    default:
      return false
  }
}

/**
 * Derive error tags based on performance
 */
function deriveErrorTags(
  isCorrect: boolean,
  difficulty: string,
  timeSpent: number,
  cognitiveLevel: string
): string[] {
  if (isCorrect) {
    return [] // No error tags for correct answers
  }

  const tags: string[] = []

  // Expected time thresholds (in seconds) by difficulty
  const expectedTime = {
    easy: 60,
    medium: 90,
    hard: 120,
  }

  const threshold = expectedTime[difficulty as keyof typeof expectedTime] || 90

  // Rushing (too fast for difficulty)
  if (timeSpent < threshold * 0.5) {
    tags.push('ceroboh') // careless/rushing
  }

  // Taking too long but still wrong
  if (timeSpent > threshold * 1.5) {
    tags.push('konsep_lemah') // weak conceptual understanding
  }

  // Difficulty-specific tags
  if (difficulty === 'easy') {
    tags.push('fundamental_gap') // Basic concept not mastered
  } else if (difficulty === 'medium') {
    tags.push('kurang_latihan') // Needs more practice
  } else if (difficulty === 'hard') {
    tags.push('advanced_topic') // Advanced topic needs review
  }

  // Cognitive level tags
  if (cognitiveLevel === 'L3') {
    tags.push('analytical_weakness') // Struggle with analysis
  }

  return tags
}

/**
 * Compute construct impacts based on correctness and weights
 */
function computeConstructImpacts(
  isCorrect: boolean,
  constructWeights: Record<string, number>,
  errorTags: string[]
): Record<string, number> {
  const impacts: Record<string, number> = {}

  // Base impact: +weight if correct, -weight if wrong
  const multiplier = isCorrect ? 1 : -1

  for (const [construct, weight] of Object.entries(constructWeights)) {
    impacts[construct] = weight * multiplier

    // Additional penalties based on error tags
    if (!isCorrect) {
      if (errorTags.includes('ceroboh') && construct === 'teliti') {
        impacts[construct] -= 0.1 // Extra penalty for carelessness
      }
      if (errorTags.includes('analytical_weakness') && construct === 'reasoning') {
        impacts[construct] -= 0.1
      }
    }
  }

  return impacts
}

/**
 * Update user_skill_state for the micro-skill
 */
async function updateUserSkillState(
  supabase: any,
  userId: string,
  microSkillId: string,
  isCorrect: boolean,
  timeSpent: number
) {
  // Fetch current state
  const { data: currentState } = await supabase
    .from('user_skill_state')
    .select('*')
    .eq('user_id', userId)
    .eq('micro_skill_id', microSkillId)
    .single()

  const now = new Date().toISOString()

  if (!currentState) {
    // Create new state
    await supabase.from('user_skill_state').insert({
      user_id: userId,
      micro_skill_id: microSkillId,
      accuracy: isCorrect ? 100 : 0,
      avg_speed_index: 50, // Neutral start
      stability: 100,
      attempt_count: 1,
      correct_count: isCorrect ? 1 : 0,
      total_time_sec: timeSpent,
      avg_time_sec: timeSpent,
      mastery_level: 'developing',
      last_attempted_at: now,
    })
  } else {
    // Update existing state
    const newAttemptCount = currentState.attempt_count + 1
    const newCorrectCount = currentState.correct_count + (isCorrect ? 1 : 0)
    const newAccuracy = (newCorrectCount / newAttemptCount) * 100

    const newTotalTime = currentState.total_time_sec + timeSpent
    const newAvgTime = newTotalTime / newAttemptCount

    // Determine mastery level
    let masteryLevel = 'developing'
    if (newAccuracy >= 80 && newAttemptCount >= 5) {
      masteryLevel = 'strong'
    } else if (newAccuracy < 50) {
      masteryLevel = 'weak'
    }

    await supabase
      .from('user_skill_state')
      .update({
        accuracy: newAccuracy,
        attempt_count: newAttemptCount,
        correct_count: newCorrectCount,
        total_time_sec: newTotalTime,
        avg_time_sec: newAvgTime,
        mastery_level: masteryLevel,
        last_attempted_at: now,
      })
      .eq('user_id', userId)
      .eq('micro_skill_id', microSkillId)
  }
}

/**
 * Update user_construct_state with impacts
 */
async function updateUserConstructState(
  supabase: any,
  userId: string,
  impacts: Record<string, number>
) {
  const constructs = ['teliti', 'speed', 'reasoning', 'computation', 'reading']

  for (const construct of constructs) {
    const impact = impacts[construct] || 0

    // Fetch current state
    const { data: currentState } = await supabase
      .from('user_construct_state')
      .select('*')
      .eq('user_id', userId)
      .eq('construct_name', construct)
      .single()

    const now = new Date().toISOString()

    if (!currentState) {
      // Create new state (start at 50)
      const newScore = Math.max(0, Math.min(100, 50 + impact * 10))

      await supabase.from('user_construct_state').insert({
        user_id: userId,
        construct_name: construct,
        score: newScore,
        confidence: 10, // Low confidence initially
        trend: 'stable',
        data_points: 1,
        last_updated_at: now,
      })
    } else {
      // Update existing state
      const newDataPoints = currentState.data_points + 1
      const newScore = Math.max(0, Math.min(100, currentState.score + impact * 5))

      // Determine trend
      let trend = 'stable'
      if (newScore > currentState.score + 2) {
        trend = 'improving'
      } else if (newScore < currentState.score - 2) {
        trend = 'declining'
      }

      // Increase confidence with more data
      const newConfidence = Math.min(90, currentState.confidence + 2)

      await supabase
        .from('user_construct_state')
        .update({
          score: newScore,
          confidence: newConfidence,
          trend,
          data_points: newDataPoints,
          last_updated_at: now,
        })
        .eq('user_id', userId)
        .eq('construct_name', construct)
    }
  }
}
