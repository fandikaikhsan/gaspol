"use client"

/**
 * Coverage Map Component — T-055 point-based coverage
 * Shows covered/uncovered based on total_points ≥ 20
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, AlertCircle, CheckCircle2, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n"

interface CoverageMapProps {
  coverage: Record<string, number> // e.g., { "TPS": 0.85 } (percentage) or { "TPS": 25 } (points)
  pointBased?: boolean // When true, values are total_points (covered ≥ 20)
  onPracticeSubject?: (subject: string) => void
}

export function CoverageMap({
  coverage,
  pointBased = false,
  onPracticeSubject,
}: CoverageMapProps) {
  const { t } = useTranslation("analytics")

  const POINT_THRESHOLD = 20 // T-055: covered when total_points ≥ 20

  // Normalize to percentage for display
  const normalizedEntries = Object.entries(coverage).map(([subject, val]) => {
    if (pointBased) {
      // val is total_points — convert to 0-100 capped at threshold
      return [subject, Math.min((val / POINT_THRESHOLD) * 100, 100)] as [
        string,
        number,
      ]
    }
    // Legacy: val is 0-1 ratio
    return [subject, val * 100] as [string, number]
  })

  // Sort by coverage (lowest first)
  const sortedCoverage = normalizedEntries.sort((a, b) => a[1] - b[1])

  // Overall
  const overallPct =
    sortedCoverage.length > 0
      ? Math.round(
          sortedCoverage.reduce((sum, [, pct]) => sum + pct, 0) /
            sortedCoverage.length,
        )
      : 0

  // Get status for a coverage percentage
  const getStatus = (pct: number) => {
    if (pct >= 70)
      return {
        label: t("coverage.strong"),
        color: "bg-green-500",
        textColor: "text-green-700",
        bgColor: "bg-green-50",
        icon: CheckCircle2,
      }
    if (pct >= 30)
      return {
        label: t("coverage.developing"),
        color: "bg-yellow-500",
        textColor: "text-yellow-700",
        bgColor: "bg-yellow-50",
        icon: Target,
      }
    return {
      label: t("coverage.needsFocus"),
      color: "bg-red-500",
      textColor: "text-red-700",
      bgColor: "bg-red-50",
      icon: AlertCircle,
    }
  }

  const overallStatus = getStatus(overallPct)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t("coverage.title")}
            </CardTitle>
            <CardDescription>{t("coverage.subtitle")}</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{overallPct}%</div>
            <Badge className={`${overallStatus.color} text-white text-xs`}>
              {t("coverage.overall")}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sortedCoverage.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {t("coverage.noData")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedCoverage.map(([subject, pct]) => {
              const roundedPct = Math.round(pct)
              const status = getStatus(roundedPct)
              const StatusIcon = status.icon
              // For point-based, show the raw points from original data
              const rawPoints = pointBased ? coverage[subject] : undefined

              return (
                <div
                  key={subject}
                  className={`p-3 border-2 rounded-lg ${status.bgColor}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`h-4 w-4 ${status.textColor}`} />
                      <span className="font-semibold">{subject}</span>
                      <Badge className={`${status.color} text-white text-xs`}>
                        {status.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {pointBased && rawPoints !== undefined ? (
                        <span className="text-sm font-medium">
                          {rawPoints}/{POINT_THRESHOLD} pts
                        </span>
                      ) : (
                        <span className="text-sm font-medium">
                          {roundedPct}%
                        </span>
                      )}
                      {onPracticeSubject && roundedPct < 70 && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="touch-target"
                          onClick={() => onPracticeSubject(subject)}
                        >
                          {t("coverage.practice")}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-3 bg-white border-2 border-charcoal rounded-full overflow-hidden">
                    <div
                      className={`h-full ${status.color} transition-all duration-500`}
                      style={{ width: `${roundedPct}%` }}
                    />
                  </div>

                  {/* Coverage milestone indicator */}
                  <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                    <span>0%</span>
                    <div className="flex gap-2">
                      <span className={roundedPct >= 30 ? "font-semibold" : ""}>
                        30%
                      </span>
                      <span className={roundedPct >= 70 ? "font-semibold" : ""}>
                        70%
                      </span>
                    </div>
                    <span>100%</span>
                  </div>
                </div>
              )
            })}

            {/* Summary */}
            <div className="pt-4 border-t-2 border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("coverage.subjectsStrong", {
                    strong: sortedCoverage.filter(([_, pct]) => pct >= 70)
                      .length,
                    total: sortedCoverage.length,
                  })}
                </span>
                <span className="text-muted-foreground">
                  {t("coverage.needFocus", {
                    count: sortedCoverage.filter(([_, pct]) => pct < 30).length,
                  })}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
