/**
 * generate_questions Edge Function
 * AI-powered question generation from taxonomy nodes
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    console.log("=== Generate Questions Function Started ===")

    // Get the authorization header
    const authHeader = req.headers.get("Authorization")
    console.log("Has auth header:", !!authHeader)

    // Parse the JWT token from the authorization header
    const token = authHeader?.replace("Bearer ", "")

    // Create Supabase client with SERVICE ROLE KEY
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    console.log("Supabase URL:", supabaseUrl)
    console.log("Has service key:", !!supabaseServiceKey)

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration")
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the user's JWT token manually
    let user
    if (token) {
      console.log("Verifying token...")
      const { data: userData, error: userError } = await supabase.auth.getUser(token)

      if (userError) {
        console.error("User verification error:", userError.message)
        throw new Error(`Auth error: ${userError.message}`)
      }

      user = userData.user
      console.log("User verified:", user?.id)
    } else {
      throw new Error("No authorization token provided")
    }

    // Check admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      throw new Error("Admin access required")
    }

    // Get request body
    const body = await req.json()
    const {
      taxonomy_node_id,
      count = 5,
      difficulty = "medium",
      cognitive_level = "L2",
      question_type = "MCQ5",
    } = body

    console.log("Request params:", {
      taxonomy_node_id,
      count,
      difficulty,
      cognitive_level,
      question_type,
    })

    if (!taxonomy_node_id) {
      throw new Error("taxonomy_node_id is required")
    }

    // Get taxonomy node with context
    const { data: taxonomyNode } = await supabase
      .from("taxonomy_nodes")
      .select(`
        *,
        exam:exams(name, exam_type, year, research_summary)
      `)
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

    // Build generation prompt
    const prompt = buildGenerationPrompt(
      taxonomyNode,
      parentNodes,
      count,
      difficulty,
      cognitive_level,
      question_type
    )

    // Call Anthropic API
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")
    if (!anthropicKey) {
      throw new Error("ANTHROPIC_API_KEY not configured")
    }

    console.log("Calling Anthropic API for question generation...")

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 8000,
        temperature: 0.7, // Higher temperature for more creative questions
        system: "You are a JSON-only API. You must ONLY output valid JSON with no additional text, explanations, or markdown. Never include ```json blocks or any text outside the JSON structure.",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    })

    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.text()
      console.error("Anthropic API error:", errorData)
      throw new Error(`Anthropic API error: ${anthropicResponse.statusText}`)
    }

    const anthropicData = await anthropicResponse.json()
    const aiOutput = anthropicData.content[0].text

    console.log("AI output length:", aiOutput.length)

    // Parse JSON output
    let generatedQuestions
    try {
      generatedQuestions = JSON.parse(aiOutput)
    } catch (e) {
      const jsonMatch = aiOutput.match(/```json\n([\s\S]*?)\n```/)
      if (jsonMatch) {
        generatedQuestions = JSON.parse(jsonMatch[1])
      } else {
        // Try brace extraction
        const firstBrace = aiOutput.indexOf('{')
        const lastBrace = aiOutput.lastIndexOf('}')
        if (firstBrace !== -1 && lastBrace !== -1) {
          generatedQuestions = JSON.parse(aiOutput.substring(firstBrace, lastBrace + 1))
        } else {
          throw new Error("AI did not return valid JSON")
        }
      }
    }

    // Log AI run
    await supabase.from("ai_runs").insert({
      job_type: "item_generation",
      prompt_version: "v1.0",
      initiated_by: user.id,
      prompt: prompt.substring(0, 1000), // Truncate for logging
      input_params: { taxonomy_node_id, count, difficulty, cognitive_level, question_type },
      output_result: { question_count: generatedQuestions.questions?.length || 0 },
      model: "claude-sonnet-4-6",
      tokens_used: anthropicData.usage.input_tokens + anthropicData.usage.output_tokens,
      status: "success",
    })

    return new Response(
      JSON.stringify({
        success: true,
        questions: generatedQuestions.questions || [],
        taxonomy_context: {
          node: taxonomyNode.name,
          code: taxonomyNode.code,
          path: parentNodes.map((p) => p.name).join(" > ") + " > " + taxonomyNode.name,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Error in generate_questions:", error)

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

function buildGenerationPrompt(
  taxonomyNode: any,
  parentNodes: any[],
  count: number,
  difficulty: string,
  cognitiveLevel: string,
  questionType: string
): string {
  const exam = taxonomyNode.exam

  let context = `You are an expert test item writer for Indonesian university entrance exams.\n\n`

  context += `TASK: Generate ${count} high-quality ${questionType} questions.\n\n`

  context += `EXAM CONTEXT:\n`
  context += `Exam: ${exam?.name || "N/A"} (${exam?.exam_type || "N/A"} ${exam?.year || "N/A"})\n\n`

  if (exam?.research_summary) {
    context += `Exam Overview:\n${exam.research_summary.substring(0, 500)}...\n\n`
  }

  context += `TAXONOMY PATH:\n`
  if (parentNodes.length > 0) {
    context += parentNodes.map((p) => `${p.name} (${p.code})`).join(" > ") + " > "
  }
  context += `${taxonomyNode.name} (${taxonomyNode.code})\n\n`

  context += `TARGET NODE:\n`
  context += `Name: ${taxonomyNode.name}\n`
  context += `Code: ${taxonomyNode.code}\n`
  context += `Description: ${taxonomyNode.description || "N/A"}\n`
  context += `Level: ${taxonomyNode.level}\n\n`

  context += `REQUIREMENTS:\n`
  context += `1. Generate EXACTLY ${count} questions\n`
  context += `2. All questions must be ${difficulty} difficulty\n`
  context += `3. All questions must be ${cognitiveLevel} cognitive level:\n`
  context += `   - L1: Knowledge/Recall (facts, definitions, simple recall)\n`
  context += `   - L2: Understanding/Application (apply concepts, solve problems)\n`
  context += `   - L3: Analysis/Reasoning (analyze, evaluate, synthesize)\n`
  context += `4. Question type: ${questionType}\n`

  if (questionType === "MCQ5" || questionType === "MCQ4") {
    const optionCount = questionType === "MCQ5" ? 5 : 4
    context += `5. Each question must have EXACTLY ${optionCount} options\n`
    context += `6. EXACTLY one option must be correct\n`
    context += `7. Distractors should be plausible but clearly incorrect\n`
  } else if (questionType === "MCK") {
    context += `5. Each question must have 4-5 options\n`
    context += `6. 2-3 options should be correct\n`
  } else if (questionType === "TF") {
    context += `5. True/False questions only\n`
  }

  context += `8. Questions must be specific to "${taxonomyNode.name}" content\n`
  context += `9. Use clear, unambiguous language\n`
  context += `10. Include explanations for correct answers\n`
  context += `11. Estimate time in seconds (typically 60-180s per question)\n`
  context += `12. Questions should be in Bahasa Indonesia if appropriate for the exam\n\n`

  context += `OUTPUT FORMAT (JSON only, no markdown):\n`
  context += `{\n`
  context += `  "questions": [\n`
  context += `    {\n`
  context += `      "question_text": "The question text",\n`
  context += `      "options": [\n`
  context += `        { "text": "Option A", "is_correct": false },\n`
  context += `        { "text": "Option B", "is_correct": true },\n`
  context += `        { "text": "Option C", "is_correct": false }\n`
  context += `      ],\n`
  context += `      "explanation": "Why the correct answer is correct",\n`
  context += `      "time_estimate_seconds": 120,\n`
  context += `      "points": 1\n`
  context += `    }\n`
  context += `  ]\n`
  context += `}\n\n`

  context += `Generate ${count} questions now.`

  return context
}
