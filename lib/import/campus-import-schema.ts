/**
 * Zod schema for campus scores import JSON
 * @see docs/generated/campus.json
 * Expects body: { data: CampusRow[], year: number, verified: boolean }
 */
import { z } from "zod"

const campusRowSchema = z.object({
  university_id: z.number(),
  university_name: z.string().min(1),
  program_id: z.number(),
  program_name: z.string().min(1),
  type: z.string().optional().default(""),
  interest: z.number().optional().default(0),
  capacity: z.number().optional().default(0),
  acceptance_rate: z.number().optional().default(0),
  score: z.number(),
  confidence_level: z.number().optional().default(0),
  confidence_level_label: z.string().optional().default(""),
  interest_capacity_error: z.number().optional().default(0),
  interest_negative_error: z.number().optional().default(0),
})

export const campusImportSchema = z.object({
  data: z.array(campusRowSchema).min(1, "At least one campus record is required"),
  year: z.number().int().positive("Year is required and must be positive"),
  verified: z.boolean().optional().default(false),
})

export type CampusImportRow = z.infer<typeof campusRowSchema>
export type CampusImport = z.infer<typeof campusImportSchema>
