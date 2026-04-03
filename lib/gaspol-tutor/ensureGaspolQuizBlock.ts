import { parseCatatanQuizCards } from "@/lib/gaspol-tutor/parseCatatanQuizCards"

const REWRITE_MAX_IN = 14_000

/**
 * If `reply` has no valid ```gaspol-quiz JSON, call OpenAI once to reformat
 * plain-text quizzes into the UI-required block.
 */
export async function ensureGaspolQuizBlock(
  reply: string,
  apiKey: string,
  model: string,
): Promise<string> {
  if (parseCatatanQuizCards(reply)) return reply

  const system = `You reformat Indonesian (or English) tutor quiz text into ONE exact structure for a web app.

Output format (all required):
1) 1–2 short sentences of intro in the same language as the source (markdown ok, no numbered quiz list here).
2) Exactly ONE markdown code block. The opening fence must be precisely three backticks immediately followed by the word gaspol-quiz then a newline. Example first line: \`\`\`gaspol-quiz
3) Inside that fence: a single JSON object ONLY, valid UTF-8, no markdown inside the JSON. Shape:
{"items":[{"question":"...","answer":"...","explanation":"..."},{"question":"...","answer":"...","explanation":"..."},{"question":"...","answer":"...","explanation":"..."}]}
4) Exactly 3 objects in "items". Each string must escape internal double quotes as \\" or avoid quotes in text.
5) After the closing \`\`\` fence, optionally one short sentence inviting the student to discuss (same language).

Do NOT repeat the three questions as a plain numbered list outside the JSON. Do NOT use any other code fence label than gaspol-quiz.`

  const slice = reply.length > REWRITE_MAX_IN ? reply.slice(0, REWRITE_MAX_IN) : reply
  const user = `Convert this assistant message into the required format. Preserve facts and wording where possible.\n\n---\n${slice}`

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.15,
      max_tokens: 3000,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  })

  if (!res.ok) return reply

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const out = data.choices?.[0]?.message?.content
  if (typeof out !== "string" || !out.trim()) return reply
  return parseCatatanQuizCards(out) ? out : reply
}
