/**
 * generate_material_cards Edge Function (T-038)
 * AI-powered material card generation from taxonomy nodes (micro-skills)
 * Supports multiple AI providers: Anthropic, OpenAI, Gemini
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
  userPrompt: string,
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
        Authorization: `Bearer ${apiKey}`,
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

    const body = await req.json()
    const { taxonomy_node_ids, auto_save = true } = body

    // Resolve user ID
    let userId: string
    if (body.user_id) {
      userId = body.user_id
    } else {
      const authHeader = req.headers.get("Authorization")
      if (!authHeader) throw new Error("Missing authorization header")
      const token = authHeader.replace("Bearer ", "")
      const { data: userData, error: userError } =
        await supabase.auth.getUser(token)
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
      throw new Error(
        "No active AI provider configured. Please configure in Admin > AI Runs > Settings.",
      )
    }

    if (
      !taxonomy_node_ids ||
      !Array.isArray(taxonomy_node_ids) ||
      taxonomy_node_ids.length === 0
    ) {
      throw new Error("taxonomy_node_ids (array) is required")
    }

    // Process each skill node
    const results: any[] = []
    let totalTokensUsed = 0

    for (const nodeId of taxonomy_node_ids) {
      try {
        // Get taxonomy node with context
        const { data: taxonomyNode } = await supabase
          .from("taxonomy_nodes")
          .select(`*, exam:exams(name, exam_type, year, research_summary)`)
          .eq("id", nodeId)
          .single()

        if (!taxonomyNode) {
          results.push({
            skill_id: nodeId,
            error: "Node not found",
            saved: false,
          })
          continue
        }

        if (taxonomyNode.level !== 5) {
          results.push({
            skill_id: nodeId,
            skill_name: taxonomyNode.name,
            error: "Material cards must be linked to Level-5 (micro-skill) nodes only",
            saved: false,
          })
          continue
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
        const systemPrompt =
          "You are a JSON-only API. You must ONLY output valid JSON with no additional text, explanations, or markdown. Never include ```json blocks or any text outside the JSON structure."
        const userPrompt = buildMaterialCardPrompt(taxonomyNode, parentNodes)

        // Call AI
        const { content: aiOutput, tokensUsed } = await callAI(
          aiSettings as AISettings,
          systemPrompt,
          userPrompt,
        )
        totalTokensUsed += tokensUsed

        // Parse JSON output
        let parsed
        try {
          parsed = JSON.parse(aiOutput)
        } catch {
          const jsonMatch = aiOutput.match(/```json\n([\s\S]*?)\n```/)
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[1])
          } else {
            const firstBrace = aiOutput.indexOf("{")
            const lastBrace = aiOutput.lastIndexOf("}")
            if (firstBrace !== -1 && lastBrace !== -1) {
              parsed = JSON.parse(aiOutput.substring(firstBrace, lastBrace + 1))
            } else {
              throw new Error("AI did not return valid JSON")
            }
          }
        }

        // Normalize examples: prefer {contoh, penjelasan} structure; fallback for legacy/plain strings
        const rawExamples = Array.isArray(parsed.examples) ? parsed.examples : []
        const examples = rawExamples.map((e: unknown) => {
          if (e != null && typeof e === "object") {
            const obj = e as Record<string, unknown>
            const contoh = typeof obj.contoh === "string" ? obj.contoh : ""
            const penjelasan = typeof obj.penjelasan === "string" ? obj.penjelasan : ""
            if (contoh || penjelasan) return { contoh, penjelasan }
            // Fallback for other object shapes
            if (typeof obj.solution === "string") return { contoh: obj.solution, penjelasan: "" }
            if (typeof obj.example === "string") return { contoh: obj.example, penjelasan: "" }
            if (typeof obj.text === "string") return { contoh: obj.text, penjelasan: "" }
          }
          if (typeof e === "string") return { contoh: e, penjelasan: "" }
          return { contoh: String(e), penjelasan: "" }
        })

        const card = {
          skill_id: nodeId,
          title: parsed.title || taxonomyNode.name,
          core_idea: parsed.core_idea || "",
          key_facts: Array.isArray(parsed.key_facts) ? parsed.key_facts : [],
          common_mistakes: Array.isArray(parsed.common_mistakes)
            ? parsed.common_mistakes
            : [],
          examples,
          status: "draft",
          created_by: userId,
        }

        if (auto_save) {
          const { data: saved, error: saveError } = await supabase
            .from("material_cards")
            .insert(card)
            .select()
            .single()

          if (saveError) {
            results.push({
              skill_id: nodeId,
              skill_name: taxonomyNode.name,
              card,
              error: saveError.message,
              saved: false,
            })
          } else {
            results.push({
              skill_id: nodeId,
              skill_name: taxonomyNode.name,
              card: saved,
              saved: true,
            })
          }
        } else {
          results.push({
            skill_id: nodeId,
            skill_name: taxonomyNode.name,
            card,
            saved: false,
          })
        }
      } catch (nodeError) {
        results.push({
          skill_id: nodeId,
          error: nodeError.message,
          saved: false,
        })
      }
    }

    // Log AI run
    await supabase.from("ai_runs").insert({
      job_type: "material_card_generation",
      prompt_version: "v1.0",
      initiated_by: userId,
      prompt: `Generated material cards for ${taxonomy_node_ids.length} skills`,
      input_params: {
        taxonomy_node_ids,
        auto_save,
        provider: aiSettings.provider,
      },
      output_result: {
        total_requested: taxonomy_node_ids.length,
        total_saved: results.filter((r) => r.saved).length,
        total_errors: results.filter((r) => r.error).length,
      },
      model: aiSettings.model,
      tokens_used: totalTokensUsed,
      status: "success",
    })

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: {
          total: taxonomy_node_ids.length,
          saved: results.filter((r) => r.saved).length,
          errors: results.filter((r) => r.error).length,
        },
        provider: aiSettings.provider,
        model: aiSettings.model,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    )
  } catch (error) {
    console.error("Error in generate_material_cards:", error)

    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    )
  }
})

function buildMaterialCardPrompt(
  taxonomyNode: any,
  parentNodes: any[],
): string {
  const exam = taxonomyNode.exam

  let context = `You are an expert educational content creator for Indonesian university entrance exam preparation (UTBK/SNBT).\n\n`
  context += `TASK: Generate a comprehensive Material Card for a specific micro-skill. This card helps students understand the concept, remember key facts, avoid common mistakes, and see worked examples.\n\n`

  context += `EXAM CONTEXT:\nExam: ${exam?.name || "N/A"} (${exam?.exam_type || "N/A"} ${exam?.year || "N/A"})\n\n`

  if (exam?.research_summary) {
    context += `Exam Overview:\n${exam.research_summary.substring(0, 500)}...\n\n`
  }

  context += `TAXONOMY PATH:\n`
  if (parentNodes.length > 0) {
    context +=
      parentNodes.map((p: any) => `${p.name} (${p.code})`).join(" > ") + " > "
  }
  context += `${taxonomyNode.name} (${taxonomyNode.code})\n\n`

  context += `TARGET MICRO-SKILL:\nName: ${taxonomyNode.name}\nCode: ${taxonomyNode.code}\nDescription: ${taxonomyNode.description || "N/A"}\n\n`

  context += `MATERIAL CARD REQUIREMENTS:\n`
  context += `1. Title: A clear, engaging title for this concept (max 100 chars)\n`
  context += `2. Core Idea: The ONE central concept students must understand (2-4 sentences)\n`
  context += `3. Key Facts: 3-6 essential facts, formulas, or definitions to memorize\n`
  context += `4. Common Mistakes: 2-4 common errors or misconceptions students have about this topic\n`
  context += `5. Examples: 2-3 worked examples, each with "contoh" (the example) and "penjelasan" (the explanation)\n`
  context += `6. Content should be in Bahasa Indonesia appropriate for Indonesian high school students\n`
  context += `7. Be concise but thorough — this is a review card, not a textbook chapter\n`
  context += `8. Use precise mathematical notation where needed (LaTeX okay)\n\n`

  context += `OUTPUT FORMAT (JSON only, no markdown). Examples MUST use the structured format with "contoh" and "penjelasan":\n`
  context += `{\n`
  context += `  "title": "Understanding Synonyms and Antonyms",\n`
  context += `  "core_idea": "Sinonim adalah kata yang maknanya sama...",\n`
  context += `  "key_facts": [\n`
  context += `    "Sinonim: kata dengan makna sama atau mirip",\n`
  context += `    "Antonim: kata dengan makna berlawanan"\n`
  context += `  ],\n`
  context += `  "common_mistakes": [\n`
  context += `    "Menganggap kata mirip ejaan sebagai sinonim",\n`
  context += `    "Tidak memerhatikan konteks kalimat"\n`
  context += `  ],\n`
  context += `  "examples": [\n`
  context += `    {"contoh": "Kata target: 'berani'. Sinonim: 'pemberani'. Dalam kalimat: 'Dia seorang pemberani yang tidak takut menghadapi bahaya.'", "penjelasan": "Dalam konteks ini, 'pemberani' adalah sinonim yang tepat untuk 'berani'."},\n`
  context += `    {"contoh": "Kata target: 'malas'. Antonim: 'rajin'. Dalam kalimat: 'Dia sangat rajin mengerjakan tugasnya.'", "penjelasan": "Dalam konteks ini, 'rajin' adalah antonim yang tepat untuk 'malas'."}\n`
  context += `  ]\n`
  context += `}\n\n`
  context += `CRITICAL: Each item in "examples" MUST be an object with exactly two keys: "contoh" (string - the example/sample) and "penjelasan" (string - the explanation). Never use plain strings or other structures. This format is required for all taxonomy levels.\n\n`
  context += `Generate the material card now.`

  return context
}
