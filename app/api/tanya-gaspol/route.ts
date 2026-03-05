/**
 * Tanya Gaspol AI Chat API Route (F-005b / V3-T-010)
 *
 * Handles AI chat requests scoped to material card content.
 * - Authenticates user via Supabase session
 * - Checks and decrements token quota (5 tokens per question)
 * - Calls AI provider configured in ai_settings table
 * - Stores chat messages for persistence
 * - Returns AI reply + quota info
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 10 // requests per minute (stricter than submit-attempt)
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

interface AISettings {
  provider: "anthropic" | "openai" | "gemini"
  api_key: string | null
  model: string
}

interface MaterialContext {
  core_idea: string
  key_facts: string[]
  common_mistakes: string[]
}

/**
 * Build Gaspol system prompt scoped to material card content
 */
function buildSystemPrompt(
  skillName: string,
  context: MaterialContext,
): string {
  return `Kamu adalah Gaspol, asisten belajar yang ramah dan suportif untuk siswa SMA Indonesia yang mempersiapkan UTBK. Kamu menjelaskan konsep dengan bahasa sederhana, memberikan contoh yang relevan, dan selalu menyemangati siswa.

Konteks materi yang sedang dipelajari:
- Skill: ${skillName}
- Ide Utama: ${context.core_idea}
- Fakta Kunci: ${context.key_facts.join("; ")}
- Kesalahan Umum: ${context.common_mistakes.join("; ")}

Aturan:
1. Jawab dalam Bahasa Indonesia
2. Gunakan bahasa yang mudah dipahami siswa SMA
3. Berikan contoh konkret jika diminta
4. Jangan menjawab di luar konteks materi ini
5. Jika siswa bertanya di luar topik, arahkan kembali dengan sopan
6. Gunakan emoji secukupnya untuk ramah tapi tidak berlebihan
7. Respons maksimal 300 kata`
}

/**
 * Call AI provider using the multi-provider pattern from edge functions
 */
async function callAI(
  settings: AISettings,
  systemPrompt: string,
  userMessage: string,
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
        messages: [{ role: "user", content: userMessage }],
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
          { role: "user", content: userMessage },
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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `${systemPrompt}\n\n${userMessage}` }],
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
    // 1. AUTHENTICATE
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

    // 2. RATE LIMIT
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 },
      )
    }

    // 3. PARSE REQUEST
    const body = await request.json()
    const { skill_id, message, skill_name, material_context } = body as {
      skill_id: string
      message: string
      skill_name: string
      material_context: MaterialContext
    }

    if (!skill_id || !message || !skill_name || !material_context) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: skill_id, message, skill_name, material_context",
        },
        { status: 400 },
      )
    }

    // 4. SERVICE ROLE CLIENT
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      },
    )

    // 5. CHECK QUOTA
    let { data: quota } = await supabase
      .from("tanya_gaspol_quota")
      .select("total_tokens, used_tokens, remaining_tokens")
      .eq("user_id", user.id)
      .single()

    // Initialize quota if it doesn't exist yet
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
        console.error("[tanya-gaspol] Failed to create quota:", quotaError)
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

    // 6. GET AI SETTINGS
    const { data: aiSettings, error: aiError } = await supabase
      .from("ai_settings")
      .select("provider, api_key, model")
      .eq("is_active", true)
      .single()

    if (aiError || !aiSettings) {
      console.error("[tanya-gaspol] No active AI settings:", aiError)
      return NextResponse.json(
        { error: "AI service not configured. Please contact administrator." },
        { status: 503 },
      )
    }

    // 7. BUILD PROMPT & CALL AI
    const systemPrompt = buildSystemPrompt(skill_name, material_context)
    const { content: reply } = await callAI(
      aiSettings as AISettings,
      systemPrompt,
      message,
    )

    // 8. STORE MESSAGES (user + assistant)
    const now = new Date().toISOString()
    await supabase.from("tanya_gaspol_chats").insert([
      {
        user_id: user.id,
        skill_id,
        role: "user",
        message,
        tokens_used: 0,
        created_at: now,
      },
      {
        user_id: user.id,
        skill_id,
        role: "assistant",
        message: reply,
        tokens_used: TOKENS_PER_QUESTION,
        created_at: now,
      },
    ])

    // 9. DECREMENT QUOTA
    const newUsed = (quota?.used_tokens ?? 0) + TOKENS_PER_QUESTION
    await supabase
      .from("tanya_gaspol_quota")
      .update({
        used_tokens: newUsed,
        updated_at: now,
      })
      .eq("user_id", user.id)

    // 10. RETURN RESPONSE
    const remaining = (quota?.total_tokens ?? DEFAULT_TOTAL_TOKENS) - newUsed
    return NextResponse.json({
      reply,
      tokens_used: TOKENS_PER_QUESTION,
      remaining_tokens: remaining,
    })
  } catch (error) {
    console.error("[tanya-gaspol] Error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}
