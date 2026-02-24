/**
 * Exam Configuration - Dynamic Analytics
 *
 * Fetches exam-specific constructs, error tags, and metadata
 * from the database instead of using hardcoded values.
 *
 * This enables the platform to adapt to ANY exam type.
 */

import { createClient } from '@/lib/supabase/client'

// Types for dynamic constructs
export interface ExamConstruct {
  code: string
  name: string
  short_name: string | null
  description: string | null
  icon: string | null
  color: string | null
  improvement_tips: string[]
}

export interface ExamErrorTag {
  id: string
  name: string
  description: string | null
  category: string | null
  tips: string[]
  remediation: {
    short?: string
    detailed?: string
  }
  detection_signals: Array<{
    signal: string
    description?: string
    threshold?: number
  }>
  prevalence: Record<string, number>
}

export interface ExamConfig {
  id: string
  name: string
  exam_type: string
  year: number
  constructs: ExamConstruct[]
  error_tags: ExamErrorTag[]
}

/**
 * Fetch constructs for a specific exam
 */
export async function getExamConstructs(examId: string): Promise<ExamConstruct[]> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('get_exam_constructs', {
    p_exam_id: examId
  })

  if (error) {
    console.error('Failed to fetch exam constructs:', error)
    return getDefaultConstructs()
  }

  return data || getDefaultConstructs()
}

/**
 * Fetch error tags for a specific exam (includes global + exam-specific)
 */
export async function getExamErrorTags(examId: string): Promise<ExamErrorTag[]> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('get_error_tags_for_exam', {
    p_exam_id: examId
  })

  if (error) {
    console.error('Failed to fetch exam error tags:', error)
    return []
  }

  // Transform to ExamErrorTag format
  return (data || []).map((tag: any) => ({
    id: tag.tag_id,
    name: tag.name,
    description: tag.description,
    category: tag.category,
    tips: tag.tips || [],
    remediation: tag.remediation || {},
    detection_signals: tag.detection_signals || [],
    prevalence: tag.prevalence || {}
  }))
}

/**
 * Get full exam configuration
 */
export async function getExamConfig(examId: string): Promise<ExamConfig | null> {
  const supabase = createClient()

  const { data: exam, error } = await supabase
    .from('exams')
    .select('id, name, exam_type, year')
    .eq('id', examId)
    .single()

  if (error || !exam) {
    console.error('Failed to fetch exam:', error)
    return null
  }

  const [constructs, errorTags] = await Promise.all([
    getExamConstructs(examId),
    getExamErrorTags(examId)
  ])

  return {
    ...exam,
    constructs,
    error_tags: errorTags
  }
}

/**
 * Get user's current exam (from user_state or default)
 */
export async function getCurrentUserExam(): Promise<{ examId: string; examType: string } | null> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Try to get from user_state
  const { data: userState } = await supabase
    .from('user_state')
    .select('current_exam_id')
    .eq('user_id', user.id)
    .single()

  if (userState?.current_exam_id) {
    const { data: exam } = await supabase
      .from('exams')
      .select('id, exam_type')
      .eq('id', userState.current_exam_id)
      .single()

    if (exam) {
      return { examId: exam.id, examType: exam.exam_type }
    }
  }

  // Fallback: get most recent active exam
  const { data: defaultExam } = await supabase
    .from('exams')
    .select('id, exam_type')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (defaultExam) {
    return { examId: defaultExam.id, examType: defaultExam.exam_type }
  }

  return null
}

/**
 * Default constructs (fallback if no research data)
 * These map to the 5 core constructs used by default
 */
export function getDefaultConstructs(): ExamConstruct[] {
  return [
    {
      code: 'C.ATTENTION',
      name: 'Attention & Accuracy',
      short_name: 'Teliti',
      description: 'Focus, detail orientation, avoiding careless errors',
      icon: '🎯',
      color: 'bg-construct-teliti',
      improvement_tips: [
        'Practice carefully reviewing your answers before submitting',
        'Highlight key words in questions',
        'Double-check your calculations'
      ]
    },
    {
      code: 'C.SPEED',
      name: 'Speed & Efficiency',
      short_name: 'Speed',
      description: 'Working under time pressure, rapid processing',
      icon: '⚡',
      color: 'bg-construct-speed',
      improvement_tips: [
        'Practice with timed drills',
        'Learn to recognize question patterns quickly',
        'Skip difficult questions and return later'
      ]
    },
    {
      code: 'C.REASONING',
      name: 'Logical Reasoning',
      short_name: 'Reasoning',
      description: 'Problem-solving, critical thinking, analysis',
      icon: '🧠',
      color: 'bg-construct-reasoning',
      improvement_tips: [
        'Focus on understanding problem-solving strategies',
        'Practice breaking down complex problems',
        'Study worked examples step-by-step'
      ]
    },
    {
      code: 'C.COMPUTATION',
      name: 'Computation',
      short_name: 'Computation',
      description: 'Mathematical operations, numerical work',
      icon: '🔢',
      color: 'bg-construct-computation',
      improvement_tips: [
        'Strengthen mathematical skills with targeted practice',
        'Review time-saving shortcuts for calculations',
        'Practice mental math techniques'
      ]
    },
    {
      code: 'C.READING',
      name: 'Reading Comprehension',
      short_name: 'Reading',
      description: 'Text understanding, information extraction',
      icon: '📖',
      color: 'bg-construct-reading',
      improvement_tips: [
        'Improve reading comprehension through active reading',
        'Underline key information in the problem',
        'Practice identifying what the question is asking'
      ]
    }
  ]
}

/**
 * Map construct code to legacy construct name (for backwards compatibility)
 */
export function constructCodeToLegacy(code: string): string {
  const mapping: Record<string, string> = {
    'C.ATTENTION': 'teliti',
    'C.SPEED': 'speed',
    'C.REASONING': 'reasoning',
    'C.COMPUTATION': 'computation',
    'C.READING': 'reading'
  }
  return mapping[code] || code.toLowerCase().replace('c.', '')
}

/**
 * Map legacy construct name to code
 */
export function legacyToConstructCode(legacy: string): string {
  const mapping: Record<string, string> = {
    'teliti': 'C.ATTENTION',
    'speed': 'C.SPEED',
    'reasoning': 'C.REASONING',
    'computation': 'C.COMPUTATION',
    'reading': 'C.READING'
  }
  return mapping[legacy] || `C.${legacy.toUpperCase()}`
}
