/**
 * Admin Question Import API
 * POST /api/admin/import-questions
 * Imports questions from structured JSON (skill_code+exam_id or skill_id)
 * @see docs/features/admin-question-import.features.md
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/require-admin"
import { questionImportSchema } from "@/lib/import/question-import-schema"
import { transformImport, type TransformedQuestion } from "@/lib/import/transform-import-to-db"

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

export async function POST(request: NextRequest) {
  try {
    const { user, supabase, errorResponse } = await requireAdmin()
    if (errorResponse) return errorResponse

    const body = await request.json()

    const parsed = questionImportSchema.safeParse(body)
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

    let { skillId, examId, skillCode, questions } = transformImport(parsed.data)

    // Resolve exam_id if it's an exam code/name instead of UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (examId && !uuidRegex.test(examId)) {
      const examCode = examId
      let { data: exam } = await supabase
        .from("exams")
        .select("id")
        .eq("name", examCode)
        .eq("is_active", true)
        .maybeSingle()

      if (!exam) {
        const partial = await supabase
          .from("exams")
          .select("id")
          .ilike("name", `%${examCode}%`)
          .eq("is_active", true)
          .limit(1)
          .maybeSingle()
        exam = partial.data
      }

      if (!exam) {
        return NextResponse.json(
          {
            error: "Exam not found",
            hint: `exam_id "${examCode}" is not a valid UUID and no matching exam was found by name. Use the exam UUID from the exams table or ensure the exam name matches.`,
          },
          { status: 400 },
        )
      }
      examId = exam.id
    }

    // Resolve taxonomy node: either use skill_id (must be L5) or lookup by skill_code+exam_id
    let taxonomyNodeId: string | null = null

    if (skillId) {
      const { data: node, error: lookupError } = await supabase
        .from("taxonomy_nodes")
        .select("id, level")
        .eq("id", skillId)
        .eq("is_active", true)
        .maybeSingle()

      if (lookupError || !node) {
        return NextResponse.json(
          { error: "Invalid skill_id", hint: "skill_id must reference an active taxonomy node" },
          { status: 400 },
        )
      }
      if (node.level !== 5) {
        return NextResponse.json(
          { error: "skill_id must reference a level-5 (micro-skill) taxonomy node" },
          { status: 400 },
        )
      }
      taxonomyNodeId = node.id
    }

    if (!taxonomyNodeId && skillCode && examId) {
      const { data: node, error: lookupError } = await supabase
        .from("taxonomy_nodes")
        .select("id")
        .eq("exam_id", examId)
        .eq("code", skillCode)
        .eq("level", 5)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle()

      if (lookupError) {
        console.error("[import-questions] Lookup error:", lookupError)
        return NextResponse.json(
          { error: "Failed to resolve skill_code", details: lookupError.message },
          { status: 400 },
        )
      }
      taxonomyNodeId = node?.id ?? null
    }

    if (!taxonomyNodeId) {
      return NextResponse.json(
        {
          error: "Taxonomy node not found",
          hint: skillId
            ? "skill_id may be invalid"
            : "skill_code+exam_id must resolve to a Level-5 node",
        },
        { status: 400 },
      )
    }

    const insertedIds: string[] = []

    for (const q of questions) {
      const questionRow = await insertQuestion(supabase, user!.id, q, taxonomyNodeId)
      insertedIds.push(questionRow.id)

      if (q.question_options && q.question_options.length > 0) {
        const opts = q.question_options.map((o) => ({
          question_id: questionRow.id,
          option_key: o.option_key,
          option_text: o.option_text,
          is_correct: o.is_correct,
          position: o.position,
        }))
        const { error: optErr } = await supabase.from("question_options").insert(opts)
        if (optErr) {
          console.error("[import-questions] Options insert error:", optErr)
          return NextResponse.json(
            { error: "Failed to insert options", questionId: questionRow.id },
            { status: 500 },
          )
        }
      }

      const { error: taxErr } = await supabase.from("question_taxonomy").insert({
        question_id: questionRow.id,
        taxonomy_node_id: taxonomyNodeId,
      })
      if (taxErr) {
        console.error("[import-questions] Taxonomy link error:", taxErr)
        return NextResponse.json(
          { error: "Failed to link taxonomy", questionId: questionRow.id },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({
      success: true,
      imported: insertedIds.length,
      question_ids: insertedIds,
      taxonomy_node_id: taxonomyNodeId,
    })
  } catch (error) {
    console.error("[import-questions] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}

async function insertQuestion(
  supabase: SupabaseClient,
  userId: string,
  q: TransformedQuestion,
  taxonomyNodeId: string,
) {
  const row = {
    micro_skill_id: taxonomyNodeId,
    question_type: q.question_type,
    question_format: q.question_format,
    difficulty: q.difficulty,
    cognitive_level: q.cognitive_level,
    difficulty_level: q.difficulty_level,
    stem: q.stem,
    question_text: q.stem,
    stem_images: q.stem_images,
    options: q.options,
    correct_answer: q.correct_answer,
    explanation: q.explanation,
    content: q.content,
    content_version: 1,
    time_estimate_seconds: q.time_estimate_seconds,
    construct_weights: q.construct_weights,
    status: "draft",
    is_active: true,
    created_by: userId,
    updated_by: userId,
  }

  const { data, error } = await supabase.from("questions").insert(row).select("id").single()

  if (error) {
    throw new Error(`Insert failed: ${error.message}`)
  }
  return data
}
