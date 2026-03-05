/**
 * Flashcard Review API Route (F-006b / V3-T-015)
 *
 * Handles SM-2 flashcard review submissions:
 * - Authenticates user via Supabase session
 * - Fetches current flashcard_user_state for user+skill
 * - Applies SM-2 scheduling logic
 * - Upserts updated state
 * - Returns updated state
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import {
  updateFlashcardState,
  type MasteryResponse,
  type FlashcardState,
} from "@/lib/assessment/flashcard-sm2"

const VALID_RESPONSES: MasteryResponse[] = ["forgot", "hard", "good", "easy"]

interface ReviewRequest {
  skill_id: string
  response: MasteryResponse
}

export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATION
    const supabaseAuth = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      )
    }

    // 2. PARSE & VALIDATE REQUEST
    const body: ReviewRequest = await request.json()
    const { skill_id, response } = body

    if (!skill_id) {
      return NextResponse.json(
        { error: "Missing required field: skill_id" },
        { status: 400 },
      )
    }

    if (!response || !VALID_RESPONSES.includes(response)) {
      return NextResponse.json(
        {
          error: `Invalid response. Must be one of: ${VALID_RESPONSES.join(", ")}`,
        },
        { status: 400 },
      )
    }

    // 3. CREATE ADMIN CLIENT (service role for DB writes)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    // 4. FETCH CURRENT STATE
    const { data: currentState, error: fetchError } = await supabase
      .from("flashcard_user_state")
      .select("*")
      .eq("user_id", user.id)
      .eq("skill_id", skill_id)
      .single()

    if (fetchError || !currentState) {
      // If no state exists, create a default one (shouldn't normally happen
      // since states are initialized after baseline, but handle gracefully)
      const defaultState: FlashcardState = {
        ease_factor: 2.5,
        interval_days: 0,
        reps: 0,
        due_at: new Date().toISOString(),
        mastery_bucket: "forgot",
        total_reviews: 0,
        last_reviewed_at: null,
      }

      const updated = updateFlashcardState(defaultState, response)

      const { data: inserted, error: insertError } = await supabase
        .from("flashcard_user_state")
        .insert({
          user_id: user.id,
          skill_id,
          ...updated,
        })
        .select()
        .single()

      if (insertError) {
        console.error(
          "[flashcard-review] Failed to insert state:",
          insertError,
        )
        return NextResponse.json(
          { error: "Failed to create flashcard state" },
          { status: 500 },
        )
      }

      return NextResponse.json({
        success: true,
        state: inserted,
      })
    }

    // 5. APPLY SM-2 LOGIC
    const current: FlashcardState = {
      ease_factor: Number(currentState.ease_factor),
      interval_days: currentState.interval_days,
      reps: currentState.reps,
      due_at: currentState.due_at,
      mastery_bucket: currentState.mastery_bucket as MasteryResponse,
      total_reviews: currentState.total_reviews,
      last_reviewed_at: currentState.last_reviewed_at,
    }

    const updated = updateFlashcardState(current, response)

    // 6. UPSERT UPDATED STATE
    const { data: upserted, error: upsertError } = await supabase
      .from("flashcard_user_state")
      .update({
        ease_factor: updated.ease_factor,
        interval_days: updated.interval_days,
        reps: updated.reps,
        due_at: updated.due_at,
        mastery_bucket: updated.mastery_bucket,
        total_reviews: updated.total_reviews,
        last_reviewed_at: updated.last_reviewed_at,
      })
      .eq("id", currentState.id)
      .select()
      .single()

    if (upsertError) {
      console.error("[flashcard-review] Failed to update state:", upsertError)
      return NextResponse.json(
        { error: "Failed to update flashcard state" },
        { status: 500 },
      )
    }

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[flashcard-review] user=${user.id} skill=${skill_id} response=${response} ` +
          `ease=${updated.ease_factor} interval=${updated.interval_days} reps=${updated.reps}`,
      )
    }

    return NextResponse.json({
      success: true,
      state: upserted,
    })
  } catch (error) {
    console.error("[flashcard-review] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
