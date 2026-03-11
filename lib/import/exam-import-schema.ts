/**
 * Zod schema for exam import JSON
 * @see docs/generated/exam.json
 */
import { z } from "zod"

const examCoreSchema = z.object({
  name: z.string().min(1),
  exam_type: z.string().min(1),
  year: z.number().int().positive(),
  administered_by: z.string().optional(),
  selection_path: z.string().optional(),
})

export const examImportSchema = z
  .object({
    exam: examCoreSchema,
    research_summary: z.string().optional(),
    evidence_notes: z.record(z.unknown()).optional(),
    structure: z.record(z.unknown()).optional(),
    content_areas: z.array(z.unknown()).optional(),
    construct_profile: z.record(z.unknown()).optional(),
    error_patterns: z.record(z.unknown()).optional(),
  })
  .refine((data) => !!data.exam, { message: "exam object is required" })

export type ExamImport = z.infer<typeof examImportSchema>
