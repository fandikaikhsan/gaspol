/**
 * Active exam utilities for student-facing pages.
 * Uses get_user_exam_config RPC with fallback to direct exams query
 * when RPC returns empty (e.g. permission issues).
 */

import type { SupabaseClient } from "@supabase/supabase-js"

export interface ActiveExamConfig {
  exam_id: string
  exam_type: string
  exam_name: string
  construct_count: number
  error_tag_count: number
}

/**
 * Get the active exam config for the current user.
 * Tries RPC first, then falls back to direct exams table query.
 */
export async function getActiveExamConfig(
  supabase: SupabaseClient,
  userId: string
): Promise<ActiveExamConfig | null> {
  const { data: rpcData, error: rpcError } = await (supabase as any).rpc(
    "get_user_exam_config",
    { p_user_id: userId }
  )

  if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
    return rpcData[0] as ActiveExamConfig
  }

  // Fallback: RLS allows authenticated users to read active exams
  const { data: exam, error: examError } = await (supabase as any)
    .from("exams")
    .select("id, exam_type, name")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (examError || !exam) return null

  return {
    exam_id: exam.id,
    exam_type: exam.exam_type || "UTBK",
    exam_name: exam.name || "",
    construct_count: 0,
    error_tag_count: 0,
  }
}

/**
 * Get active exam ID only (for filtering queries).
 */
export async function getActiveExamId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const config = await getActiveExamConfig(supabase, userId)
  return config?.exam_id ?? null
}
