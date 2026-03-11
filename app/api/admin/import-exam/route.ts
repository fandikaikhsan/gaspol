/**
 * Admin Exam Import API
 * POST /api/admin/import-exam
 * Imports exam from JSON (e.g. docs/generated/exam.json)
 */
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/require-admin"
import { examImportSchema } from "@/lib/import/exam-import-schema"

export async function POST(request: NextRequest) {
  try {
    const { user, supabase, errorResponse } = await requireAdmin()
    if (errorResponse) return errorResponse

    const body = await request.json()

    const parsed = examImportSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
          message: parsed.error.errors.map((e) => e.message).join("; "),
        },
        { status: 400 },
      )
    }

    const { exam, research_summary, structure, content_areas, construct_profile, error_patterns, evidence_notes } =
      parsed.data

    const structureMetadata = {
      structure,
      content_areas,
      construct_profile,
      error_patterns,
      evidence_notes,
      administered_by: exam.administered_by,
      selection_path: exam.selection_path,
    }

    const { data, error } = await supabase
      .from("exams")
      .insert({
        name: exam.name,
        exam_type: exam.exam_type,
        year: exam.year,
        research_summary: research_summary ?? null,
        structure_metadata: structureMetadata,
        is_active: true,
        is_primary: false,
        created_by: user!.id,
      })
      .select("id, name, exam_type, year")
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Exam already exists", hint: `An exam with name "${exam.name}" and year ${exam.year} already exists` },
          { status: 409 },
        )
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      exam_id: data.id,
      name: data.name,
      exam_type: data.exam_type,
      year: data.year,
    })
  } catch (error) {
    console.error("[import-exam] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
