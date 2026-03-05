/**
 * Submit Attempt API Route
 *
 * Handles student answer submissions with:
 * - Proper authentication verification using Supabase SDK
 * - Service role for database operations (due to ES256 JWT incompatibility with Edge Functions)
 * - Answer correctness computation via shared scoring lib
 * - Error tagging for analytics
 *
 * @see /docs/TROUBLESHOOTING-JWT-ES256.md for ES256 context
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import {
  checkCorrectness,
  calculatePointsAwarded,
  deriveErrorTags,
  calculateAllConstructImpacts,
  computeNewConstructScore,
  determineTrend,
} from "@/lib/assessment/scoring"

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
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      console.warn("[submit-attempt] Auth failed:", authError?.message)
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      )
    }

    const userId = user.id

    // 2. RATE LIMITING
    if (!checkRateLimit(userId)) {
      console.warn("[submit-attempt] Rate limit exceeded for user:", userId)
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 },
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
        { error: "Missing required field: question_id" },
        { status: 400 },
      )
    }

    if (selected_answer === undefined || selected_answer === null) {
      return NextResponse.json(
        { error: "Missing required field: selected_answer" },
        { status: 400 },
      )
    }

    if (time_spent_sec === undefined || time_spent_sec === null) {
      return NextResponse.json(
        { error: "Missing required field: time_spent_sec" },
        { status: 400 },
      )
    }

    // Validate time_spent_sec is a reasonable number
    if (
      typeof time_spent_sec !== "number" ||
      time_spent_sec < 0 ||
      time_spent_sec > 7200
    ) {
      return NextResponse.json(
        { error: "Invalid time_spent_sec: must be between 0 and 7200 seconds" },
        { status: 400 },
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
          persistSession: false,
        },
      },
    )

    // 6. FETCH QUESTION DATA
    const { data: question, error: questionError } = await supabaseAdmin
      .from("questions")
      .select(
        "id, question_type, question_format, difficulty, difficulty_level, point_value, micro_skill_id, time_estimate_seconds, construct_weights, is_active, options, correct_answer",
      )
      .eq("id", question_id)
      .single()

    if (questionError || !question) {
      console.warn(
        "[submit-attempt] Question not found:",
        question_id,
        questionError?.message,
      )
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    if (!question.is_active) {
      return NextResponse.json(
        { error: "Question is not active" },
        { status: 403 },
      )
    }

    // 7. COMPUTE CORRECTNESS (using shared scoring lib — case-insensitive)
    const correctAnswer = question.correct_answer
    const questionFormat =
      question.question_format || question.question_type || "MCQ5"
    const isCorrect = checkCorrectness(
      questionFormat,
      selected_answer,
      correctAnswer,
    )

    // 8. CALCULATE POINTS AWARDED (T-014) — using shared scoring lib
    const difficultyLevel = question.difficulty_level || "L1"
    const pointsAwarded = calculatePointsAwarded(
      isCorrect,
      question.point_value,
      difficultyLevel,
    )

    // 9. INSERT ATTEMPT RECORD
    const normalizedContextId =
      typeof context_id === "string" && context_id.trim().length > 0
        ? context_id.trim()
        : `${context_type || "baseline"}-${Date.now()}`

    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from("attempts")
      .insert({
        user_id: userId,
        question_id: question_id,
        module_id: module_id || null,
        is_correct: isCorrect,
        user_answer: JSON.stringify({ selected: selected_answer }),
        time_spent_sec: Math.round(time_spent_sec),
        context_type: context_type || "baseline",
        context_id: normalizedContextId,
        points_awarded: pointsAwarded,
      })
      .select("id")
      .single()

    if (attemptError) {
      // Handle duplicate attempt (unique constraint violation)
      if (attemptError.code === "23505") {
        console.warn(
          "[submit-attempt] Duplicate attempt detected:",
          userId,
          question_id,
          context_id,
        )

        // Fetch the existing attempt instead
        const { data: existingAttempt } = await supabaseAdmin
          .from("attempts")
          .select("id, is_correct, user_answer, points_awarded")
          .eq("user_id", userId)
          .eq("question_id", question_id)
          .eq("context_id", normalizedContextId)
          .single()

        if (existingAttempt) {
          return NextResponse.json({
            success: true,
            attempt_id: existingAttempt.id,
            is_correct: existingAttempt.is_correct,
            correct_answer: correctAnswer,
            points_awarded: existingAttempt.points_awarded ?? 0,
            already_submitted: true,
            message: "This question was already answered",
          })
        }
      }

      // Handle foreign key violations (e.g., invalid module_id)
      if (attemptError.code === "23503") {
        console.error(
          "[submit-attempt] Foreign key violation:",
          attemptError.message,
          { userId, question_id, module_id, context_id },
        )
        // Retry without module_id if that's the FK issue
        if (module_id) {
          console.warn("[submit-attempt] Retrying without module_id")
          const { data: retryAttempt, error: retryError } = await supabaseAdmin
            .from("attempts")
            .insert({
              user_id: userId,
              question_id: question_id,
              module_id: null,
              is_correct: isCorrect,
              user_answer: JSON.stringify({ selected: selected_answer }),
              time_spent_sec: Math.round(time_spent_sec),
              context_type: context_type || "baseline",
              context_id: normalizedContextId,
              points_awarded: pointsAwarded,
            })
            .select("id")
            .single()

          if (!retryError && retryAttempt) {
            // Continue with the retry attempt — skip to response
            return NextResponse.json({
              success: true,
              attempt_id: retryAttempt.id,
              is_correct: isCorrect,
              correct_answer: correctAnswer,
              time_spent_sec: Math.round(time_spent_sec),
              points_awarded: pointsAwarded,
              difficulty_level: difficultyLevel,
              construct_impacts: {},
              feedback: {
                is_correct: isCorrect,
                message: isCorrect
                  ? "Correct! Great job!"
                  : "Incorrect. Review the explanation to understand why.",
                error_tags: [],
                difficulty: question.difficulty,
                points_awarded: pointsAwarded,
              },
            })
          }
        }
      }

      console.error("[submit-attempt] Failed to insert attempt:", {
        code: attemptError.code,
        message: attemptError.message,
        details: attemptError.details,
        hint: attemptError.hint,
        userId,
        question_id,
        module_id,
        context_type,
        context_id: normalizedContextId,
      })
      return NextResponse.json(
        {
          error: "Failed to save attempt",
          ...(process.env.NODE_ENV === "development"
            ? {
                debug: {
                  code: attemptError.code,
                  message: attemptError.message,
                  hint: attemptError.hint,
                },
              }
            : {}),
        },
        { status: 500 },
      )
    }

    // 10. APPLY ERROR TAGS (async, non-blocking) — using shared scoring lib
    const expectedTime = question.time_estimate_seconds || 120
    const weights = question.construct_weights as Record<string, number> | null
    const potentialTags = deriveErrorTags(
      isCorrect,
      time_spent_sec,
      expectedTime,
      weights,
    )

    // Only insert tags that exist in the database (fire and forget)
    if (potentialTags.length > 0) {
      const tagIds = potentialTags.map((t) => t.tag_id)

      // Fetch existing tags from database
      supabaseAdmin
        .from("tags")
        .select("id")
        .in("id", tagIds)
        .eq("is_active", true)
        .then(({ data: existingTags, error: tagError }) => {
          if (tagError) {
            console.warn(
              "[submit-attempt] Failed to fetch tags:",
              tagError.message,
            )
            return
          }

          // Only insert tags that exist
          const validTagIds = new Set(existingTags?.map((t) => t.id) || [])
          const errorTags = potentialTags
            .filter((t) => validTagIds.has(t.tag_id))
            .map((t) => ({
              attempt_id: attempt.id,
              tag_id: t.tag_id,
              source: "rule",
              confidence: t.confidence,
            }))

          if (errorTags.length > 0) {
            supabaseAdmin
              .from("attempt_error_tags")
              .insert(errorTags)
              .then(({ error }) => {
                if (error)
                  console.error(
                    "[submit-attempt] Failed to insert error tags:",
                    error,
                  )
              })
          }
        })
    }

    // 11. UPSERT USER_SKILL_STATE (T-015)
    // Update the user's skill state for the question's micro-skill
    const microSkillId = question.micro_skill_id
    let constructImpacts: Record<string, number> = {}

    if (microSkillId) {
      try {
        // Fetch existing skill state
        const { data: existingState } = await supabaseAdmin
          .from("user_skill_state")
          .select("*")
          .eq("user_id", userId)
          .eq("micro_skill_id", microSkillId)
          .single()

        const now = new Date().toISOString()
        const timeSpentRound = Math.round(time_spent_sec)

        if (existingState) {
          // Calculate updated metrics
          const newAttemptCount = (existingState.attempt_count || 0) + 1
          const newCorrectCount =
            (existingState.correct_count || 0) + (isCorrect ? 1 : 0)
          const newTotalTime =
            (existingState.total_time_sec || 0) + timeSpentRound
          const newTotalPoints =
            (existingState.total_points || 0) + pointsAwarded
          const newAccuracy =
            newAttemptCount > 0 ? newCorrectCount / newAttemptCount : 0
          const newAvgTime =
            newAttemptCount > 0 ? newTotalTime / newAttemptCount : 0

          // Increment per-difficulty counters
          const l1Delta = isCorrect && difficultyLevel === "L1" ? 1 : 0
          const l2Delta = isCorrect && difficultyLevel === "L2" ? 1 : 0
          const l3Delta = isCorrect && difficultyLevel === "L3" ? 1 : 0

          await supabaseAdmin
            .from("user_skill_state")
            .update({
              attempt_count: newAttemptCount,
              correct_count: newCorrectCount,
              total_time_sec: newTotalTime,
              avg_time_sec: Math.round(newAvgTime),
              total_points: newTotalPoints,
              l1_correct: (existingState.l1_correct || 0) + l1Delta,
              l2_correct: (existingState.l2_correct || 0) + l2Delta,
              l3_correct: (existingState.l3_correct || 0) + l3Delta,
              accuracy: Math.round(newAccuracy * 100) / 100,
              last_attempted_at: now,
            })
            .eq("id", existingState.id)
        } else {
          // Insert new skill state
          await supabaseAdmin.from("user_skill_state").insert({
            user_id: userId,
            micro_skill_id: microSkillId,
            attempt_count: 1,
            correct_count: isCorrect ? 1 : 0,
            total_time_sec: timeSpentRound,
            avg_time_sec: timeSpentRound,
            total_points: pointsAwarded,
            l1_correct: isCorrect && difficultyLevel === "L1" ? 1 : 0,
            l2_correct: isCorrect && difficultyLevel === "L2" ? 1 : 0,
            l3_correct: isCorrect && difficultyLevel === "L3" ? 1 : 0,
            accuracy: isCorrect ? 1.0 : 0.0,
            mastery_level: "novice",
            last_attempted_at: now,
          })
        }
      } catch (skillError) {
        console.error(
          "[submit-attempt] Failed to upsert user_skill_state:",
          skillError,
        )
        // Non-blocking: don't fail the request for analytics update
      }
    }

    // 12. RECALCULATE USER_CONSTRUCT_STATE (T-016) — using shared scoring lib
    if (weights) {
      try {
        const constructImpactsMap = calculateAllConstructImpacts(
          isCorrect,
          weights,
          difficultyLevel,
        )

        for (const [construct, impact] of Object.entries(constructImpactsMap)) {
          constructImpacts[construct] = impact

          // Fetch existing construct state
          const { data: existingConstruct } = await supabaseAdmin
            .from("user_construct_state")
            .select("*")
            .eq("user_id", userId)
            .eq("construct_name", construct)
            .single()

          if (existingConstruct) {
            const currentScore = Number(existingConstruct.score) || 50
            const dataPoints = (existingConstruct.data_points || 0) + 1
            const newScore = computeNewConstructScore(
              currentScore,
              impact,
              dataPoints,
            )
            const scoreDelta = newScore - currentScore
            const trend = determineTrend(scoreDelta)

            await supabaseAdmin
              .from("user_construct_state")
              .update({
                score: newScore,
                data_points: dataPoints,
                trend,
                last_updated_at: new Date().toISOString(),
              })
              .eq("id", existingConstruct.id)
          } else {
            // Insert new construct state starting at 50 ± impact
            const initialScore = Math.max(
              0,
              Math.min(100, Math.round((50 + impact) * 100) / 100),
            )
            await supabaseAdmin.from("user_construct_state").insert({
              user_id: userId,
              construct_name: construct,
              score: initialScore,
              data_points: 1,
              trend: determineTrend(impact),
              last_updated_at: new Date().toISOString(),
            })
          }
        }

        // Update the attempt record with construct impacts
        if (Object.keys(constructImpacts).length > 0) {
          await supabaseAdmin
            .from("attempts")
            .update({ construct_impacts: constructImpacts })
            .eq("id", attempt.id)
        }
      } catch (constructError) {
        console.error(
          "[submit-attempt] Failed to update construct state:",
          constructError,
        )
        // Non-blocking
      }
    }

    // 13. LOG SUCCESS (in development only)
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[submit-attempt] Success: user=${userId}, question=${question_id}, correct=${isCorrect}, points=${pointsAwarded}, time=${Date.now() - startTime}ms`,
      )
    }

    // 14. RETURN RESPONSE
    return NextResponse.json({
      success: true,
      attempt_id: attempt.id,
      is_correct: isCorrect,
      correct_answer: correctAnswer,
      time_spent_sec: Math.round(time_spent_sec),
      points_awarded: pointsAwarded,
      difficulty_level: difficultyLevel,
      construct_impacts: constructImpacts,
      feedback: {
        is_correct: isCorrect,
        message: isCorrect
          ? "Correct! Great job!"
          : "Incorrect. Review the explanation to understand why.",
        error_tags: potentialTags.map((t) => t.tag_id),
        difficulty: question.difficulty,
        points_awarded: pointsAwarded,
      },
    })
  } catch (error) {
    console.error("[submit-attempt] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
