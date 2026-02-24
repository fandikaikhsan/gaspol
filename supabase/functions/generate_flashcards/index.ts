/**
 * generate_flashcards Edge Function
 * AI-powered flashcard generation from taxonomy nodes (micro-skills)
 * Supports multiple AI providers: Anthropic, OpenAI, Gemini
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface AISettings {
  provider: string
  api_key: string | null
  model: string
}

// Call the appropriate AI provider
async function callAI(
  settings: AISettings,
  systemPrompt: string,
  userPrompt: string
): Promise<{ content: string; tokensUsed: number }> {
  const { provider, api_key, model } = settings

  if (provider === "anthropic") {
    const apiKey = api_key || Deno.env.get("ANTHROPIC_API_KEY")
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
        max_tokens: 8000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
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
    const apiKey = api_key || Deno.env.get("OPENAI_API_KEY")
    if (!apiKey) throw new Error("OpenAI API key not configured")

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 8000,
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
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
    const apiKey = api_key || Deno.env.get("GOOGLE_API_KEY")
    if (!apiKey) throw new Error("Google API key not configured")

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8000,
          },
        }),
      }
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration")
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body (once — also used for auth)
    const body = await req.json()
    const { taxonomy_node_id, count = 5 } = body

    // Resolve user ID: from body (API route proxy) or JWT (direct call)
    let userId: string

    if (body.user_id) {
      // Called from API route with SERVICE_ROLE_KEY — user_id pre-verified
      userId = body.user_id
    } else {
      // Direct call with user JWT (legacy/fallback)
      const authHeader = req.headers.get("Authorization")
      if (!authHeader) throw new Error("Missing authorization header")
      const token = authHeader.replace("Bearer ", "")
      const { data: userData, error: userError } = await supabase.auth.getUser(token)
      if (userError || !userData.user) throw new Error("Invalid user token")
      userId = userData.user.id
    }

    // Check admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single()

    if (profile?.role !== "admin") {
      throw new Error("Admin access required")
    }

    // Get AI settings
    const { data: aiSettings } = await supabase
      .from("ai_settings")
      .select("provider, api_key, model")
      .eq("is_active", true)
      .single()

    if (!aiSettings) {
      throw new Error("No active AI provider configured. Please configure in Admin > AI Runs > Settings.")
    }

    if (!taxonomy_node_id) {
      throw new Error("taxonomy_node_id is required")
    }

    // Get taxonomy node with context
    const { data: taxonomyNode } = await supabase
      .from("taxonomy_nodes")
      .select(`*, exam:exams(name, exam_type, year, research_summary)`)
      .eq("id", taxonomy_node_id)
      .single()

    if (!taxonomyNode) {
      throw new Error("Taxonomy node not found")
    }

    // Get parent nodes for context
    const parentNodes: any[] = []
    let currentParentId = taxonomyNode.parent_id

    while (currentParentId) {
      const { data: parent } = await supabase
        .from("taxonomy_nodes")
        .select("*")
        .eq("id", currentParentId)
        .single()

      if (parent) {
        parentNodes.unshift(parent)
        currentParentId = parent.parent_id
      } else {
        break
      }
    }

    // Build prompts
    const systemPrompt = "You are a JSON-only API. You must ONLY output valid JSON with no additional text, explanations, or markdown. Never include ```json blocks or any text outside the JSON structure."
    const userPrompt = buildFlashcardPrompt(taxonomyNode, parentNodes, count)

    console.log(`Calling ${aiSettings.provider} API for flashcard generation`)

    // Call AI
    const { content: aiOutput, tokensUsed } = await callAI(
      aiSettings as AISettings,
      systemPrompt,
      userPrompt
    )

    // Parse JSON output
    let generatedFlashcards
    try {
      generatedFlashcards = JSON.parse(aiOutput)
    } catch {
      const jsonMatch = aiOutput.match(/```json\n([\s\S]*?)\n```/)
      if (jsonMatch) {
        generatedFlashcards = JSON.parse(jsonMatch[1])
      } else {
        const firstBrace = aiOutput.indexOf('{')
        const lastBrace = aiOutput.lastIndexOf('}')
        if (firstBrace !== -1 && lastBrace !== -1) {
          generatedFlashcards = JSON.parse(aiOutput.substring(firstBrace, lastBrace + 1))
        } else {
          throw new Error("AI did not return valid JSON")
        }
      }
    }

    // Log AI run
    await supabase.from("ai_runs").insert({
      job_type: "flashcard_generation",
      prompt_version: "v1.0",
      initiated_by: userId,
      prompt: userPrompt.substring(0, 1000),
      input_params: { taxonomy_node_id, count, provider: aiSettings.provider },
      output_result: { flashcard_count: generatedFlashcards.flashcards?.length || 0 },
      model: aiSettings.model,
      tokens_used: tokensUsed,
      status: "success",
    })

    return new Response(
      JSON.stringify({
        success: true,
        flashcards: generatedFlashcards.flashcards || [],
        taxonomy_context: {
          node: taxonomyNode.name,
          code: taxonomyNode.code,
          path: parentNodes.map((p) => p.name).join(" > ") + " > " + taxonomyNode.name,
        },
        provider: aiSettings.provider,
        model: aiSettings.model,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    )
  } catch (error) {
    console.error("Error in generate_flashcards:", error)

    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    )
  }
})

function buildFlashcardPrompt(taxonomyNode: any, parentNodes: any[], count: number): string {
  const exam = taxonomyNode.exam

  let context = `You are an expert educational content creator for Indonesian university entrance exam preparation.\n\n`
  context += `TASK: Generate ${count} high-quality flashcards for memorization and quick review.\n\n`
  context += `EXAM CONTEXT:\nExam: ${exam?.name || "N/A"} (${exam?.exam_type || "N/A"} ${exam?.year || "N/A"})\n\n`

  if (exam?.research_summary) {
    context += `Exam Overview:\n${exam.research_summary.substring(0, 500)}...\n\n`
  }

  context += `TAXONOMY PATH:\n`
  if (parentNodes.length > 0) {
    context += parentNodes.map((p) => `${p.name} (${p.code})`).join(" > ") + " > "
  }
  context += `${taxonomyNode.name} (${taxonomyNode.code})\n\n`

  context += `TARGET NODE (Micro-skill):\nName: ${taxonomyNode.name}\nCode: ${taxonomyNode.code}\nDescription: ${taxonomyNode.description || "N/A"}\nLevel: ${taxonomyNode.level}\n\n`

  context += `FLASHCARD REQUIREMENTS:\n`
  context += `1. Generate EXACTLY ${count} flashcards\n`
  context += `2. Each flashcard should test ONE key concept, formula, or definition\n`
  context += `3. Front: Clear question, prompt, or "What is..." format\n`
  context += `4. Back: Concise, accurate answer (1-3 sentences max)\n`
  context += `5. Mnemonic (optional): Memory trick or acronym to help remember\n`
  context += `6. Example (optional): Real-world application or sample problem\n`
  context += `7. Content should be in Bahasa Indonesia if appropriate for the exam\n`
  context += `8. Focus on facts that students commonly forget or confuse\n`
  context += `9. Make front text engaging - use questions like "Apa rumus...", "Bagaimana cara...", "Sebutkan..."\n`
  context += `10. Back text should be direct and memorable\n\n`

  context += `OUTPUT FORMAT (JSON only, no markdown):\n`
  context += `{\n  "flashcards": [\n    {\n      "front_text": "What is the formula for calculating velocity?",\n      "back_text": "v = s / t (velocity equals distance divided by time)",\n      "mnemonic": "Think: Very Simple Time - V = S/T",\n      "example": "A car travels 100km in 2 hours: v = 100/2 = 50 km/h"\n    }\n  ]\n}\n\n`
  context += `Generate ${count} flashcards now.`

  return context
}
