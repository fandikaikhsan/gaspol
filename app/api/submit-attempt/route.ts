/**
 * Submit Attempt API Route
 *
 * Handles student answer submissions with:
 * - Proper authentication verification using Supabase SDK
 * - Service role for database operations (due to ES256 JWT incompatibility with Edge Functions)
 * - Answer correctness computation
 * - Error tagging for analytics
 *
 * @see /docs/TROUBLESHOOTING-JWT-ES256.md for ES256 context
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

// Rate limiting - simple in-memory store (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 60 // requests per minute
const RATE_WINDOW = 60 * 1000 // 1 minute in ms

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_WINDOW })
    return true
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false
  }

  userLimit.count++
  return true
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. AUTHENTICATION - Verify user session using Supabase SDK
    const supabaseAuth = await createServerClient()
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      console.warn('[submit-attempt] Auth failed:', authError?.message)
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = user.id

    // 2. RATE LIMITING
    if (!checkRateLimit(userId)) {
      console.warn('[submit-attempt] Rate limit exceeded for user:', userId)
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429 }
      )
    }

    // 3. PARSE REQUEST BODY
    const body = await request.json()
    const {
      question_id,
      selected_answer,
      time_spent_sec,
      context_type,
      context_id,
      module_id,
    } = body

    // 4. VALIDATE REQUIRED FIELDS
    if (!question_id) {
      return NextResponse.json(
        { error: 'Missing required field: question_id' },
        { status: 400 }
      )
    }

    if (selected_answer === undefined || selected_answer === null) {
      return NextResponse.json(
        { error: 'Missing required field: selected_answer' },
        { status: 400 }
      )
    }

    if (time_spent_sec === undefined || time_spent_sec === null) {
      return NextResponse.json(
        { error: 'Missing required field: time_spent_sec' },
        { status: 400 }
      )
    }

    // Validate time_spent_sec is a reasonable number
    if (typeof time_spent_sec !== 'number' || time_spent_sec < 0 || time_spent_sec > 7200) {
      return NextResponse.json(
        { error: 'Invalid time_spent_sec: must be between 0 and 7200 seconds' },
        { status: 400 }
      )
    }

    // 5. CREATE SERVICE ROLE CLIENT FOR DATABASE OPERATIONS
    // We use service role because:
    // - ES256 JWT incompatibility prevents Edge Function usage
    // - Service role bypasses RLS, but we validate user_id ourselves
    // - This is secure because we verified the user above
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 6. FETCH QUESTION DATA
    const { data: question, error: questionError } = await supabaseAdmin
      .from('questions')
      .select('id, question_type, question_format, difficulty, time_estimate_seconds, construct_weights, is_active, options, correct_answer')
      .eq('id', question_id)
      .single()

    if (questionError || !question) {
      console.warn('[submit-attempt] Question not found:', question_id, questionError?.message)
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }

    if (!question.is_active) {
      return NextResponse.json(
        { error: 'Question is not active' },
        { status: 403 }
      )
    }

    // 7. COMPUTE CORRECTNESS
    const correctAnswer = question.correct_answer
    const questionFormat = question.question_format || question.question_type || 'MCQ5'
    let isCorrect = false

    if (questionFormat.includes('MCQ') || question.question_type === 'MCQ') {
      // Single choice - exact string match
      isCorrect = typeof selected_answer === 'string' &&
        typeof correctAnswer === 'string' &&
        selected_answer.toUpperCase() === correctAnswer.toUpperCase()
    } else if (questionFormat.includes('MCK') || question.question_type === 'MCK') {
      // Multiple choice - all answers must match
      if (Array.isArray(selected_answer)) {
        const userAnswers = selected_answer.map(a => String(a).toUpperCase()).sort()
        const correctAnswers = Array.isArray(correctAnswer)
          ? correctAnswer.map(a => String(a).toUpperCase()).sort()
          : typeof correctAnswer === 'string'
            ? correctAnswer.split(',').map(a => a.trim().toUpperCase()).sort()
            : []
        isCorrect = JSON.stringify(userAnswers) === JSON.stringify(correctAnswers)
      }
    } else if (questionFormat.includes('Fill')) {
      // Fill-in - normalized string comparison
      const normalizeAnswer = (ans: string) => ans.trim().toLowerCase().replace(/\s+/g, ' ')
      isCorrect = typeof selected_answer === 'string' &&
        typeof correctAnswer === 'string' &&
        normalizeAnswer(selected_answer) === normalizeAnswer(correctAnswer)
    }

    // 8. INSERT ATTEMPT RECORD
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('attempts')
      .insert({
        user_id: userId,
        question_id: question_id,
        module_id: module_id || null,
        is_correct: isCorrect,
        user_answer: JSON.stringify({ selected: selected_answer }),
        time_spent_sec: Math.round(time_spent_sec),
        context_type: context_type || 'baseline',
        context_id: context_id || null,
      })
      .select('id')
      .single()

    if (attemptError) {
      // Handle duplicate attempt (unique constraint violation)
      if (attemptError.code === '23505') {
        console.warn('[submit-attempt] Duplicate attempt detected:', userId, question_id, context_id)

        // Fetch the existing attempt instead
        const { data: existingAttempt } = await supabaseAdmin
          .from('attempts')
          .select('id, is_correct, user_answer')
          .eq('user_id', userId)
          .eq('question_id', question_id)
          .eq('context_id', context_id)
          .single()

        if (existingAttempt) {
          return NextResponse.json({
            success: true,
            attempt_id: existingAttempt.id,
            is_correct: existingAttempt.is_correct,
            correct_answer: correctAnswer,
            already_submitted: true,
            message: 'This question was already answered'
          })
        }
      }

      console.error('[submit-attempt] Failed to insert attempt:', attemptError)
      return NextResponse.json(
        { error: 'Failed to save attempt' },
        { status: 500 }
      )
    }

    // 9. APPLY ERROR TAGS (async, non-blocking)
    // Determine which error tags to apply based on performance signals
    const expectedTime = question.time_estimate_seconds || 120
    const timeRatio = time_spent_sec / expectedTime

    // Build list of potential error tag IDs based on rules
    const potentialTags: Array<{ tag_id: string; confidence: number }> = []

    // Time-based tags
    if (timeRatio > 1.5) {
      potentialTags.push({ tag_id: 'ERR.SLOW', confidence: 1.0 })
    }
    if (timeRatio < 0.3) {
      potentialTags.push({ tag_id: 'ERR.RUSHED', confidence: 1.0 })
    }

    // Performance-based tags (only for incorrect answers)
    if (!isCorrect) {
      if (timeRatio < 0.6) {
        potentialTags.push({ tag_id: 'ERR.CARELESS', confidence: 0.8 })
      }
      if (timeRatio > 1.3) {
        potentialTags.push({ tag_id: 'ERR.STRUGGLE', confidence: 0.8 })
      }
    }

    // Only insert tags that exist in the database (fire and forget)
    if (potentialTags.length > 0) {
      const tagIds = potentialTags.map(t => t.tag_id)

      // Fetch existing tags from database
      supabaseAdmin
        .from('tags')
        .select('id')
        .in('id', tagIds)
        .eq('is_active', true)
        .then(({ data: existingTags, error: tagError }) => {
          if (tagError) {
            console.warn('[submit-attempt] Failed to fetch tags:', tagError.message)
            return
          }

          // Only insert tags that exist
          const validTagIds = new Set(existingTags?.map(t => t.id) || [])
          const errorTags = potentialTags
            .filter(t => validTagIds.has(t.tag_id))
            .map(t => ({
              attempt_id: attempt.id,
              tag_id: t.tag_id,
              source: 'rule',
              confidence: t.confidence
            }))

          if (errorTags.length > 0) {
            supabaseAdmin.from('attempt_error_tags').insert(errorTags).then(({ error }) => {
              if (error) console.error('[submit-attempt] Failed to insert error tags:', error)
            })
          }
        })
    }

    // 10. LOG SUCCESS (in development only)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[submit-attempt] Success: user=${userId}, question=${question_id}, correct=${isCorrect}, time=${Date.now() - startTime}ms`)
    }

    // 11. RETURN RESPONSE
    return NextResponse.json({
      success: true,
      attempt_id: attempt.id,
      is_correct: isCorrect,
      correct_answer: correctAnswer,
      time_spent_sec: Math.round(time_spent_sec),
      feedback: {
        is_correct: isCorrect,
        message: isCorrect
          ? 'Correct! Great job!'
          : 'Incorrect. Review the explanation to understand why.',
        error_tags: errorTags.map(t => t.tag_id),
        difficulty: question.difficulty
      }
    })

  } catch (error) {
    console.error('[submit-attempt] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
