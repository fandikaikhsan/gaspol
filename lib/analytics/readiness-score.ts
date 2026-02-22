/**
 * Readiness Score Calculation
 * Phase 3: Analytics Dashboard
 *
 * Formula: Weighted combination of:
 * - Accuracy (40%)
 * - Speed Index (25%)
 * - Stability (20%)
 * - Coverage (15%)
 *
 * Output: 0-100 score representing overall exam readiness
 */

export interface ReadinessMetrics {
  accuracy: number // 0-100, percentage of correct answers
  speed_index: number // 0-100, normalized speed score
  stability: number // 0-100, consistency across attempts
  coverage: number // 0-100, percentage of skills tested
}

export interface ReadinessResult {
  score: number // 0-100
  grade: 'excellent' | 'good' | 'fair' | 'needs_work'
  breakdown: ReadinessMetrics
  recommendations: string[]
}

const WEIGHTS = {
  accuracy: 0.4,
  speed_index: 0.25,
  stability: 0.2,
  coverage: 0.15,
}

/**
 * Calculate overall readiness score
 */
export function calculateReadinessScore(metrics: ReadinessMetrics): ReadinessResult {
  // Weighted average
  const score =
    metrics.accuracy * WEIGHTS.accuracy +
    metrics.speed_index * WEIGHTS.speed_index +
    metrics.stability * WEIGHTS.stability +
    metrics.coverage * WEIGHTS.coverage

  // Determine grade
  let grade: ReadinessResult['grade']
  if (score >= 80) grade = 'excellent'
  else if (score >= 65) grade = 'good'
  else if (score >= 50) grade = 'fair'
  else grade = 'needs_work'

  // Generate recommendations
  const recommendations: string[] = []

  if (metrics.accuracy < 60) {
    recommendations.push('Focus on understanding core concepts - accuracy needs improvement')
  }

  if (metrics.speed_index < 50) {
    recommendations.push('Practice more to improve speed without sacrificing accuracy')
  }

  if (metrics.stability < 60) {
    recommendations.push('Work on consistency - review topics where performance varies')
  }

  if (metrics.coverage < 70) {
    recommendations.push('Expand topic coverage - several areas remain untested')
  }

  if (recommendations.length === 0) {
    recommendations.push('Keep up the great work! Focus on maintaining performance')
  }

  return {
    score: Math.round(score),
    grade,
    breakdown: metrics,
    recommendations,
  }
}

/**
 * Calculate readiness score from user skill states
 */
export async function calculateReadinessFromSkillStates(
  skillStates: Array<{
    accuracy: number
    avg_speed_index: number
    stability: number
  }>,
  totalSkills: number
): Promise<ReadinessResult> {
  if (skillStates.length === 0) {
    return {
      score: 0,
      grade: 'needs_work',
      breakdown: {
        accuracy: 0,
        speed_index: 0,
        stability: 0,
        coverage: 0,
      },
      recommendations: ['Complete baseline assessment to get your readiness score'],
    }
  }

  // Calculate averages
  const avgAccuracy =
    skillStates.reduce((sum, s) => sum + s.accuracy, 0) / skillStates.length

  const avgSpeedIndex =
    skillStates.reduce((sum, s) => sum + s.avg_speed_index, 0) / skillStates.length

  const avgStability =
    skillStates.reduce((sum, s) => sum + s.stability, 0) / skillStates.length

  // Coverage = skills tested / total skills
  const coverage = (skillStates.length / totalSkills) * 100

  return calculateReadinessScore({
    accuracy: avgAccuracy,
    speed_index: avgSpeedIndex,
    stability: avgStability,
    coverage,
  })
}

/**
 * Calculate delta between two readiness scores
 */
export function calculateReadinessDelta(
  before: number,
  after: number
): {
  delta: number
  percentage: number
  trend: 'improving' | 'stable' | 'declining'
} {
  const delta = after - before
  const percentage = before > 0 ? (delta / before) * 100 : 0

  let trend: 'improving' | 'stable' | 'declining'
  if (delta > 2) trend = 'improving'
  else if (delta < -2) trend = 'declining'
  else trend = 'stable'

  return {
    delta: Math.round(delta * 10) / 10,
    percentage: Math.round(percentage * 10) / 10,
    trend,
  }
}

/**
 * Get readiness score display color
 */
export function getReadinessColor(score: number): string {
  if (score >= 80) return 'text-status-strong'
  if (score >= 65) return 'text-status-developing'
  if (score >= 50) return 'text-muted-foreground'
  return 'text-destructive'
}

/**
 * Get readiness grade label
 */
export function getReadinessGradeLabel(grade: ReadinessResult['grade']): string {
  const labels = {
    excellent: 'Excellent - Ready for Exam',
    good: 'Good - On Track',
    fair: 'Fair - Needs More Practice',
    needs_work: 'Needs Work - Focus Required',
  }
  return labels[grade]
}
