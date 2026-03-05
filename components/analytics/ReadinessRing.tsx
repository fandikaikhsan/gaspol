/**
 * ReadinessRing Component
 * Phase 3: Analytics Dashboard
 *
 * Circular progress ring showing readiness score with delta indicator
 */

import {
  getReadinessColor,
  calculateReadinessDelta,
} from "@/lib/analytics/readiness-score"

interface ReadinessRingProps {
  score: number // 0-100
  previousScore?: number
  campusTarget?: number // T-052: campus target score (0-100 scale)
  size?: "sm" | "md" | "lg"
  showDelta?: boolean
}

export function ReadinessRing({
  score,
  previousScore,
  campusTarget,
  size = "lg",
  showDelta = true,
}: ReadinessRingProps) {
  const sizes = {
    sm: {
      container: "w-32 h-32",
      circle: 60,
      strokeWidth: 8,
      text: "text-2xl",
      label: "text-xs",
    },
    md: {
      container: "w-40 h-40",
      circle: 70,
      strokeWidth: 10,
      text: "text-3xl",
      label: "text-sm",
    },
    lg: {
      container: "w-48 h-48",
      circle: 85,
      strokeWidth: 12,
      text: "text-4xl",
      label: "text-base",
    },
  }

  const config = sizes[size] ?? sizes.lg
  const radius = config.circle
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  // T-052: Campus target marker angle on the ring
  const targetAngle = campusTarget ? (campusTarget / 100) * 360 : null
  const targetRad = targetAngle ? ((targetAngle - 90) * Math.PI) / 180 : null
  const svgSize = radius * 2 + config.strokeWidth * 2
  const center = radius + config.strokeWidth

  const delta =
    previousScore !== undefined
      ? calculateReadinessDelta(previousScore, score)
      : null

  return (
    <div className="relative inline-flex flex-col items-center">
      {/* SVG Ring */}
      <div className={`relative ${config.container}`}>
        <svg className="transform -rotate-90" width={svgSize} height={svgSize}>
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={config.strokeWidth}
          />

          {/* Progress circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={config.strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />

          {/* T-052: Campus target marker */}
          {targetRad !== null && (
            <>
              <circle
                cx={center + radius * Math.cos(targetRad)}
                cy={center + radius * Math.sin(targetRad)}
                r={config.strokeWidth / 2 + 2}
                fill="hsl(var(--destructive))"
                stroke="white"
                strokeWidth={2}
              />
            </>
          )}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className={`font-bold ${config.text} ${getReadinessColor(score)}`}
          >
            {Math.round(score)}%
          </div>
          <div className={`${config.label} text-muted-foreground font-medium`}>
            Readiness
          </div>
        </div>
      </div>

      {/* T-052: Campus target label */}
      {campusTarget !== undefined && campusTarget > 0 && (
        <div className="mt-1 text-xs text-muted-foreground font-medium">
          🎯 Target: {campusTarget}%
        </div>
      )}

      {/* Delta indicator */}
      {showDelta && delta && (
        <div className="mt-2 flex items-center gap-1">
          {delta.trend === "improving" && (
            <span className="text-status-strong text-sm font-semibold">
              ↑ +{delta.delta}
            </span>
          )}
          {delta.trend === "declining" && (
            <span className="text-destructive text-sm font-semibold">
              ↓ {delta.delta}
            </span>
          )}
          {delta.trend === "stable" && (
            <span className="text-muted-foreground text-sm font-semibold">
              → {delta.delta}
            </span>
          )}
          {delta.percentage !== 0 && (
            <span className="text-xs text-muted-foreground">
              ({delta.percentage > 0 ? "+" : ""}
              {delta.percentage}%)
            </span>
          )}
        </div>
      )}
    </div>
  )
}
