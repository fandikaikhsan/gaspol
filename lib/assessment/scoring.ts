/**
 * Scoring Logic — Pure Functions
 * Extracted for testability (T-018)
 *
 * Point calculation, correctness checking, construct impact computation
 */

export type DifficultyLevel = 'L1' | 'L2' | 'L3'

/**
 * Calculate point value from difficulty level
 * L1 → 1pt, L2 → 2pt, L3 → 5pt
 */
export function getPointValue(difficultyLevel: DifficultyLevel | string | null): number {
  switch (difficultyLevel) {
    case 'L1': return 1
    case 'L2': return 2
    case 'L3': return 5
    default: return 0
  }
}

/**
 * Calculate points awarded for an attempt
 * Correct → point_value, Incorrect → 0
 */
export function calculatePointsAwarded(
  isCorrect: boolean,
  pointValue: number | null,
  difficultyLevel: DifficultyLevel | string | null
): number {
  if (!isCorrect) return 0
  // Prefer stored point_value, fall back to computed from difficulty
  return pointValue ?? getPointValue(difficultyLevel)
}

/**
 * Check MCQ answer correctness (single choice)
 */
export function checkMCQCorrectness(
  selectedAnswer: unknown,
  correctAnswer: unknown
): boolean {
  return (
    typeof selectedAnswer === 'string' &&
    typeof correctAnswer === 'string' &&
    selectedAnswer.toUpperCase() === correctAnswer.toUpperCase()
  )
}

/**
 * Check MCK (multiple choice) answer correctness
 */
export function checkMCKCorrectness(
  selectedAnswer: unknown,
  correctAnswer: unknown
): boolean {
  if (!Array.isArray(selectedAnswer)) return false

  const userAnswers = selectedAnswer.map(a => String(a).toUpperCase()).sort()
  const correct = Array.isArray(correctAnswer)
    ? correctAnswer.map(a => String(a).toUpperCase()).sort()
    : typeof correctAnswer === 'string'
      ? correctAnswer.split(',').map(a => a.trim().toUpperCase()).sort()
      : []

  return JSON.stringify(userAnswers) === JSON.stringify(correct)
}

/**
 * Check Fill-in answer correctness (normalized string compare)
 */
export function checkFillInCorrectness(
  selectedAnswer: unknown,
  correctAnswer: unknown
): boolean {
  if (typeof selectedAnswer !== 'string' || typeof correctAnswer !== 'string') return false
  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
  return normalize(selectedAnswer) === normalize(correctAnswer)
}

/**
 * Check answer correctness for any question format
 */
export function checkCorrectness(
  format: string,
  selectedAnswer: unknown,
  correctAnswer: unknown
): boolean {
  const normalizedFormat = (format || '').toLowerCase()

  if (normalizedFormat.includes('mcq') || normalizedFormat === 'mcq') {
    return checkMCQCorrectness(selectedAnswer, correctAnswer)
  }
  if (normalizedFormat.includes('mck') || normalizedFormat === 'mck') {
    return checkMCKCorrectness(selectedAnswer, correctAnswer)
  }
  if (normalizedFormat.includes('fill')) {
    return checkFillInCorrectness(selectedAnswer, correctAnswer)
  }
  if (normalizedFormat === 'tf' || normalizedFormat === 'true_false' || normalizedFormat === 'truefalse') {
    return checkMCQCorrectness(selectedAnswer, correctAnswer) // TF is just binary choice
  }

  // Default: exact match
  return checkMCQCorrectness(selectedAnswer, correctAnswer)
}

/**
 * Calculate construct impact for a single construct dimension
 */
export function calculateConstructImpact(
  isCorrect: boolean,
  weight: number,
  difficultyLevel: DifficultyLevel | string | null
): number {
  if (weight === 0) return 0

  const difficultyMultiplier =
    difficultyLevel === 'L3' ? 1.5 :
    difficultyLevel === 'L2' ? 1.0 : 0.7

  const baseImpact = 5

  const impact = isCorrect
    ? weight * baseImpact * difficultyMultiplier
    : -weight * baseImpact * difficultyMultiplier * 0.5

  return Math.round(impact * 100) / 100
}

/**
 * Calculate all construct impacts from question weights
 */
export function calculateAllConstructImpacts(
  isCorrect: boolean,
  constructWeights: Record<string, number> | null,
  difficultyLevel: DifficultyLevel | string | null
): Record<string, number> {
  if (!constructWeights) return {}

  const impacts: Record<string, number> = {}
  const constructs = ['teliti', 'speed', 'reasoning', 'computation', 'reading']

  for (const construct of constructs) {
    const weight = constructWeights[construct]
    if (typeof weight !== 'number' || weight === 0) continue
    impacts[construct] = calculateConstructImpact(isCorrect, weight, difficultyLevel)
  }

  return impacts
}

/**
 * Update construct score using Exponential Moving Average
 */
export function computeNewConstructScore(
  currentScore: number,
  impact: number,
  dataPoints: number
): number {
  const learningRate = 1 / Math.sqrt(dataPoints)
  const newScore = currentScore + impact * learningRate
  return Math.round(Math.max(0, Math.min(100, newScore)) * 100) / 100
}

/**
 * Determine construct trend from score delta
 */
export function determineTrend(scoreDelta: number): 'improving' | 'stable' | 'declining' {
  if (scoreDelta > 0.5) return 'improving'
  if (scoreDelta < -0.5) return 'declining'
  return 'stable'
}

/**
 * Calculate pass/fail for a module
 */
export function checkModulePassFail(
  correctCount: number,
  totalQuestions: number,
  passingThreshold: number = 0.70
): { passed: boolean; scoreRatio: number } {
  const scoreRatio = totalQuestions > 0 ? correctCount / totalQuestions : 0
  return {
    passed: scoreRatio >= passingThreshold,
    scoreRatio: Math.round(scoreRatio * 100) / 100,
  }
}

/**
 * Derive error tags based on performance signals
 */
export function deriveErrorTags(
  isCorrect: boolean,
  timeSpentSec: number,
  expectedTimeSec: number,
  constructWeights?: Record<string, number> | null
): Array<{ tag_id: string; confidence: number }> {
  const tags: Array<{ tag_id: string; confidence: number }> = []
  const timeRatio = timeSpentSec / (expectedTimeSec || 120)

  // Time-based tags
  if (timeRatio > 1.5) {
    tags.push({ tag_id: 'ERR.SLOW', confidence: 1.0 })
  }
  if (timeRatio < 0.3) {
    tags.push({ tag_id: 'ERR.RUSHED', confidence: 1.0 })
  }

  // Performance-based tags (incorrect only)
  if (!isCorrect) {
    if (timeRatio < 0.6) {
      tags.push({ tag_id: 'ERR.CARELESS', confidence: 0.8 })
    }
    if (timeRatio > 1.3) {
      tags.push({ tag_id: 'ERR.STRUGGLE', confidence: 0.8 })
    }

    // Construct-based tags
    if (constructWeights) {
      const maxWeight = Math.max(
        ...Object.values(constructWeights).filter(v => typeof v === 'number')
      )
      if (maxWeight > 0) {
        const constructTagMap: Record<string, string> = {
          teliti: 'ERR.ATTENTION',
          speed: 'ERR.SPEED',
          reasoning: 'ERR.REASONING',
          computation: 'ERR.COMPUTATION',
          reading: 'ERR.READING',
        }
        for (const [construct, weight] of Object.entries(constructWeights)) {
          if (typeof weight === 'number' && weight === maxWeight && weight >= 0.3) {
            const tagId = constructTagMap[construct]
            if (tagId) {
              tags.push({ tag_id: tagId, confidence: weight })
            }
          }
        }
      }
    }
  }

  return tags
}
