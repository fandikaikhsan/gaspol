"use client"

/**
 * Coverage Map Component
 * Shows percentage of taxonomy attempted per subject area
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, AlertCircle, CheckCircle2, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n"

interface CoverageMapProps {
  coverage: Record<string, number> // e.g., { "TPS": 0.85, "TKA": 0.45 }
  onPracticeSubject?: (subject: string) => void
}

export function CoverageMap({ coverage, onPracticeSubject }: CoverageMapProps) {
  const { t } = useTranslation('analytics')

  // Sort subjects by coverage (lowest first to highlight what needs work)
  const sortedCoverage = Object.entries(coverage).sort((a, b) => a[1] - b[1])

  // Calculate overall coverage
  const overallCoverage = Object.values(coverage).length > 0
    ? Object.values(coverage).reduce((sum, val) => sum + val, 0) / Object.values(coverage).length
    : 0
  const overallPct = Math.round(overallCoverage * 100)

  // Get status for a coverage percentage
  const getStatus = (pct: number) => {
    if (pct >= 70) return {
      label: t('coverage.strong'),
      color: "bg-green-500",
      textColor: "text-green-700",
      bgColor: "bg-green-50",
      icon: CheckCircle2
    }
    if (pct >= 30) return {
      label: t('coverage.developing'),
      color: "bg-yellow-500",
      textColor: "text-yellow-700",
      bgColor: "bg-yellow-50",
      icon: Target
    }
    return {
      label: t('coverage.needsFocus'),
      color: "bg-red-500",
      textColor: "text-red-700",
      bgColor: "bg-red-50",
      icon: AlertCircle
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
              {t('coverage.title')}
            </CardTitle>
            <CardDescription>
              {t('coverage.subtitle')}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{overallPct}%</div>
            <Badge className={`${overallStatus.color} text-white text-xs`}>
              {t('coverage.overall')}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sortedCoverage.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {t('coverage.noData')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedCoverage.map(([subject, percentage]) => {
              const pct = Math.round(percentage * 100)
              const status = getStatus(pct)
              const StatusIcon = status.icon

              return (
                <div key={subject} className={`p-3 border-2 rounded-lg ${status.bgColor}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`h-4 w-4 ${status.textColor}`} />
                      <span className="font-semibold">{subject}</span>
                      <Badge className={`${status.color} text-white text-xs`}>
                        {status.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{pct}%</span>
                      {onPracticeSubject && pct < 70 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onPracticeSubject(subject)}
                        >
                          {t('coverage.practice')}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-3 bg-white border-2 border-charcoal rounded-full overflow-hidden">
                    <div
                      className={`h-full ${status.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Coverage milestone indicator */}
                  <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                    <span>0%</span>
                    <div className="flex gap-2">
                      <span className={pct >= 30 ? "font-semibold" : ""}>30%</span>
                      <span className={pct >= 70 ? "font-semibold" : ""}>70%</span>
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
                  {t('coverage.subjectsStrong', { strong: sortedCoverage.filter(([_, pct]) => pct >= 0.7).length, total: sortedCoverage.length })}
                </span>
                <span className="text-muted-foreground">
                  {t('coverage.needFocus', { count: sortedCoverage.filter(([_, pct]) => pct < 0.3).length })}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
