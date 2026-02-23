/**
 * Suggest Metadata Edge Function
 * AI-powered metadata suggestions based on research data
 *
 * Features:
 * - Suggests construct_weights based on taxonomy research profiles
 * - Suggests time_estimate_seconds based on difficulty + research
 * - Suggests cognitive_level and difficulty if missing
 * - Returns confidence scores and reasoning
 */

import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface SuggestMetadataRequest {
  question_id: string
  use_ai?: boolean // If true, uses Claude for intelligent analysis
}

interface MetadataSuggestion {
  construct_weights: Record<string, number>
  time_estimate_seconds: number
  cognitive_level?: string
  difficulty?: string
  confidence: number
  source: string
  reasoning: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Get authorization token
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      throw new Error("Missing authorization header")
    }

    const token = authHeader.replace("Bearer ", "")
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify user token
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData.user) {
      throw new Error("Invalid user token")
    }

    const userId = userData.user.id

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single()

    if (profile?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Parse request body
    const body: SuggestMetadataRequest = await req.json()
    const { question_id, use_ai = false } = body

    if (!question_id) {
      return new Response(
        JSON.stringify({ error: "question_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // =====================================================
    // 1. FETCH QUESTION DATA
    // =====================================================
    const { data: question, error: questionError } = await supabase
      .from("questions")
      .select(`
        id,
        question_text,
        question_type,
        difficulty,
        cognitive_level,
        construct_weights,
        time_estimate_seconds,
        question_taxonomy (
          taxonomy_node_id,
          taxonomy_nodes (
            id,
            code,
            name,
            level,
            default_construct_weights,
            expected_time_sec,
            exam_id
          )
        )
      `)
      .eq("id", question_id)
      .single()

    if (questionError || !question) {
      return new Response(
        JSON.stringify({ error: "Question not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // =====================================================
    // 2. GET RESEARCH PROFILES
    // =====================================================
    const taxonomyNodes = question.question_taxonomy?.map((qt: any) => qt.taxonomy_nodes) || []

    let researchProfiles: any[] = []

    if (taxonomyNodes.length > 0) {
      const examId = taxonomyNodes[0]?.exam_id

      if (examId) {
        // Get construct profiles from exam research
        const { data: exam } = await supabase
          .from("exams")
          .select("construct_profile")
          .eq("id", examId)
          .single()

        if (exam?.construct_profile) {
          researchProfiles = taxonomyNodes.map((node: any) => ({
            node_code: node.code,
            node_name: node.name,
            profile: exam.construct_profile[node.code] || null,
            default_weights: node.default_construct_weights,
            expected_time: node.expected_time_sec
          }))
        }
      }
    }

    // =====================================================
    // 3. GENERATE SUGGESTIONS (Rule-based or AI)
    // =====================================================
    let suggestion: MetadataSuggestion

    if (use_ai && researchProfiles.length > 0) {
      // AI-powered suggestion using Claude
      suggestion = await generateAISuggestion(
        question,
        taxonomyNodes,
        researchProfiles,
        Deno.env.get("ANTHROPIC_API_KEY")!
      )
    } else {
      // Rule-based suggestion
      suggestion = generateRuleBasedSuggestion(question, taxonomyNodes, researchProfiles)
    }

    // =====================================================
    // 4. RETURN SUGGESTIONS
    // =====================================================
    return new Response(
      JSON.stringify({
        success: true,
        question_id: question_id,
        current_metadata: {
          construct_weights: question.construct_weights || {},
          time_estimate_seconds: question.time_estimate_seconds,
          cognitive_level: question.cognitive_level,
          difficulty: question.difficulty
        },
        suggestions: suggestion,
        research_available: researchProfiles.length > 0,
        taxonomy_nodes: taxonomyNodes.map((n: any) => ({
          code: n.code,
          name: n.name,
          level: n.level
        }))
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )

  } catch (error) {
    console.error("Suggest metadata error:", error)

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  }
})

/**
 * Generate rule-based metadata suggestion
 */
function generateRuleBasedSuggestion(
  question: any,
  taxonomyNodes: any[],
  researchProfiles: any[]
): MetadataSuggestion {
  // =====================================================
  // CONSTRUCT WEIGHTS
  // =====================================================
  let constructWeights: Record<string, number> = {
    "C.ATTENTION": 0.20,
    "C.SPEED": 0.20,
    "C.REASONING": 0.20,
    "C.COMPUTATION": 0.20,
    "C.READING": 0.20
  }

  let source = "default"
  let confidence = 0.5
  let reasoning = "Using balanced default weights"

  // Try to get from research profile
  if (researchProfiles.length > 0 && researchProfiles[0].profile?.constructs) {
    constructWeights = researchProfiles[0].profile.constructs
    source = "research"
    confidence = 0.85
    reasoning = `Based on research profile for ${researchProfiles[0].node_name}`
  }
  // Fallback to taxonomy node defaults
  else if (taxonomyNodes.length > 0 && taxonomyNodes[0].default_construct_weights) {
    constructWeights = taxonomyNodes[0].default_construct_weights
    source = "taxonomy"
    confidence = 0.70
    reasoning = `Based on taxonomy node ${taxonomyNodes[0].name} defaults`
  }

  // Adjust based on cognitive level if available
  if (question.cognitive_level) {
    constructWeights = adjustWeightsByCognitiveLevel(constructWeights, question.cognitive_level)
    reasoning += ` (adjusted for ${question.cognitive_level})`
    confidence = Math.min(confidence + 0.05, 0.95)
  }

  // =====================================================
  // TIME ESTIMATE
  // =====================================================
  let timeEstimate = 120 // default

  // Try research profile first
  if (researchProfiles.length > 0 && researchProfiles[0].profile?.time_expectations?.average) {
    timeEstimate = researchProfiles[0].profile.time_expectations.average
  }
  // Fallback to taxonomy node
  else if (taxonomyNodes.length > 0 && taxonomyNodes[0].expected_time_sec) {
    timeEstimate = taxonomyNodes[0].expected_time_sec
  }

  // Adjust by difficulty
  if (question.difficulty === "easy") {
    timeEstimate = Math.round(timeEstimate * 0.75)
  } else if (question.difficulty === "hard") {
    timeEstimate = Math.round(timeEstimate * 1.25)
  }

  return {
    construct_weights: constructWeights,
    time_estimate_seconds: timeEstimate,
    cognitive_level: question.cognitive_level,
    difficulty: question.difficulty,
    confidence: confidence,
    source: source,
    reasoning: reasoning
  }
}

/**
 * Generate AI-powered metadata suggestion using Claude
 */
async function generateAISuggestion(
  question: any,
  taxonomyNodes: any[],
  researchProfiles: any[],
  anthropicKey: string
): Promise<MetadataSuggestion> {
  const prompt = buildAnalysisPrompt(question, taxonomyNodes, researchProfiles)

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
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
    console.error("Anthropic API error:", await response.text())
    // Fallback to rule-based on API error
    return generateRuleBasedSuggestion(question, taxonomyNodes, researchProfiles)
  }

  const data = await response.json()
  const aiOutput = data.content[0].text

  try {
    return JSON.parse(aiOutput)
  } catch (e) {
    console.error("Failed to parse AI output:", e)
    // Fallback to rule-based on parse error
    return generateRuleBasedSuggestion(question, taxonomyNodes, researchProfiles)
  }
}

/**
 * Build analysis prompt for Claude
 */
function buildAnalysisPrompt(
  question: any,
  taxonomyNodes: any[],
  researchProfiles: any[]
): string {
  return `You are an expert psychometrician analyzing question metadata for an Indonesian university entrance exam.

TASK: Suggest optimal metadata for this question based on research data and question characteristics.

QUESTION:
Type: ${question.question_type}
Text: ${question.question_text?.substring(0, 500) || "N/A"}
Current Difficulty: ${question.difficulty || "not set"}
Current Cognitive Level: ${question.cognitive_level || "not set"}

TAXONOMY NODES:
${taxonomyNodes.map((n: any) => `- ${n.code}: ${n.name} (Level ${n.level})`).join("\n")}

RESEARCH PROFILES:
${JSON.stringify(researchProfiles, null, 2)}

COGNITIVE CONSTRUCTS (5 core):
- C.ATTENTION: Attention & Accuracy (focus, detail orientation)
- C.SPEED: Speed & Efficiency (working under time pressure)
- C.REASONING: Logical Reasoning (problem-solving, critical thinking)
- C.COMPUTATION: Computation & Calculation (mathematical operations)
- C.READING: Reading Comprehension (text understanding)

COGNITIVE LEVELS:
- L1 (Recall): Memory, recognition, basic knowledge
- L2 (Application): Applying concepts, procedural skills
- L3 (Analysis): Complex reasoning, synthesis, evaluation

DIFFICULTY LEVELS:
- easy: Straightforward, minimal complexity
- medium: Moderate complexity, multiple steps
- hard: High complexity, advanced reasoning

INSTRUCTIONS:
1. Analyze the question text and type
2. Consider the research profile data if available
3. Suggest construct_weights as DECIMALS (must sum to 1.0)
4. Suggest time_estimate_seconds as INTEGER (seconds)
5. Suggest cognitive_level (L1/L2/L3) if not set
6. Suggest difficulty (easy/medium/hard) if not set
7. Provide confidence score (0.0-1.0)
8. Explain your reasoning

OUTPUT (JSON only, no markdown):

{
  "construct_weights": {
    "C.ATTENTION": 0.25,
    "C.SPEED": 0.20,
    "C.REASONING": 0.25,
    "C.COMPUTATION": 0.10,
    "C.READING": 0.20
  },
  "time_estimate_seconds": 90,
  "cognitive_level": "L2",
  "difficulty": "medium",
  "confidence": 0.85,
  "source": "ai_analysis",
  "reasoning": "Detailed explanation of why these values were chosen based on question analysis and research data"
}`
}

/**
 * Adjust construct weights based on cognitive level
 */
function adjustWeightsByCognitiveLevel(
  baseWeights: Record<string, number>,
  cognitiveLevel: string
): Record<string, number> {
  const weights = { ...baseWeights }

  if (cognitiveLevel === "L1") {
    // Recall: Boost attention and reading, reduce reasoning
    weights["C.ATTENTION"] = Math.min((weights["C.ATTENTION"] || 0.2) * 1.2, 0.35)
    weights["C.READING"] = Math.min((weights["C.READING"] || 0.2) * 1.1, 0.30)
    weights["C.REASONING"] = Math.max((weights["C.REASONING"] || 0.2) * 0.8, 0.10)
  } else if (cognitiveLevel === "L3") {
    // Analysis: Boost reasoning, reduce attention
    weights["C.REASONING"] = Math.min((weights["C.REASONING"] || 0.2) * 1.5, 0.40)
    weights["C.ATTENTION"] = Math.max((weights["C.ATTENTION"] || 0.2) * 0.8, 0.10)
  }

  // Normalize to sum to 1.0
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0)
  Object.keys(weights).forEach(key => {
    weights[key] = parseFloat((weights[key] / total).toFixed(2))
  })

  return weights
}
