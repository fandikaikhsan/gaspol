/**
 * Zod schema for admin question import JSON
 * @see docs/features/admin-question-import.features.md
 */
import { z } from "zod"

// --- Block types ---
const textBlockSchema = z.object({
  type: z.literal("text"),
  content: z.string(),
})

const inlineMathBlockSchema = z.object({
  type: z.literal("inline_math"),
  content: z.string(),
})

const blockMathBlockSchema = z.object({
  type: z.literal("block_math"),
  content: z.string(),
})

// Allow string or number in table cells (e.g. numeric data); coerce to string
const tableCellSchema = z.union([z.string(), z.number()]).transform((v) => String(v))

const tableBlockSchema = z.object({
  type: z.literal("table"),
  spec: z.object({
    headers: z.array(z.union([z.string(), z.number()]).transform(String)),
    rows: z.array(z.array(tableCellSchema)),
  }),
})

const chartBlockSchema = z.object({
  type: z.literal("chart"),
  spec: z.record(z.unknown()),
})

const functionGraphBlockSchema = z.object({
  type: z.literal("function_graph"),
  spec: z.record(z.unknown()),
})

const geometryBlockSchema = z.object({
  type: z.literal("geometry"),
  spec: z.object({
    elements: z.array(z.record(z.unknown())),
    viewBox: z
      .object({
        width: z.number(),
        height: z.number(),
      })
      .optional(),
  }),
})

const vennBlockSchema = z.object({
  type: z.literal("venn"),
  spec: z.object({
    sets: z.array(z.unknown()),
    regions: z.array(z.unknown()),
  }),
})

const imageBlockSchema = z.object({
  type: z.literal("image"),
  spec: z.object({
    url: z.string().url(),
    alt: z.string().optional(),
    caption: z.string().optional(),
  }),
})

export const contentBlockSchema = z.discriminatedUnion("type", [
  textBlockSchema,
  inlineMathBlockSchema,
  blockMathBlockSchema,
  tableBlockSchema,
  chartBlockSchema,
  functionGraphBlockSchema,
  geometryBlockSchema,
  vennBlockSchema,
  imageBlockSchema,
])

const blocksContainerSchema = z.object({
  blocks: z.array(contentBlockSchema),
})

// --- Option content (for MCQ/MCK) ---
const optionContentSchema = z.object({
  blocks: z.array(contentBlockSchema),
})

// Accept either content.blocks or shorthand "text" for simple options
const singleChoiceOptionSchema = z.preprocess(
  (val) => {
    if (val && typeof val === "object" && "text" in val && !("content" in val)) {
      return { ...val, content: { blocks: [{ type: "text" as const, content: String(val.text) }] } }
    }
    return val
  },
  z.object({
    key: z.string(),
    content: optionContentSchema,
    is_correct: z.boolean().optional(),
  }),
)

// --- MCK-Table row/column --- (accept content.blocks or shorthand "label")
const tableRowColumnSchema = z.preprocess(
  (val) => {
    if (val && typeof val === "object" && "label" in val && !("content" in val)) {
      return { ...val, content: { blocks: [{ type: "text" as const, content: String(val.label) }] } }
    }
    return val
  },
  z.object({
    id: z.string(),
    content: optionContentSchema,
  }),
)

// --- Fill-in options ---
const fillInOptionsSchema = z.object({
  type: z.enum(["numeric", "text"]),
  unit: z.string().nullable().optional(),
  placeholder: z.string().optional(),
})

// --- Answer structures ---
const singleChoiceAnswerSchema = z.object({
  interaction_type: z.literal("single_choice"),
  options: z.array(singleChoiceOptionSchema),
  correct_answer: z.string(),
})

const multiChoiceAnswerSchema = z.object({
  interaction_type: z.literal("multi_choice"),
  options: z.array(singleChoiceOptionSchema),
  correct_answer: z.string(), // comma-separated keys
})

const tableSelectAnswerSchema = z.object({
  interaction_type: z.literal("table_select"),
  options: z.object({
    rows: z.array(tableRowColumnSchema),
    columns: z.array(tableRowColumnSchema),
  }),
  correct_answer: z.string(), // "R1-C1,R2-C1"
})

const fillInAnswerSchema = z.object({
  interaction_type: z.literal("fill_in"),
  options: fillInOptionsSchema,
  correct_answer: z.string(),
})

const answerSchema = z.discriminatedUnion("interaction_type", [
  singleChoiceAnswerSchema,
  multiChoiceAnswerSchema,
  tableSelectAnswerSchema,
  fillInAnswerSchema,
])

// --- Construct weights (C.ATTENTION, C.SPEED, C.REASONING, C.COMPUTATION, C.READING, sum = 1) ---
const constructWeightsSchema = z
  .record(z.string(), z.number())
  .refine(
    (weights) => {
      const sum = Object.values(weights).reduce((a, b) => a + b, 0)
      return Math.abs(sum - 1) < 0.001
    },
    { message: "construct_weights must sum to 1.0" },
  )
  .optional()

// --- Question object ---
const questionSchema = z.object({
  question_type: z.enum(["MCQ5", "MCQ4", "MCK", "MCK-Table", "Fill-in", "TF"]),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  cognitive_level: z.enum(["L1", "L2", "L3"]).default("L2"),
  stimulus: blocksContainerSchema,
  answer: answerSchema,
  explanation: blocksContainerSchema.optional().default({ blocks: [] }),
  time_estimate_seconds: z.number().int().positive().optional(),
  construct_weights: constructWeightsSchema,
})

// --- Import wrapper ---
// exam_id: UUID from exams table, OR exam_code/name for lookup (e.g. "UTBK-SNBT-2026-V1")
export const questionImportSchema = z
  .object({
    skill_code: z.string().min(1).optional(),
    exam_id: z.string().min(1).optional(),
    skill_id: z.string().uuid().optional(),
    questions: z.array(questionSchema),
  })
  .refine(
    (data) => {
      if (data.skill_id) return true
      return !!(data.skill_code && data.exam_id)
    },
    { message: "Either skill_id OR (skill_code + exam_id) is required" },
  )

export type QuestionImport = z.infer<typeof questionImportSchema>
export type QuestionImportItem = z.infer<typeof questionSchema>
export type ContentBlock = z.infer<typeof contentBlockSchema>
