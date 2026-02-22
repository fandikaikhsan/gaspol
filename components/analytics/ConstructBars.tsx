/**
 * ConstructBars Component
 * Phase 3: Analytics Dashboard
 *
 * Horizontal bar chart for construct scores
 */

import { ConstructProfile, getConstructInfo, getConstructInterpretation, type ConstructName } from '@/lib/analytics/construct-scoring'
import { Badge } from '@/components/ui/badge'

interface ConstructBarsProps {
  profile: ConstructProfile
  showDetails?: boolean
}

export function ConstructBars({ profile, showDetails = true }: ConstructBarsProps) {
  const constructs: ConstructName[] = ['teliti', 'speed', 'reasoning', 'computation', 'reading']

  return (
    <div className="space-y-4">
      {constructs.map((construct) => {
        const state = profile[construct]
        const info = getConstructInfo(construct)
        const interpretation = getConstructInterpretation(state.score)

        return (
          <div key={construct} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{info.icon}</span>
                <div>
                  <div className="font-semibold">{info.name}</div>
                  {showDetails && (
                    <div className="text-xs text-muted-foreground">
                      {info.description}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${interpretation.color}`}>
                  {Math.round(state.score)}
                </span>
                {showDetails && (
                  <Badge
                    variant={
                      interpretation.level === 'strong' ? 'strong' :
                      interpretation.level === 'developing' ? 'developing' :
                      'weak'
                    }
                  >
                    {interpretation.label}
                  </Badge>
                )}
              </div>
            </div>

            {/* Bar */}
            <div className="h-3 bg-muted rounded-full overflow-hidden border-2 border-border">
              <div
                className={`h-full ${info.color} transition-all duration-500`}
                style={{ width: `${state.score}%` }}
              />
            </div>

            {/* Trend indicator */}
            {showDetails && state.data_points > 3 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">
                  Trend:
                </span>
                {state.trend === 'improving' && (
                  <span className="text-status-strong font-semibold">
                    ↑ Improving
                  </span>
                )}
                {state.trend === 'stable' && (
                  <span className="text-muted-foreground font-semibold">
                    → Stable
                  </span>
                )}
                {state.trend === 'declining' && (
                  <span className="text-destructive font-semibold">
                    ↓ Declining
                  </span>
                )}
                <span className="text-muted-foreground">
                  ({state.data_points} data points)
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
