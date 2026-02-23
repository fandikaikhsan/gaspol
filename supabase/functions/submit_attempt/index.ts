/**
 * Submit Attempt Edge Function
 * Processes student answers and triggers analysis pipeline
 *
 * Features:
 * - Validates access to question
 * - Computes correctness from question_options
 * - Inserts attempt record
 * - Applies rule-based error tags
 * - Triggers mastery update (queued for Task #11)
 * - Returns immediate feedback
 */

import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface SubmitAttemptRequest {
  question_id: string
  selected_answer: string | string[] // "B" for MCQ or ["A","C"] for MCK
  time_spent_sec: number
  confidence?: number // 1-5
  context?: {
    module_id?: string
    baseline_module_id?: string
    checkpoint_id?: string
  }
}

interface QuestionData {
  id: string
  question_type: string
  difficulty: string
  time_estimate_seconds: number
  construct_weights: Record<string, number>
  is_active: boolean
  options: Record<string, any> // JSONB field with option data
  correct_answer: string | string[] // The correct answer(s)
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    console.log("=== SUBMIT ATTEMPT START ===")

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

    console.log("Environment vars loaded")

    // Create service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log("Supabase client created")

    // Get user from JWT token (Edge Runtime has already verified it)
    const authHeader = req.headers.get("Authorization")

    console.log("Auth header present:", !!authHeader)

    if (!authHeader) {
      console.error("Missing authorization header")
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Extract user ID from the already-verified JWT
    const token = authHeader.replace("Bearer ", "")

    console.log("Token extracted, length:", token.length)

    let userId: string
    try {
      // Decode JWT payload (it's just base64, no verification needed since Edge Runtime already did it)
      const payloadBase64 = token.split('.')[1]
      console.log("Payload base64 extracted")

      // Use atob for base64 decoding (available in Deno)
      const payloadJson = atob(payloadBase64)
      console.log("Payload decoded")

      const payload = JSON.parse(payloadJson)
      console.log("Payload parsed")

      userId = payload.sub
      console.log("User ID extracted:", userId)
    } catch (decodeError) {
      console.error("Failed to decode token:", decodeError)
      return new Response(
        JSON.stringify({ error: "Failed to decode token", details: String(decodeError) }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    if (!userId) {
      console.error("No user ID in token payload")
      return new Response(
        JSON.stringify({ error: "Invalid token: no user ID in payload" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    console.log("=== AUTH SUCCESS ===")
    console.log("User ID:", userId)

    // Parse request body
    const body: SubmitAttemptRequest = await req.json()
    const {
      question_id,
      selected_answer,
      time_spent_sec,
      confidence,
      context = {}
    } = body

    // Validate required fields
    if (!question_id || selected_answer === undefined || !time_spent_sec) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: question_id, selected_answer, time_spent_sec" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // =====================================================
    // 1. FETCH QUESTION DATA
    // =====================================================
    const { data: question, error: questionError } = await supabase
      .from("questions")
      .select(`
        id,
        question_type,
        question_format,
        difficulty,
        time_estimate_seconds,
        construct_weights,
        is_active,
        options,
        correct_answer
      `)
      .eq("id", question_id)
      .single()

    if (questionError || !question) {
      console.error("Question query failed:", {
        questionError,
        question_id,
        hasQuestion: !!question
      })
      return new Response(
        JSON.stringify({
          error: "Question not found",
          details: questionError?.message || "Question does not exist",
          question_id
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const questionData = question as unknown as QuestionData

    // Check if question is active
    if (!questionData.is_active) {
      return new Response(
        JSON.stringify({ error: "Question is not active" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // =====================================================
    // 2. COMPUTE CORRECTNESS
    // =====================================================
    // correct_answer can be a string ("B") or array (["A","C"]) stored as JSONB
    const correctAnswer = questionData.correct_answer
    let isCorrect = false

    // Determine question format (handle both question_type and question_format fields)
    const questionFormat = (questionData as any).question_format || questionData.question_type || 'MCQ5'

    if (questionFormat.includes('MCQ') || questionData.question_type === "MCQ") {
      // Single answer - exact match
      isCorrect = typeof selected_answer === "string"
        && typeof correctAnswer === "string"
        && selected_answer === correctAnswer
    } else if (questionFormat.includes('MCK') || questionData.question_type === "MCK") {
      // Multiple answers - must match all correct options
      if (Array.isArray(selected_answer)) {
        const userAnswers = [...selected_answer].sort()
        const correctAnswers = Array.isArray(correctAnswer)
          ? [...correctAnswer].sort()
          : typeof correctAnswer === "string"
            ? correctAnswer.split(',').map(a => a.trim()).sort()
            : []
        isCorrect = JSON.stringify(userAnswers) === JSON.stringify(correctAnswers)
      }
    } else if (questionFormat.includes('Fill')) {
      // Fill-in answer - normalize and compare
      const normalizeAnswer = (ans: string) => ans.trim().toLowerCase()
      isCorrect = typeof selected_answer === "string"
        && typeof correctAnswer === "string"
        && normalizeAnswer(selected_answer) === normalizeAnswer(correctAnswer)
    }

    // Fallback: If no format matched, try direct comparison
    if (!isCorrect && selected_answer === correctAnswer) {
      isCorrect = true
    }

    // =====================================================
    // 3. INSERT ATTEMPT RECORD
    // =====================================================
    const attemptData = {
      user_id: userId,
      question_id: question_id,
      module_id: context.module_id || null,
      baseline_module_id: context.baseline_module_id || null,
      checkpoint_id: context.checkpoint_id || null,
      is_correct: isCorrect,
      user_answer: JSON.stringify({ selected: selected_answer }),
      time_spent_sec: time_spent_sec,
      confidence: confidence || null,
      context_type: context.baseline_module_id ? "baseline" : (context.module_id ? "drill" : "practice"),
      context_id: context.baseline_module_id || context.module_id || null
    }

    const { data: attempt, error: attemptError } = await supabase
      .from("attempts")
      .insert(attemptData)
      .select()
      .single()

    if (attemptError) {
      console.error("Failed to insert attempt:", attemptError)
      throw new Error("Failed to save attempt")
    }

    // =====================================================
    // 4. APPLY RULE-BASED ERROR TAGS
    // =====================================================
    const errorTags: Array<{ tag_id: string; source: string; confidence: number }> = []

    const expectedTime = questionData.time_estimate_seconds || 120

    // Tag: Too slow
    if (time_spent_sec > expectedTime * 1.5) {
      errorTags.push({
        tag_id: "ERR.SLOW",
        source: "rule",
        confidence: 1.0
      })
    }

    // Tag: Too rushed
    if (time_spent_sec < expectedTime * 0.3) {
      errorTags.push({
        tag_id: "ERR.RUSHED",
        source: "rule",
        confidence: 1.0
      })
    }

    // Tag: Careless (incorrect + fast)
    if (!isCorrect && time_spent_sec < expectedTime * 0.6) {
      errorTags.push({
        tag_id: "ERR.CARELESS",
        source: "rule",
        confidence: 0.8
      })
    }

    // Tag: Struggle (incorrect + slow)
    if (!isCorrect && time_spent_sec > expectedTime * 1.3) {
      errorTags.push({
        tag_id: "ERR.STRUGGLE",
        source: "rule",
        confidence: 0.8
      })
    }

    // Insert error tags if any
    if (errorTags.length > 0 && attempt) {
      const tagInserts = errorTags.map(tag => ({
        attempt_id: attempt.id,
        ...tag
      }))

      const { error: tagsError } = await supabase
        .from("attempt_error_tags")
        .insert(tagInserts)

      if (tagsError) {
        console.error("Failed to insert error tags:", tagsError)
        // Non-critical, continue
      }
    }

    // =====================================================
    // 5. TRIGGER MASTERY UPDATE (Async)
    // =====================================================
    // Call mastery calculation engine
    const { error: analyticsError } = await supabase.rpc('process_attempt_analytics', {
      p_user_id: userId,
      p_question_id: question_id,
      p_is_correct: isCorrect
    })

    if (analyticsError) {
      console.error("Analytics update failed:", analyticsError)
      // Non-critical, continue - we can recalculate later
    } else {
      console.log(`Analytics updated for user ${userId}, question ${question_id}`)
    }

    // =====================================================
    // 6. RETURN IMMEDIATE FEEDBACK
    // =====================================================
    const response = {
      success: true,
      attempt_id: attempt.id,
      is_correct: isCorrect,
      correct_answer: correctAnswer,
      time_spent_sec: time_spent_sec,
      feedback: {
        is_correct: isCorrect,
        message: isCorrect
          ? "Correct! Great job!"
          : "Incorrect. Review the explanation to understand why.",
        error_tags: errorTags.map(t => t.tag_id),
        difficulty: questionData.difficulty
      }
    }

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )

  } catch (error) {
    console.error("Submit attempt error:", error)

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
