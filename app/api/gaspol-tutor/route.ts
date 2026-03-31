/**
 * Gaspol Tutor — topic-scoped AI chat (shared quota with Tanya Gaspol).
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import {
  buildTutorSystemPrompt,
  getOpeningMessage,
  type TutorTopicId,
} from "@/lib/gaspol-tutor/topics"

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 10
const RATE_WINDOW = 60 * 1000

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_WINDOW })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

const TOKENS_PER_QUESTION = 5
const DEFAULT_TOTAL_TOKENS = 100

const TOPIC_IDS: TutorTopicId[] = [
  "aturan_utbk",
  "ujian_mandiri",
  "materi",
  "tips_ujian",
  "jurusan",
  "motivasi",
]

function isTutorTopicId(s: string): s is TutorTopicId {
  return TOPIC_IDS.includes(s as TutorTopicId)
}

interface AISettings {
  provider: "anthropic" | "openai" | "gemini"
  api_key: string | null
  model: string
}

/** Synthetic user first so Anthropic gets user → assistant alternation. */
function historyToApiMessages(dbRows: { role: string; message: string }[]) {
  return [
    {
      role: "user" as const,
      content:
        "(Konteks singkat: siswa sedang dalam sesi Gaspol Tutor untuk topik kartu ini. Lanjutkan percakapan secara alami.)",
    },
    ...dbRows.map((r) => ({
      role: r.role as "user" | "assistant",
      content: r.message,
    })),
  ]
}

async function callAI(
  settings: AISettings,
  systemPrompt: string,
  messages: { role: "user" | "assistant"; content: string }[],
): Promise<{ content: string; tokensUsed: number }> {
  const { provider, api_key, model } = settings

  if (provider === "anthropic") {
    const apiKey = api_key || process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error("Anthropic API key not configured")

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1000,
        temperature: 0.7,
        system: systemPrompt,
        messages,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Anthropic API error: ${error}`)
    }

    const data = await response.json()
    return {
      content: data.content[0].text,
      tokensUsed: data.usage.input_tokens + data.usage.output_tokens,
    }
  }

  if (provider === "openai") {
    const apiKey = api_key || process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error("OpenAI API key not configured")

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 1000,
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error: ${error}`)
    }

    const data = await response.json()
    return {
      content: data.choices[0].message.content,
      tokensUsed: data.usage.total_tokens,
    }
  }

  if (provider === "gemini") {
    const apiKey = api_key || process.env.GOOGLE_API_KEY
    if (!apiKey) throw new Error("Google API key not configured")

    const transcript = messages
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n")

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\n--- Percakapan ---\n${transcript}\n\n(Balas sebagai Assistant GaspolBot.)`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        }),
      },
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Gemini API error: ${error}`)
    }

    const data = await response.json()
    const content = data.candidates[0].content.parts[0].text
    const tokensUsed = data.usageMetadata?.totalTokenCount || 0
    return { content, tokensUsed }
  }

  throw new Error(`Unsupported provider: ${provider}`)
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAuth = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      )
    }

    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 },
      )
    }

    const body = await request.json()
    const { topic_id, message } = body as {
      topic_id: string
      message: string
    }

    if (!topic_id || !isTutorTopicId(topic_id)) {
      return NextResponse.json({ error: "Invalid topic_id" }, { status: 400 })
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message required" }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      },
    )

    let { data: quota } = await supabase
      .from("tanya_gaspol_quota")
      .select("total_tokens, used_tokens, remaining_tokens")
      .eq("user_id", user.id)
      .single()

    if (!quota) {
      const { data: newQuota, error: quotaError } = await supabase
        .from("tanya_gaspol_quota")
        .insert({
          user_id: user.id,
          total_tokens: DEFAULT_TOTAL_TOKENS,
          used_tokens: 0,
        })
        .select("total_tokens, used_tokens, remaining_tokens")
        .single()

      if (quotaError) {
        console.error("[gaspol-tutor] quota init:", quotaError)
        return NextResponse.json(
          { error: "Failed to initialize quota" },
          { status: 500 },
        )
      }
      quota = newQuota
    }

    if ((quota?.remaining_tokens ?? 0) < TOKENS_PER_QUESTION) {
      return NextResponse.json(
        {
          error: "Kuota Tanya Gaspol kamu sudah habis.",
          remaining_tokens: quota?.remaining_tokens ?? 0,
        },
        { status: 403 },
      )
    }

    const { data: aiSettings, error: aiError } = await supabase
      .from("ai_settings")
      .select("provider, api_key, model")
      .eq("is_active", true)
      .single()

    if (aiError || !aiSettings) {
      console.error("[gaspol-tutor] ai_settings:", aiError)
      return NextResponse.json(
        { error: "AI service not configured. Please contact administrator." },
        { status: 503 },
      )
    }

    const trimmed = message.trim()
    const now = new Date().toISOString()

    await supabase.from("gaspol_tutor_chats").insert({
      user_id: user.id,
      topic_id,
      role: "user",
      message: trimmed,
      tokens_used: 0,
      created_at: now,
    })

    const { data: historyRows, error: histError } = await supabase
      .from("gaspol_tutor_chats")
      .select("role, message")
      .eq("user_id", user.id)
      .eq("topic_id", topic_id)
      .order("created_at", { ascending: true })

    if (histError || !historyRows?.length) {
      console.error("[gaspol-tutor] history:", histError)
      return NextResponse.json({ error: "Failed to load history" }, { status: 500 })
    }

    const opening = getOpeningMessage(topic_id)
    const baseSystem = buildTutorSystemPrompt(topic_id)
    const systemPrompt = `${baseSystem}\n\n---\nPesan pembuka kartu (sudah ditampilkan di UI):\n${opening}\n---`

    const messages = historyToApiMessages(historyRows)

    const { content: reply } = await callAI(
      aiSettings as AISettings,
      systemPrompt,
      messages,
    )

    await supabase.from("gaspol_tutor_chats").insert({
      user_id: user.id,
      topic_id,
      role: "assistant",
      message: reply,
      tokens_used: TOKENS_PER_QUESTION,
      created_at: new Date().toISOString(),
    })

    const newUsed = (quota?.used_tokens ?? 0) + TOKENS_PER_QUESTION
    await supabase
      .from("tanya_gaspol_quota")
      .update({
        used_tokens: newUsed,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)

    const remaining =
      (quota?.total_tokens ?? DEFAULT_TOTAL_TOKENS) - newUsed

    return NextResponse.json({
      reply,
      tokens_used: TOKENS_PER_QUESTION,
      remaining_tokens: remaining,
    })
  } catch (error) {
    console.error("[gaspol-tutor] Error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}
