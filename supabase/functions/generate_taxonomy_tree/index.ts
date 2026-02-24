/**
 * generate_taxonomy_tree Edge Function
 * Generates a complete taxonomy tree (subjects + subtests) for bulk creation
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
    // Create Supabase client with SERVICE ROLE KEY
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration")
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body (once — also used for auth)
    const body = await req.json()
    const { exam_id } = body

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
      .select("name, exam_type, year, structure_metadata, research_summary")
      .eq("id", exam_id)
      .single()

    if (!exam) {
      throw new Error("Exam not found")
    }

    // Get existing taxonomy nodes to avoid duplicates
    const { data: existingNodes } = await supabase
      .from("taxonomy_nodes")
      .select("name, code, level")
      .eq("exam_id", exam_id)

    // Build prompt for full taxonomy generation
    const prompt = buildTreePrompt(exam, existingNodes || [])

    // Call Anthropic API
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")
    if (!anthropicKey) {
      throw new Error("ANTHROPIC_API_KEY not configured")
    }

    console.log("Calling Anthropic API for taxonomy tree generation")

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
        temperature: 0.3,
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

    // Parse JSON output
    let tree
    try {
      tree = JSON.parse(aiOutput)
    } catch (e) {
      const jsonMatch = aiOutput.match(/```json\n([\s\S]*?)\n```/)
      if (jsonMatch) {
        tree = JSON.parse(jsonMatch[1])
      } else {
        // Try brace extraction
        const firstBrace = aiOutput.indexOf('{')
        const lastBrace = aiOutput.lastIndexOf('}')
        if (firstBrace !== -1 && lastBrace !== -1) {
          tree = JSON.parse(aiOutput.substring(firstBrace, lastBrace + 1))
        } else {
          throw new Error("AI did not return valid JSON")
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        tree: tree.subjects || [],
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Error in generate_taxonomy_tree:", error)

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

function buildTreePrompt(exam: any, existingNodes: any[]): string {
  let context = `You are helping create a complete taxonomy tree for ${exam.name} (${exam.exam_type} ${exam.year}).\n\n`

  context += `TASK: Generate a COMPLETE taxonomy structure with ALL subjects (Level 1) and their subtests (Level 2) for this exam.\n\n`

  context += `EXAM INFORMATION:\n`
  context += `Name: ${exam.name}\n`
  context += `Type: ${exam.exam_type}\n`
  context += `Year: ${exam.year}\n\n`

  if (exam.research_summary) {
    context += `RESEARCH SUMMARY:\n${exam.research_summary}\n\n`
  }

  if (exam.structure_metadata) {
    context += `EXAM STRUCTURE:\n`
    context += JSON.stringify(exam.structure_metadata, null, 2)
    context += `\n\n`
  }

  if (existingNodes && existingNodes.length > 0) {
    context += `EXISTING NODES (avoid duplicates):\n`
    existingNodes.forEach((node: any) => {
      context += `- ${node.name} (${node.code}) - Level ${node.level}\n`
    })
    context += `\n`
  }

  context += `REQUIREMENTS:\n`
  context += `1. Generate ALL major subjects/sections (Level 1) for this exam\n`
  context += `2. For each subject, generate ALL subtests/components (Level 2)\n`
  context += `3. Each node should have: name, code, description\n`
  context += `4. Codes should be hierarchical: Subjects use short codes (TPS, TKA, etc), Subtests use PARENT-XX pattern\n`
  context += `5. Avoid duplicating existing nodes\n`
  context += `6. Base on the exam structure metadata and typical ${exam.exam_type} content\n`
  context += `7. Be comprehensive - include ALL sections mentioned in the exam structure\n\n`

  context += `OUTPUT FORMAT (JSON only, no markdown):\n`
  context += `{\n`
  context += `  "subjects": [\n`
  context += `    {\n`
  context += `      "name": "Subject name (e.g., Tes Potensi Skolastik)",\n`
  context += `      "code": "SUBJECT-CODE (e.g., TPS)",\n`
  context += `      "description": "What this section tests",\n`
  context += `      "level": 1,\n`
  context += `      "subtests": [\n`
  context += `        {\n`
  context += `          "name": "Subtest name (e.g., Penalaran Umum)",\n`
  context += `          "code": "PARENT-CODE (e.g., TPS-PU)",\n`
  context += `          "description": "What this subtest covers",\n`
  context += `          "level": 2\n`
  context += `        }\n`
  context += `      ]\n`
  context += `    }\n`
  context += `  ]\n`
  context += `}\n\n`

  context += `Generate the COMPLETE taxonomy tree now.`

  return context
}
