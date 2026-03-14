/**
 * Admin Taxonomy Import API
 * POST /api/admin/import-taxonomy
 * Imports taxonomy tree from JSON (e.g. docs/generated/taxonomy.json)
 * exam_id: UUID or slug like "UTBK-SNBT-2026-V1" (resolved by exam_type + year)
 */
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/require-admin"
import { taxonomyImportSchema } from "@/lib/import/taxonomy-import-schema"
import { flattenTaxonomyImport } from "@/lib/import/transform-taxonomy-import"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest) {
  try {
    const { user, supabase, errorResponse } = await requireAdmin()
    if (errorResponse) return errorResponse

    const body = await request.json()

    const parsed = taxonomyImportSchema.safeParse(body)
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

    const { exam_id: examIdRef, subjects } = parsed.data

    let examId: string | null = null

    if (UUID_REGEX.test(examIdRef)) {
      examId = examIdRef
    } else {
      const slug = examIdRef as string
      const match = slug.match(/^(.+)-(\d{4})(?:-V\d+)?$/i)
      const examTypePart = match ? match[1] : slug.split("-")[0]
      const year = match ? parseInt(match[2], 10) : new Date().getFullYear()

      const { data: exam } = await supabase
        .from("exams")
        .select("id")
        .or(`exam_type.ilike.%${examTypePart}%,name.ilike.%${examTypePart}%`)
        .eq("year", year)
        .limit(1)
        .maybeSingle()

      examId = exam?.id ?? null

      if (!examId) {
        const { data: exams } = await supabase
          .from("exams")
          .select("id, name, exam_type, year")
          .eq("is_active", true)
          .order("year", { ascending: false })
        return NextResponse.json(
          {
            error: "Exam not found",
            hint: `Could not resolve exam_id "${examIdRef}". Create the exam first or pass a valid exam UUID. Existing exams: ${(exams || []).map((e) => `${e.name} (${e.id})`).join(", ")}`,
          },
          { status: 400 },
        )
      }
    }

    const flat = flattenTaxonomyImport(parsed.data)
    const idByCode = new Map<string, string>()

    for (const node of flat) {
      const parentId = node.parentCode ? idByCode.get(node.parentCode) ?? null : null

      const { data: inserted, error } = await supabase
        .from("taxonomy_nodes")
        .insert({
          parent_id: parentId,
          level: node.level,
          code: node.code,
          name: node.name,
          description: node.description,
          position: node.position,
          exam_id: examId,
          is_active: true,
        })
        .select("id")
        .single()

      if (error) {
        if (error.code === "23505") {
          const existing = await supabase
            .from("taxonomy_nodes")
            .select("id")
            .eq("exam_id", examId)
            .is("parent_id", parentId)
            .eq("code", node.code)
            .maybeSingle()
          if (existing.data?.id) {
            idByCode.set(node.code, existing.data.id)
            continue
          }
        }
        console.error("[import-taxonomy] Insert error:", error, "node:", node)
        return NextResponse.json(
          { error: "Failed to insert taxonomy node", node: node.code, details: error.message },
          { status: 500 },
        )
      }
      if (inserted?.id) idByCode.set(node.code, inserted.id)
    }

    return NextResponse.json({
      success: true,
      imported: flat.length,
      exam_id: examId,
    })
  } catch (error) {
    console.error("[import-taxonomy] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
