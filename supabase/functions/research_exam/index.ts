/**
 * research_exam Edge Function
 * Admin-only: AI researches an exam type deeply to understand its structure
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    console.log("=== Function called ===")

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

    // Check if user is admin
    console.log("Checking admin role...")
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Profile fetch error:", profileError.message)
      throw new Error(`Profile error: ${profileError.message}`)
    }

    console.log("User role:", profile?.role)

    if (profile?.role !== "admin") {
      throw new Error("Admin access required")
    }

    // Get request body
    const body = await req.json()
    const { exam_type, year, additional_info } = body

    console.log("Request params:", { exam_type, year })

    if (!exam_type || !year) {
      throw new Error("exam_type and year are required")
    }

    // Batch processing: Split research into two parts to avoid timeout
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")
    if (!anthropicKey) {
      throw new Error("ANTHROPIC_API_KEY not configured")
    }

    console.log("Starting batch research process...")
    const startTime = Date.now()

    // PART 1: Basic exam structure, timing, and scoring
    console.log("Part 1: Fetching exam structure...")
    const part1Prompt = buildStructurePrompt(exam_type, year, additional_info)
    const part1Response = await callAnthropicAPI(anthropicKey, part1Prompt, 4000)
    const part1Data = parseJSONOutput(part1Response)
    console.log("Part 1 complete")

    // PART 2: Detailed content areas and taxonomy
    console.log("Part 2: Fetching content taxonomy...")
    const part2Prompt = buildContentPrompt(exam_type, year, additional_info, part1Data)
    const part2Response = await callAnthropicAPI(anthropicKey, part2Prompt, 8000)
    const part2Data = parseJSONOutput(part2Response)
    console.log("Part 2 complete")

    // Combine results
    const parsedOutput = {
      summary: part1Data.summary,
      structure: {
        ...part1Data.structure,
        sections: part1Data.structure.sections.map((section: any, index: number) => ({
          ...section,
          content_details: part2Data.sections[index] || {}
        }))
      },
      content_areas: part2Data.content_areas || []
    }

    const duration = Date.now() - startTime
    const totalTokens = part1Response.usage.input_tokens + part1Response.usage.output_tokens +
                       part2Response.usage.input_tokens + part2Response.usage.output_tokens

    // Log AI run
    await supabase.from("ai_runs").insert({
      job_type: "exam_research",
      prompt_version: "v2.0-batch",
      initiated_by: user.id,
      prompt: "Batch processing: Part 1 (Structure) + Part 2 (Content)",
      input_params: { exam_type, year, additional_info },
      output_result: parsedOutput,
      model: "claude-sonnet-4-6",
      tokens_used: totalTokens,
      duration_ms: duration,
      status: "success",
    })

    return new Response(
      JSON.stringify({
        success: true,
        research_summary: parsedOutput.summary,
        structure_metadata: parsedOutput.structure,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Error in research_exam:", error)

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

/**
 * Helper: Call Anthropic API
 */
async function callAnthropicAPI(apiKey: string, prompt: string, maxTokens: number): Promise<any> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
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

  if (!response.ok) {
    const errorData = await response.text()
    console.error("Anthropic API error:", errorData)
    throw new Error(`Anthropic API error: ${response.statusText}`)
  }

  const data = await response.json()
  console.log("API response length:", data.content[0].text.length)
  return data
}

/**
 * Helper: Parse JSON output with multiple strategies
 */
function parseJSONOutput(apiResponse: any): any {
  const aiOutput = apiResponse.content[0].text

  try {
    // Strategy 1: Direct parse
    return JSON.parse(aiOutput)
  } catch (e1) {
    try {
      // Strategy 2: Extract from ```json blocks
      const jsonMatch = aiOutput.match(/```json\s*\n([\s\S]*?)\n```/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1])
      } else {
        // Strategy 3: Find JSON object by looking for { and }
        const firstBrace = aiOutput.indexOf('{')
        const lastBrace = aiOutput.lastIndexOf('}')
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const jsonStr = aiOutput.substring(firstBrace, lastBrace + 1)
          return JSON.parse(jsonStr)
        } else {
          console.error("Failed to extract JSON. Output:", aiOutput)
          throw new Error("AI did not return valid JSON. Please try again.")
        }
      }
    } catch (e2) {
      console.error("JSON parsing failed:", e2)
      console.error("Output that failed:", aiOutput.substring(0, 1000))
      throw new Error("AI did not return valid JSON. Please try again.")
    }
  }
}

/**
 * Build structure prompt (Part 1)
 */
function buildStructurePrompt(examType: string, year: number, additionalInfo?: string): string {
  return `You are an expert educational assessment analyst specializing in Indonesian university entrance exams.

TASK: Research the ${examType} ${year} exam structure, timing, and scoring.

EXAM: ${examType} ${year}
${additionalInfo ? `ADDITIONAL CONTEXT: ${additionalInfo}` : ""}

INSTRUCTIONS:
1. Provide a comprehensive summary of the exam
2. Identify all major sections and subsections
3. Document question counts, time limits, and formats
4. Specify scoring methodology
5. Estimate difficulty and cognitive level distributions
6. Focus on factual, publicly available information

OUTPUT (JSON only, no markdown):

{
  "summary": "A comprehensive 3-4 paragraph summary covering: purpose, target audience, overall structure, key characteristics, and any notable changes from previous years",
  "structure": {
    "sections": [
      {
        "name": "Section name",
        "code": "Short code (e.g., TPS, TKA)",
        "description": "What this section tests",
        "subsections": [
          {
            "name": "Subsection name",
            "question_count": 15,
            "time_minutes": 20,
            "question_formats": ["MCQ5", "MCK-Table"]
          }
        ],
        "total_questions": 30,
        "total_time_minutes": 40
      }
    ],
    "total_duration_minutes": 195,
    "total_questions": 183,
    "scoring": {
      "method": "Description of scoring method",
      "correct_points": 1,
      "wrong_penalty": 0,
      "unanswered_points": 0
    },
    "difficulty_levels": {
      "easy_percentage": 30,
      "medium_percentage": 50,
      "hard_percentage": 20
    },
    "cognitive_levels": {
      "L1_recall_percentage": 20,
      "L2_application_percentage": 50,
      "L3_analysis_percentage": 30
    }
  }
}`
}

/**
 * Build content prompt (Part 2)
 */
function buildContentPrompt(examType: string, year: number, additionalInfo: string | undefined, structureData: any): string {
  const sections = structureData.structure.sections.map((s: any) => s.name).join(", ")

  return `You are an expert educational assessment analyst specializing in Indonesian university entrance exams.

TASK: Provide detailed content taxonomy for ${examType} ${year} exam sections.

EXAM: ${examType} ${year}
SECTIONS: ${sections}
${additionalInfo ? `ADDITIONAL CONTEXT: ${additionalInfo}` : ""}

INSTRUCTIONS:
1. For each section, identify main topics and subtopics
2. List key skills tested in each area
3. Provide hierarchical content codes (e.g., TPS-PU-01)
4. Focus on comprehensive coverage of exam content
5. Base on factual, publicly available curriculum information

OUTPUT (JSON only, no markdown):

{
  "sections": [
    {
      "section_name": "Section name",
      "topics": [
        {
          "name": "Topic name",
          "code": "TOPIC-CODE",
          "subtopics": ["Subtopic 1", "Subtopic 2"],
          "micro_skills": ["Skill 1", "Skill 2"]
        }
      ]
    }
  ],
  "content_areas": [
    {
      "section": "Section name",
      "code": "SEC",
      "main_topics": ["Topic 1", "Topic 2", "Topic 3"],
      "key_skills": ["Skill 1", "Skill 2"],
      "coverage_notes": "Additional context about what this section covers"
    }
  ]
}`
}
