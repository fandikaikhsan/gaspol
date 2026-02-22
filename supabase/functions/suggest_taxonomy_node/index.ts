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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    console.log("=== Suggest Taxonomy Node Function Started ===")

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
    const { exam_id, parent_id, level } = await req.json()

    console.log("Request params:", { exam_id, parent_id, level })

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

    // Call Anthropic API
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")
    if (!anthropicKey) {
      throw new Error("ANTHROPIC_API_KEY not configured")
    }

    console.log("Calling Anthropic API for suggestions...")

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        temperature: 0.3,
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
