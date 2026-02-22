/**
 * Construct Scoring
 * Phase 3: Analytics Dashboard
 *
 * Five-construct profile:
 * 1. Teliti (Careful) - attention to detail, avoiding careless errors
 * 2. Speed - answering quickly without rushing
 * 3. Reasoning - logical thinking and analysis
 * 4. Computation - mathematical calculation accuracy
 * 5. Reading - comprehension and interpretation
 *
 * Each construct scored 0-100, starts at 50 (neutral)
 */

export type ConstructName = 'teliti' | 'speed' | 'reasoning' | 'computation' | 'reading'

export interface ConstructState {
  construct_name: ConstructName
  score: number // 0-100
  confidence: number // 0-100
  trend: 'improving' | 'stable' | 'declining'
  data_points: number
}

export interface ConstructProfile {
  teliti: ConstructState
  speed: ConstructState
  reasoning: ConstructState
  computation: ConstructState
  reading: ConstructState
}

/**
 * Get construct display info
 */
export function getConstructInfo(construct: ConstructName): {
  name: string
  description: string
  icon: string
  color: string
} {
  const info = {
    teliti: {
      name: 'Teliti (Careful)',
      description: 'Attention to detail and avoiding careless mistakes',
      icon: '🎯',
      color: 'bg-construct-teliti',
    },
    speed: {
      name: 'Speed',
      description: 'Answering efficiently without rushing',
      icon: '⚡',
      color: 'bg-construct-speed',
    },
    reasoning: {
      name: 'Reasoning',
      description: 'Logical thinking and analytical skills',
      icon: '🧠',
      color: 'bg-construct-reasoning',
    },
    computation: {
      name: 'Computation',
      description: 'Mathematical calculation accuracy',
      icon: '🔢',
      color: 'bg-construct-computation',
    },
    reading: {
      name: 'Reading',
      description: 'Text comprehension and interpretation',
      icon: '📖',
      color: 'bg-construct-reading',
    },
  }

  return info[construct]
}

/**
 * Get construct score interpretation
 */
export function getConstructInterpretation(score: number): {
  level: 'strong' | 'developing' | 'weak'
  label: string
  color: string
} {
  if (score >= 70) {
    return {
      level: 'strong',
      label: 'Strong',
      color: 'text-status-strong',
    }
  } else if (score >= 50) {
    return {
      level: 'developing',
      label: 'Developing',
      color: 'text-status-developing',
    }
  } else {
    return {
      level: 'weak',
      label: 'Needs Work',
      color: 'text-destructive',
    }
  }
}

/**
 * Calculate construct delta between two snapshots
 */
export function calculateConstructDelta(
  before: number,
  after: number
): {
  delta: number
  percentage: number
  isImproving: boolean
} {
  const delta = after - before
  const percentage = before > 0 ? (delta / before) * 100 : 0

  return {
    delta: Math.round(delta * 10) / 10,
    percentage: Math.round(percentage * 10) / 10,
    isImproving: delta > 0,
  }
}

/**
 * Identify weakest constructs for targeting
 */
export function identifyWeakConstructs(
  profile: ConstructProfile,
  threshold: number = 60
): ConstructName[] {
  const weak: ConstructName[] = []

  for (const [name, state] of Object.entries(profile)) {
    if (state.score < threshold) {
      weak.push(name as ConstructName)
    }
  }

  // Sort by score (weakest first)
  weak.sort((a, b) => profile[a].score - profile[b].score)

  return weak
}

/**
 * Get construct radar chart data
 */
export function getConstructRadarData(profile: ConstructProfile): Array<{
  construct: string
  score: number
  fullMark: number
}> {
  return [
    {
      construct: 'Teliti',
      score: Math.round(profile.teliti.score),
      fullMark: 100,
    },
    {
      construct: 'Speed',
      score: Math.round(profile.speed.score),
      fullMark: 100,
    },
    {
      construct: 'Reasoning',
      score: Math.round(profile.reasoning.score),
      fullMark: 100,
    },
    {
      construct: 'Computation',
      score: Math.round(profile.computation.score),
      fullMark: 100,
    },
    {
      construct: 'Reading',
      score: Math.round(profile.reading.score),
      fullMark: 100,
    },
  ]
}

/**
 * Calculate overall construct score (average)
 */
export function calculateOverallConstructScore(profile: ConstructProfile): number {
  const scores = Object.values(profile).map(s => s.score)
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length
  return Math.round(average)
}

/**
 * Get construct recommendations
 */
export function getConstructRecommendations(profile: ConstructProfile): string[] {
  const recommendations: string[] = []

  if (profile.teliti.score < 60) {
    recommendations.push('Practice carefully reviewing your answers before submitting')
  }

  if (profile.speed.score < 60) {
    recommendations.push('Work on time management - practice with timed drills')
  }

  if (profile.reasoning.score < 60) {
    recommendations.push('Focus on understanding problem-solving strategies and patterns')
  }

  if (profile.computation.score < 60) {
    recommendations.push('Strengthen mathematical skills with targeted practice')
  }

  if (profile.reading.score < 60) {
    recommendations.push('Improve reading comprehension through active reading techniques')
  }

  return recommendations
}
