/**
 * Zod schema for taxonomy import JSON
 * @see docs/generated/taxonomy.json
 *
 * Hierarchy: subjects (L1) -> subtests (L2) -> topics (L3) -> subtopics (L4) -> micro_skills (L5)
 * exam_id: UUID or slug like "UTBK-SNBT-2026-V1" (resolved via exam lookup)
 */
import { z } from "zod"

const nodeBaseSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional().default(""),
  level: z.number().int().min(1).max(5),
})

const microSkillSchema = nodeBaseSchema.extend({ level: z.literal(5) })

const subtopicSchema = nodeBaseSchema.extend({
  level: z.literal(4),
  micro_skills: z.array(microSkillSchema).optional().default([]),
})

const topicSchema = nodeBaseSchema.extend({
  level: z.literal(3),
  subtopics: z.array(subtopicSchema).optional().default([]),
})

const subtestSchema = nodeBaseSchema.extend({
  level: z.literal(2),
  topics: z.array(topicSchema).optional().default([]),
})

const subjectSchema = nodeBaseSchema.extend({
  level: z.literal(1),
  subtests: z.array(subtestSchema).optional().default([]),
})

export const taxonomyImportSchema = z.object({
  exam_id: z.string().min(1),
  subjects: z.array(subjectSchema),
})

export type TaxonomyImport = z.infer<typeof taxonomyImportSchema>

/** Flatten hierarchy into { level, code, name, description, parentCode } for insert order */
export interface FlatTaxonomyNode {
  level: number
  code: string
  name: string
  description: string
  parentCode: string | null
  position: number
}
