/**
 * Admin Campus Import API
 * POST /api/admin/import-campus
 * Imports campus scores from JSON (e.g. docs/generated/campus.json)
 * Body: { data: CampusRow[], year: number, verified: boolean }
 */
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/require-admin"
import {
  campusImportSchema,
  type CampusImportRow,
} from "@/lib/import/campus-import-schema"

const BATCH_SIZE = 200

function rowToDbRecord(row: CampusImportRow, year: number, verified: boolean) {
  const major =
    row.type?.trim()
      ? `${row.program_name} (${row.type})`
      : row.program_name
  return {
    university_id: row.university_id,
    university_name: row.university_name,
    program_id: row.program_id,
    major,
    program_type: row.type || null,
    min_score: Math.round(row.score * 1000) / 1000,
    year,
    interest: row.interest ?? null,
    capacity: row.capacity ?? null,
    acceptance_rate: row.acceptance_rate ?? null,
    interest_capacity_error: row.interest_capacity_error ?? 0,
    interest_negative_error: row.interest_negative_error ?? 0,
    confidence_level: row.confidence_level ?? null,
    confidence_level_label: row.confidence_level_label || null,
    source_url: null,
    verified,
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, errorResponse } = await requireAdmin()
    if (errorResponse) return errorResponse

    const body = await request.json()

    const parsed = campusImportSchema.safeParse(body)
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

    const { data: rows, year, verified } = parsed.data
    const records = rows.map((r) => rowToDbRecord(r, year, verified))

    let imported = 0
    let errors: string[] = []

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE)
      const { error } = await supabase
        .from("campus_scores")
        .upsert(batch, {
          onConflict: "program_id,year",
          ignoreDuplicates: false,
        })

      if (error) {
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`)
      } else {
        imported += batch.length
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Import partially failed",
          imported,
          errors,
        },
        { status: 207 },
      )
    }

    return NextResponse.json({
      success: true,
      imported,
      year,
    })
  } catch (error) {
    console.error("[import-campus] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
