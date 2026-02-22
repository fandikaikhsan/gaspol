/**
 * Assessment Types
 * Phase 2: Question Runner & Assessment Engine
 */

export type QuestionFormat = 'MCQ5' | 'MCK-Table' | 'Fill-in'

export type CognitiveLevel = 'L1' | 'L2' | 'L3'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Question {
  id: string
  micro_skill_id: string
  difficulty: Difficulty
  cognitive_level: CognitiveLevel
  question_format: QuestionFormat
  stem: string
  stem_images: string[]
  options: QuestionOptions
  correct_answer: string
  explanation: string
  explanation_images: string[]
  construct_weights: ConstructWeights
}

export type QuestionOptions =
  | MCQ5Options
  | MCKTableOptions
  | FillInOptions

export interface MCQ5Options {
  A: string
  B: string
  C: string
  D: string
  E: string
}

export interface MCKTableOptions {
  rows: {
    id: string
    text: string
  }[]
  columns: {
    id: string
    text: string
  }[]
}

export interface FillInOptions {
  type: 'numeric' | 'text'
  unit?: string
  placeholder?: string
}

export interface ConstructWeights {
  teliti: number
  speed: number
  reasoning: number
  computation: number
  reading: number
}

export interface Attempt {
  id: string
  user_id: string
  question_id: string
  context_type: 'baseline' | 'drill' | 'mock' | 'recycle' | 'flashcard' | 'swipe'
  context_id: string
  module_id?: string
  user_answer: string
  is_correct: boolean
  time_spent_sec: number
  error_tags: string[]
  construct_impacts: Record<string, number>
  attempted_at: string
}

export interface ModuleQuestion extends Question {
  order: number
}

export interface AssessmentSession {
  moduleId: string
  questionIds: string[]
  currentIndex: number
  startedAt: Date
  answers: Record<string, {
    answer: string
    timeSpent: number
    timestamp: Date
  }>
}
