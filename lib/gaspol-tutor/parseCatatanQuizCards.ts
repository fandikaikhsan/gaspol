export type CatatanQuizItem = {
  question: string
  answer: string
  explanation: string
}

export type ParsedCatatanQuiz = {
  /** Markdown shown above the cards (intro). */
  preamble: string
  /** Markdown after the JSON fence (e.g. ajakan diskusi). */
  postamble: string
  items: CatatanQuizItem[]
}

/** Opening fence: ```gaspol-quiz then newline, or ``` then newline then gaspol-quiz */
const FENCE_RE =
  /```\s*gaspol-quiz\s*\r?\n([\s\S]*?)```/im
const FENCE_RE_ALT =
  /```\s*\r?\n\s*gaspol-quiz\s*\r?\n([\s\S]*?)```/im

function matchGaspolQuizFence(content: string): RegExpMatchArray | null {
  return content.match(FENCE_RE) ?? content.match(FENCE_RE_ALT)
}

/** User asked for 3 practice questions (ID/EN shortcuts + common phrasing). */
export function looksLikeCatatanQuizRequest(message: string): boolean {
  const s = message.trim()
  if (!s) return false
  const lower = s.toLowerCase()
  if (s.includes("Buat 3 soal latihan lengkap")) return true
  if (s.includes("Create 3 practice questions with answers")) return true
  if (/buat\s+3\s+soal/.test(lower)) return true
  if (/3\s+soal\s+latihan/.test(lower)) return true
  if (/(soal|pertanyaan).{0,40}(latihan|uji)/.test(lower) && /\b3\b|\btiga\b/.test(lower))
    return true
  if (/soal\s+latihan/.test(lower) && /jawaban/.test(lower) && /penjelasan/.test(lower))
    return true
  if (/practice questions?/.test(lower) && /answers?/.test(lower)) return true
  return false
}

function normalizeItem(raw: unknown): CatatanQuizItem | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  const q = typeof o.question === "string" ? o.question.trim() : ""
  const a = typeof o.answer === "string" ? o.answer.trim() : ""
  const e = typeof o.explanation === "string" ? o.explanation.trim() : ""
  if (!q) return null
  return {
    question: q,
    answer: a || "—",
    explanation: e || "—",
  }
}

/**
 * If the assistant message contains a ```gaspol-quiz JSON fence, returns
 * preamble text + structured items. Otherwise null (render as plain markdown).
 */
export function parseCatatanQuizCards(content: string): ParsedCatatanQuiz | null {
  const m = matchGaspolQuizFence(content)
  if (!m || m.index === undefined) return null

  const preamble = content.slice(0, m.index).trimEnd()
  const afterFence = content.slice(m.index + m[0].length).trim()
  let data: unknown
  try {
    data = JSON.parse(m[1].trim())
  } catch {
    return null
  }

  if (!data || typeof data !== "object") return null
  const itemsRaw = (data as { items?: unknown }).items
  if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) return null

  const items: CatatanQuizItem[] = []
  for (const row of itemsRaw) {
    const item = normalizeItem(row)
    if (item) items.push(item)
  }
  if (items.length === 0) return null

  return { preamble, postamble: afterFence, items }
}
