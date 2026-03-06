/**
 * suggest_taxonomy_node Edge Function
 * Suggests taxonomy node name and code based on exam research and context
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

async function callAI(settings: AISettings, systemPrompt: string, userPrompt: string): Promise<string> {
  const { provider, api_key, model } = settings
  const apiKey = api_key || (provider === "anthropic" ? Deno.env.get("ANTHROPIC_API_KEY") : provider === "openai" ? Deno.env.get("OPENAI_API_KEY") : Deno.env.get("GOOGLE_API_KEY"))
  if (!apiKey) throw new Error(`${provider} API key not configured (set in AI Settings or env)`)

  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: 1000, temperature: 0.3, system: systemPrompt, messages: [{ role: "user", content: userPrompt }] }),
    })
    if (!res.ok) throw new Error(`Anthropic API error: ${await res.text()}`)
    const data = await res.json()
    return data.content[0].text
  }
  if (provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ model, max_tokens: 1000, temperature: 0.3, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }] }),
    })
    if (!res.ok) throw new Error(`OpenAI API error: ${await res.text()}`)
    const data = await res.json()
    return data.choices[0].message.content
  }
  if (provider === "gemini") {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 1000 } }),
    })
    if (!res.ok) throw new Error(`Gemini API error: ${await res.text()}`)
    const data = await res.json()
    return data.candidates[0].content.parts[0].text
  }
  throw new Error(`Unsupported provider: ${provider}`)
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Create Supabase client with SERVICE ROLE KEY
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration")
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body (once — also used for auth)
    const body = await req.json()
    const { exam_id, parent_id, level } = body

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

    // Get exam research data
    const { data: exam } = await supabase
      .from("exams")
      .select("name, exam_type, year, structure_metadata")
      .eq("id", exam_id)
      .single()

    if (!exam) {
      throw new Error("Exam not found")
    }

    // Get parent node if specified
    let parentNode = null
    if (parent_id) {
      const { data } = await supabase
        .from("taxonomy_nodes")
        .select("*")
        .eq("id", parent_id)
        .single()
      parentNode = data
    }

    // Get existing siblings for context
    const { data: siblings } = await supabase
      .from("taxonomy_nodes")
      .select("name, code, level")
      .eq("parent_id", parent_id)
      .eq("level", level)

    // Build prompt
    const prompt = buildSuggestionPrompt(
      exam,
      parentNode,
      siblings || [],
      level
    )

    // Get AI settings (centralized)
    const { data: aiSettings } = await supabase
      .from("ai_settings")
      .select("provider, api_key, model")
      .eq("is_active", true)
      .single()

    if (!aiSettings) {
      throw new Error("No active AI provider configured. Configure in Admin > AI Runs > Settings.")
    }

    console.log(`Calling ${aiSettings.provider} API for taxonomy suggestions`)

    const aiOutput = await callAI(aiSettings, "You are a JSON-only API. Output valid JSON only.", prompt)

    // Parse JSON output
    let suggestions
    try {
      suggestions = JSON.parse(aiOutput)
    } catch (e) {
      const jsonMatch = aiOutput.match(/```json\n([\s\S]*?)\n```/)
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[1])
      } else {
        throw new Error("AI did not return valid JSON")
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        suggestions: suggestions.suggestions || [],
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Error in suggest_taxonomy_node:", error)

    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    )
  }
})

function buildSuggestionPrompt(
  exam: any,
  parentNode: any,
  siblings: any[],
  level: number
): string {
  const levelNames = ["", "Subject", "Subtest", "Topic", "Subtopic", "Micro-skill"]
  const levelName = levelNames[level]

  let context = `You are helping create a taxonomy for ${exam.name} (${exam.exam_type} ${exam.year}).\n\n`

  context += `TASK: Suggest 3-5 appropriate ${levelName} nodes to add at level ${level}.\n\n`

  if (parentNode) {
    context += `PARENT NODE:\n`
    context += `- Name: ${parentNode.name}\n`
    context += `- Code: ${parentNode.code}\n`
    context += `- Level: ${parentNode.level} (${levelNames[parentNode.level]})\n`
    context += `- Description: ${parentNode.description || "N/A"}\n\n`
  }

  if (siblings && siblings.length > 0) {
    context += `EXISTING SIBLING NODES (avoid duplicates):\n`
    siblings.forEach((sib: any) => {
      context += `- ${sib.name} (${sib.code})\n`
    })
    context += `\n`
  }

  if (exam.structure_metadata && exam.structure_metadata.taxonomy) {
    context += `EXAM TAXONOMY REFERENCE:\n`
    context += JSON.stringify(exam.structure_metadata.taxonomy, null, 2)
    context += `\n\n`
  }

  context += `REQUIREMENTS:\n`
  context += `1. Suggest 3-5 ${levelName} nodes that would logically fit under the parent\n`
  context += `2. Each suggestion should have: name, code, description\n`
  context += `3. Codes should follow hierarchical pattern: ${parentNode ? `${parentNode.code}-XXX` : "XXX"}\n`
  context += `4. Avoid duplicating existing siblings\n`
  context += `5. Base suggestions on typical ${exam.exam_type} content structure\n`
  context += `6. Ensure names are clear, specific, and in appropriate language (Indonesian/English as per exam)\n\n`

  context += `OUTPUT FORMAT (JSON only, no markdown):\n`
  context += `{\n`
  context += `  "suggestions": [\n`
  context += `    {\n`
  context += `      "name": "Suggested name",\n`
  context += `      "code": "SUGGESTED-CODE",\n`
  context += `      "description": "Brief description of what this covers",\n`
  context += `      "rationale": "Why this is relevant for ${exam.exam_type}"\n`
  context += `    }\n`
  context += `  ]\n`
  context += `}`

  return context
}
