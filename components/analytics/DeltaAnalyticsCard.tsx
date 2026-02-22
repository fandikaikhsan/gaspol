/**
 * DeltaAnalyticsCard Component
 * Phase 3: Analytics Dashboard
 *
 * Before/after comparison card
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { calculateReadinessDelta } from '@/lib/analytics/readiness-score'
import { calculateConstructDelta } from '@/lib/analytics/construct-scoring'

interface DeltaAnalyticsCardProps {
  title: string
  description?: string
  beforeScore: number
  afterScore: number
  type?: 'readiness' | 'construct'
}

export function DeltaAnalyticsCard({
  title,
  description,
  beforeScore,
  afterScore,
  type = 'readiness',
}: DeltaAnalyticsCardProps) {
  const delta = type === 'readiness'
    ? calculateReadinessDelta(beforeScore, afterScore)
    : calculateConstructDelta(beforeScore, afterScore)

  const isImproving = delta.delta > 0
  const isStable = Math.abs(delta.delta) <= 2

  return (
    <Card className={`
      ${isImproving && !isStable ? 'border-status-strong bg-status-strong/5' : ''}
      ${!isImproving && !isStable ? 'border-destructive bg-destructive/5' : ''}
    `}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Before</div>
            <div className="text-2xl font-bold">{Math.round(beforeScore)}</div>
          </div>

          <div className="text-center px-4">
            {isImproving && (
              <div className="flex flex-col items-center">
                <span className="text-3xl text-status-strong">↑</span>
                <span className="text-sm font-semibold text-status-strong">
                  +{delta.delta}
                </span>
              </div>
            )}
            {!isImproving && !isStable && (
              <div className="flex flex-col items-center">
                <span className="text-3xl text-destructive">↓</span>
                <span className="text-sm font-semibold text-destructive">
                  {delta.delta}
                </span>
              </div>
            )}
            {isStable && (
              <div className="flex flex-col items-center">
                <span className="text-3xl text-muted-foreground">→</span>
                <span className="text-sm font-semibold text-muted-foreground">
                  {delta.delta}
                </span>
              </div>
            )}
          </div>

          <div>
            <div className="text-sm text-muted-foreground">After</div>
            <div className={`text-2xl font-bold ${
              isImproving ? 'text-status-strong' :
              !isStable ? 'text-destructive' :
              ''
            }`}>
              {Math.round(afterScore)}
            </div>
          </div>
        </div>

        {delta.percentage !== 0 && (
          <div className="text-center mt-3 text-sm text-muted-foreground">
            {delta.percentage > 0 ? '+' : ''}{delta.percentage}% change
          </div>
        )}
      </CardContent>
    </Card>
  )
}
