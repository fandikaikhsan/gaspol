"use client"

/**
 * Readiness Score Component
 * Circular progress indicator with status and breakdown
 */

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Target, TrendingUp, Clock, CheckCircle2 } from "lucide-react"

interface ReadinessScoreProps {
  score: number // 0-100
  breakdown?: {
    mastery_avg: number
    coverage_pct: number
    consistency: number
    time_efficiency: number
  }
}

export function ReadinessScore({ score, breakdown }: ReadinessScoreProps) {
  // Get status based on score
  const getStatus = (s: number) => {
    if (s >= 80) return {
      label: "Excellent",
      message: "You're well-prepared for the exam!",
      color: "from-green-500 to-emerald-600",
      bgColor: "bg-green-500",
      textColor: "text-green-700",
      borderColor: "border-green-500"
    }
    if (s >= 60) return {
      label: "Ready",
      message: "Good foundation, keep refining!",
      color: "from-blue-500 to-indigo-600",
      bgColor: "bg-blue-500",
      textColor: "text-blue-700",
      borderColor: "border-blue-500"
    }
    if (s >= 40) return {
      label: "Developing",
      message: "Making progress, more practice needed.",
      color: "from-yellow-500 to-orange-500",
      bgColor: "bg-yellow-500",
      textColor: "text-yellow-700",
      borderColor: "border-yellow-500"
    }
    return {
      label: "Not Ready",
      message: "Focus on building fundamentals.",
      color: "from-red-500 to-rose-600",
      bgColor: "bg-red-500",
      textColor: "text-red-700",
      borderColor: "border-red-500"
    }
  }

  const status = getStatus(score)

  // Circle parameters
  const size = 200
  const strokeWidth = 16
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <Card className="border-2 border-charcoal shadow-brutal overflow-hidden">
      <CardContent className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left: Circular Progress */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative inline-flex items-center justify-center">
              <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="currentColor"
                  strokeWidth={strokeWidth}
                  fill="none"
                  className="text-gray-200"
                />
                {/* Progress circle */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="url(#gradient)"
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" className={`text-${status.color.split('-')[1]}-500`} stopColor="currentColor" />
                    <stop offset="100%" className={`text-${status.color.split('-')[3]}-600`} stopColor="currentColor" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Target className="h-8 w-8 text-muted-foreground mb-2" />
                <div className="text-5xl font-bold">{Math.round(score)}</div>
                <div className="text-sm text-muted-foreground">/ 100</div>
              </div>
            </div>

            <Badge className={`${status.bgColor} text-white text-lg px-4 py-1`}>
              {status.label}
            </Badge>
          </div>

          {/* Right: Details */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Exam Readiness</h2>
              <p className="text-muted-foreground">
                {status.message}
              </p>
            </div>

            {/* Score Breakdown */}
            {breakdown && (
              <div className="space-y-3 pt-4 border-t-2 border-border">
                <h3 className="font-semibold text-sm text-muted-foreground">Score Breakdown</h3>

                <div className="space-y-2">
                  {/* Mastery Average */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Average Mastery</span>
                    </div>
                    <span className="font-medium">{Math.round(breakdown.mastery_avg)}%</span>
                  </div>

                  {/* Coverage */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Topic Coverage</span>
                    </div>
                    <span className="font-medium">{Math.round(breakdown.coverage_pct)}%</span>
                  </div>

                  {/* Consistency */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">Consistency</span>
                    </div>
                    <span className="font-medium">{Math.round(breakdown.consistency)}%</span>
                  </div>

                  {/* Time Efficiency */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Time Efficiency</span>
                    </div>
                    <span className="font-medium">{Math.round(breakdown.time_efficiency)}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Tip:</strong> Focus on your weak skills and error patterns below to improve your readiness score.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
