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

    // Batch processing: Split research into three parts to avoid timeout
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")
    if (!anthropicKey) {
      throw new Error("ANTHROPIC_API_KEY not configured")
    }

    console.log("Starting 4-batch research process...")
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

    // PART 3: Construct profiling per taxonomy node
    console.log("Part 3: Profiling constructs and cognitive patterns...")
    const part3Prompt = buildConstructPrompt(exam_type, year, part1Data, part2Data)
    const part3Response = await callAnthropicAPI(anthropicKey, part3Prompt, 8000)
    const part3Data = parseJSONOutput(part3Response)
    console.log("Part 3 complete")

    // PART 4: Error pattern profiling
    console.log("Part 4: Profiling error patterns and common mistakes...")
    const part4Prompt = buildErrorPatternPrompt(exam_type, year, part1Data, part2Data, part3Data)
    const part4Response = await callAnthropicAPI(anthropicKey, part4Prompt, 8000)
    const part4Data = parseJSONOutput(part4Response)
    console.log("Part 4 complete")

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
      content_areas: part2Data.content_areas || [],
      construct_profile: part3Data.construct_profile || {},
      error_patterns: part4Data.error_patterns || {}
    }

    const duration = Date.now() - startTime
    const totalTokens = part1Response.usage.input_tokens + part1Response.usage.output_tokens +
                       part2Response.usage.input_tokens + part2Response.usage.output_tokens +
                       part3Response.usage.input_tokens + part3Response.usage.output_tokens +
                       part4Response.usage.input_tokens + part4Response.usage.output_tokens

    // Find or create exam record
    const { data: existingExam } = await supabase
      .from("exams")
      .select("id")
      .eq("exam_type", exam_type)
      .eq("year", year)
      .single()

    let examId = existingExam?.id

    let errorTagsCreated = 0

    if (examId) {
      // Update existing exam with research data
      const { error: updateError } = await supabase
        .from("exams")
        .update({
          structure_metadata: parsedOutput.structure,
          construct_profile: parsedOutput.construct_profile,
          error_patterns: parsedOutput.error_patterns,
          updated_at: new Date().toISOString()
        })
        .eq("id", examId)

      if (updateError) {
        console.error("Failed to update exam:", updateError)
        throw new Error(`Failed to update exam: ${updateError.message}`)
      }

      console.log(`Updated exam ${examId} with research data`)

      // Apply research to taxonomy nodes
      const { data: appliedCount, error: applyError } = await supabase.rpc(
        "apply_research_to_taxonomy",
        { p_exam_id: examId }
      )

      if (applyError) {
        console.warn("Failed to apply research to taxonomy:", applyError)
      } else {
        console.log(`Applied research to ${appliedCount} taxonomy nodes`)
      }

      // Apply error patterns to tags table
      const { data: tagsCreated, error: tagsError } = await supabase.rpc(
        "apply_error_patterns_to_tags",
        { p_exam_id: examId }
      )

      if (tagsError) {
        console.warn("Failed to apply error patterns to tags:", tagsError)
      } else {
        errorTagsCreated = tagsCreated || 0
        console.log(`Created/updated ${errorTagsCreated} error tags from research`)
      }

      // Apply constructs from research
      const { data: constructsCreated, error: constructsError } = await supabase.rpc(
        "apply_constructs_from_research",
        { p_exam_id: examId }
      )

      if (constructsError) {
        console.warn("Failed to apply constructs from research:", constructsError)
      } else {
        console.log(`Created/updated ${constructsCreated || 0} constructs from research`)
      }
    }

    // Log AI run
    await supabase.from("ai_runs").insert({
      job_type: "exam_research",
      prompt_version: "v4.0-batch",
      initiated_by: user.id,
      prompt: "Batch processing: Part 1 (Structure) + Part 2 (Content) + Part 3 (Constructs) + Part 4 (Error Patterns)",
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
        construct_profile: parsedOutput.construct_profile,
        error_patterns: parsedOutput.error_patterns,
        exam_id: examId,
        taxonomy_nodes_updated: appliedCount || 0,
        error_tags_created: errorTagsCreated
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

/**
 * Build construct prompt (Part 3)
 */
function buildConstructPrompt(examType: string, year: number, structureData: any, contentData: any): string {
  // Extract taxonomy nodes from content data
  const taxonomyNodes = contentData.content_areas.map((area: any) => ({
    section: area.section,
    code: area.code,
    topics: area.main_topics
  }))

  return `You are an expert psychometrician analyzing cognitive constructs in Indonesian university entrance exams.

TASK: Profile cognitive constructs and patterns for ${examType} ${year} exam content areas.

EXAM: ${examType} ${year}
TAXONOMY NODES: ${JSON.stringify(taxonomyNodes, null, 2)}

COGNITIVE CONSTRUCTS (5 core):
1. C.ATTENTION - Attention & Accuracy (focus, detail orientation, avoiding careless errors)
2. C.SPEED - Speed & Efficiency (working under time pressure, rapid processing)
3. C.REASONING - Logical Reasoning (problem-solving, critical thinking, analysis)
4. C.COMPUTATION - Computation & Calculation (mathematical operations, numerical work)
5. C.READING - Reading Comprehension (text understanding, information extraction)

COGNITIVE LEVELS:
- L1 (Recall): Memory, recognition, basic knowledge
- L2 (Application): Applying concepts, procedural skills
- L3 (Analysis): Complex reasoning, synthesis, evaluation

INSTRUCTIONS:
For EACH taxonomy node (section/topic), analyze:
1. **Construct Distribution**: Weight for each of the 5 constructs as DECIMALS (must sum to 1.0)
   - Consider what cognitive skills are most demanded
   - Base on typical question patterns for that content area
   - Use decimals like 0.25, 0.20, NOT percentages
2. **Cognitive Level Distribution**: Percentage of L1/L2/L3 questions as INTEGERS (must sum to 100)
3. **Time Expectations**: Average time per question in SECONDS (integer), fast benchmark, slow benchmark
4. **Difficulty Distribution**: Percentage easy/medium/hard as INTEGERS (must sum to 100)

Base estimates on:
- Official exam documentation
- Typical question formats in Indonesian standardized tests
- Content complexity and cognitive demands
- Time pressure characteristics

OUTPUT (JSON only, no markdown):

{
  "construct_profile": {
    "TPS-PU": {
      "constructs": {
        "C.ATTENTION": 0.25,
        "C.SPEED": 0.20,
        "C.REASONING": 0.25,
        "C.COMPUTATION": 0.10,
        "C.READING": 0.20
      },
      "cognitive_levels": {
        "L1": 20,
        "L2": 50,
        "L3": 30
      },
      "time_expectations": {
        "average": 90,
        "fast": 60,
        "slow": 120
      },
      "difficulty_distribution": {
        "easy": 30,
        "medium": 50,
        "hard": 20
      }
    }
  }
}

IMPORTANT: Provide construct_profile for ALL taxonomy nodes from the provided list. Each node code should have complete profiling data.`
}

/**
 * Build error pattern prompt (Part 4)
 */
function buildErrorPatternPrompt(
  examType: string,
  year: number,
  structureData: any,
  contentData: any,
  constructData: any
): string {
  const sections = structureData.structure.sections.map((s: any) => ({
    name: s.name,
    code: s.code,
    question_count: s.total_questions
  }))

  const contentAreas = contentData.content_areas.map((area: any) => area.code)

  return `You are an expert educational psychologist and test analyst specializing in student error patterns for Indonesian university entrance exams.

TASK: Research and identify common error patterns specific to ${examType} ${year} exam.

EXAM: ${examType} ${year}
SECTIONS: ${JSON.stringify(sections, null, 2)}
CONTENT AREAS: ${contentAreas.join(", ")}

GOAL: Identify exam-specific error patterns that students commonly make. These should NOT be generic errors, but specific to this exam type and content.

INSTRUCTIONS:
1. Research common mistakes students make on this specific exam
2. Identify error patterns unique to each content area/section
3. Document detection signals (how to identify each error)
4. Estimate prevalence rates by content area
5. Consider time pressure, question complexity, and cognitive demands

For each error pattern, provide:
- Unique code (format: ERR.{EXAM}.{TYPE}, e.g., ERR.UTBK.SIGN_ERROR)
- Name: Short descriptive name
- Description: What this error looks like
- Category: Group similar errors (e.g., "computation", "comprehension", "time_management", "careless", "conceptual")
- Detection signals: How to algorithmically detect this error
- Prevalence: How common this error is per content area (0.0 to 1.0)
- Tips: Array of 3-4 actionable improvement tips for students
- Remediation: Brief suggestion for how to address this error

OUTPUT (JSON only, no markdown):

{
  "error_patterns": {
    "summary": "Brief overview of common error patterns for this exam",
    "patterns": {
      "ERR.UTBK.SIGN_ERROR": {
        "name": "Sign Error in Calculation",
        "description": "Student makes positive/negative sign mistakes in algebraic or arithmetic operations",
        "category": "computation",
        "detection_signals": [
          {"signal": "answer_off_by_sign", "description": "Correct absolute value but wrong sign", "threshold": 0.9},
          {"signal": "fast_incorrect", "description": "Quick submission with wrong answer", "threshold": 0.7}
        ],
        "prevalence": {
          "TPS-PK": 0.15,
          "TKA-MTK": 0.25
        },
        "tips": [
          "Write out each step and circle the sign before each number",
          "Use color coding: blue for positive, red for negative",
          "Double-check signs after completing calculation",
          "Practice with sign-heavy problems daily"
        ],
        "remediation": "Practice sign tracking, use color coding for positive/negative"
      },
      "ERR.UTBK.MISREAD_NEGATION": {
        "name": "Missed Negation in Question",
        "description": "Student overlooks 'NOT', 'EXCEPT', 'KECUALI' in question stem",
        "category": "comprehension",
        "detection_signals": [
          {"signal": "negation_in_stem", "description": "Question contains negation word", "threshold": 1.0},
          {"signal": "selected_obvious_wrong", "description": "Selected most obviously correct option", "threshold": 0.8}
        ],
        "prevalence": {
          "TPS-PU": 0.20,
          "TPS-PBM": 0.15
        },
        "tips": [
          "Circle or highlight negation words (NOT, EXCEPT, KECUALI)",
          "Read the question twice before looking at options",
          "Mentally rephrase: 'I need to find the WRONG answer'",
          "Create a checklist: 'Did I check for negation words?'"
        ],
        "remediation": "Circle/highlight negation words, read question twice"
      }
    },
    "content_area_summary": {
      "TPS-PU": {
        "most_common_errors": ["ERR.UTBK.MISREAD_NEGATION", "ERR.UTBK.INFERENCE_LEAP"],
        "error_rate_estimate": 0.25
      }
    }
  }
}

IMPORTANT:
- Create at least 8-12 exam-specific error patterns
- Base patterns on actual documented student mistakes for this exam type
- Include prevalence data for relevant content areas
- Detection signals should be actionable for algorithmic detection
- Categories should help group related errors for analysis`
}
