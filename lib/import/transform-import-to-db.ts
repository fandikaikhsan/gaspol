/**
 * Transform imported question JSON to DB shape
 * @see docs/features/admin-question-import.features.md
 */
import type {
  QuestionImport,
  QuestionImportItem,
  ContentBlock,
} from "./question-import-schema"

export interface TransformedQuestion {
  question_type: string
  question_format: string
  difficulty: string
  cognitive_level: string
  difficulty_level: string
  stem: string
  stem_images: string[]
  options: Record<string, string | unknown[]>
  correct_answer: string
  explanation: string | null
  content: {
    stimulus: { blocks: ContentBlock[] }
    answer: unknown
    explanation: { blocks: ContentBlock[] }
  }
  time_estimate_seconds: number
  construct_weights: Record<string, number>
  question_options?: Array<{
    option_key: string | null
    option_text: string
    is_correct: boolean
    position: number
  }>
}

/** Flatten content blocks to plain text for legacy fields */
function blocksToText(blocks: { blocks: ContentBlock[] }): string {
  return (blocks.blocks || [])
    .map((b) => {
      if (b.type === "text" || b.type === "inline_math" || b.type === "block_math")
        return (b as { content: string }).content
      if (b.type === "table") return "[Tabel]"
      if (b.type === "chart") return "[Grafik]"
      if (b.type === "function_graph") return "[Grafik fungsi]"
      if (b.type === "geometry") return "[Diagram geometri]"
      if (b.type === "venn") return "[Diagram Venn]"
      if (b.type === "image") return ""
      return ""
    })
    .filter(Boolean)
    .join(" ")
    .trim()
}

/** Extract image URLs from blocks for stem_images */
function extractImageUrls(blocks: { blocks: ContentBlock[] }): string[] {
  return (blocks.blocks || [])
    .filter((b): b is ContentBlock & { type: "image"; spec: { url: string } } => b.type === "image")
    .map((b) => b.spec.url)
}

/** Flatten option content blocks to text */
function optionBlocksToText(blocks: ContentBlock[]): string {
  return (blocks || [])
    .map((b) => {
      if (b.type === "text" || b.type === "inline_math" || b.type === "block_math")
        return (b as { content: string }).content
      return ""
    })
    .filter(Boolean)
    .join(" ")
    .trim() || "(empty)"
}

/** Map question_type to legacy question_format (MCQ5 | MCK-Table | Fill-in) */
function toQuestionFormat(questionType: string): string {
  const map: Record<string, string> = {
    MCQ5: "MCQ5",
    MCQ4: "MCQ5",
    MCK: "MCQ5",
    "MCK-Table": "MCK-Table",
    "Fill-in": "Fill-in",
    TF: "MCQ5",
  }
  return map[questionType] ?? "MCQ5"
}

/** Transform a single question from import format to DB shape */
export function transformQuestion(q: QuestionImportItem): TransformedQuestion {
  const stem = blocksToText(q.stimulus)
  const stemImages = extractImageUrls(q.stimulus)
  const explanationText = blocksToText(q.explanation ?? { blocks: [] })

  const answer = q.answer as {
    interaction_type: string
    options?: Array<{ key: string; content: { blocks: ContentBlock[] }; is_correct?: boolean }>
    correct_answer: string
  }
  const options: Record<string, string> = {}
  const questionOptions: TransformedQuestion["question_options"] = []

  if (
    answer.interaction_type === "single_choice" ||
    answer.interaction_type === "multi_choice"
  ) {
    const opts = answer.options || []
    opts.forEach((opt, idx) => {
      const text = optionBlocksToText(opt.content.blocks)
      options[opt.key] = text
      questionOptions.push({
        option_key: opt.key || null,
        option_text: text,
        is_correct: opt.is_correct ?? false,
        position: idx,
      })
    })
  } else if (answer.interaction_type === "table_select") {
    const opts = answer as { options: { rows: unknown[]; columns: unknown[] } }
    options["rows"] = opts.options.rows
    options["columns"] = opts.options.columns
  }
  // fill_in: no options, just correct_answer

  return {
    question_type: q.question_type,
    question_format: toQuestionFormat(q.question_type),
    difficulty: q.difficulty ?? "medium",
    cognitive_level: q.cognitive_level ?? "L2",
    difficulty_level: q.cognitive_level ?? "L2",
    stem,
    stem_images: stemImages,
    options,
    correct_answer: answer.correct_answer,
    explanation: explanationText || null,
    content: {
      stimulus: q.stimulus,
      answer: q.answer,
      explanation: q.explanation ?? { blocks: [] },
    },
    time_estimate_seconds: q.time_estimate_seconds ?? 120,
    construct_weights: q.construct_weights ?? {},
    ...(questionOptions.length > 0 && { question_options: questionOptions }),
  }
}

/** Transform full import payload to array of DB-ready questions */
export function transformImport(data: QuestionImport): {
  skillId: string | null
  examId: string | null
  skillCode: string | null
  questions: TransformedQuestion[]
} {
  const skillId = data.skill_id ?? null
  const examId = data.exam_id ?? null
  const skillCode = data.skill_code ?? null
  const questions = data.questions.map(transformQuestion)

  return { skillId, examId, skillCode, questions }
}
