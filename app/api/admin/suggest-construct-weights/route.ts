/**
 * Suggest Construct Weights API
 * Returns construct weights and expected time from exam research for a taxonomy node
 * POST /api/admin/suggest-construct-weights
 * Body: { exam_id: string, taxonomy_node_code: string }
 */
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/require-admin"

export async function POST(request: NextRequest) {
  try {
    const { supabase, errorResponse } = await requireAdmin()
    if (errorResponse) return errorResponse

    const body = await request.json()
    const { exam_id: examId, taxonomy_node_code: nodeCode } = body

    if (!examId || !nodeCode) {
      return NextResponse.json(
        { error: "exam_id and taxonomy_node_code are required" },
        { status: 400 },
      )
    }

    const { data: exam, error: examError } = await supabase
      .from("exams")
      .select("construct_profile")
      .eq("id", examId)
      .single()

    if (examError || !exam) {
      return NextResponse.json(
        { error: "Exam not found" },
        { status: 404 },
      )
    }

    const constructProfile = exam.construct_profile as Record<string, { constructs?: Record<string, number>; time_expectations?: { average?: number } }> | null
    const nodeProfile = constructProfile?.[nodeCode]

    if (!nodeProfile) {
      return NextResponse.json({
        success: true,
        construct_weights: null,
        expected_time_sec: null,
        source: "none",
        message: `No research profile found for node code "${nodeCode}"`,
      })
    }

    const constructWeights = nodeProfile.constructs ?? null
    const expectedTime = nodeProfile.time_expectations?.average ?? null

    return NextResponse.json({
      success: true,
      construct_weights: constructWeights,
      expected_time_sec: expectedTime,
      source: "research",
    })
  } catch (error) {
    console.error("[suggest-construct-weights] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
