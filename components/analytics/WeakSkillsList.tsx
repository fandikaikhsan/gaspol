"use client"

/**
 * Weak Skills List Component
 * Display top weakest skills with practice actions
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Target, TrendingDown, Zap } from "lucide-react"
import { useRouter } from "next/navigation"

interface WeakSkill {
  node_id: string
  name: string
  code: string
  level: number
  mastery: number
  attempt_count: number
}

interface WeakSkillsListProps {
  weakSkills: WeakSkill[]
}

export function WeakSkillsList({ weakSkills }: WeakSkillsListProps) {
  const router = useRouter()

  const handlePracticeSkill = (skill: WeakSkill) => {
    // Navigate to practice page with this skill targeted
    // For now, navigate to locked-in mode (could be enhanced to target specific skill)
    router.push(`/locked-in?focus=${skill.node_id}`)
  }

  // Get mastery status
  const getMasteryStatus = (mastery: number) => {
    const pct = Math.round(mastery * 100)
    if (pct < 30) return {
      label: "Critical",
      color: "bg-red-500",
      textColor: "text-red-700",
      bgColor: "bg-red-50",
      borderColor: "border-red-200"
    }
    if (pct < 50) return {
      label: "Weak",
      color: "bg-orange-500",
      textColor: "text-orange-700",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200"
    }
    return {
      label: "Developing",
      color: "bg-yellow-500",
      textColor: "text-yellow-700",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200"
    }
  }

  // Get priority icon based on mastery
  const getPriorityIcon = (mastery: number) => {
    const pct = Math.round(mastery * 100)
    if (pct < 30) return <AlertTriangle className="h-5 w-5 text-red-500" />
    if (pct < 50) return <TrendingDown className="h-5 w-5 text-orange-500" />
    return <Target className="h-5 w-5 text-yellow-500" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Skills Needing Focus
        </CardTitle>
        <CardDescription>
          Your weakest areas based on recent performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        {weakSkills && weakSkills.length > 0 ? (
          <div className="space-y-3">
            {weakSkills.map((skill, index) => {
              const status = getMasteryStatus(skill.mastery)
              const masteryPct = Math.round(skill.mastery * 100)

              return (
                <div
                  key={skill.node_id}
                  className={`p-4 border-2 rounded-lg ${status.bgColor} ${status.borderColor}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-2">
                        {getPriorityIcon(skill.mastery)}
                        <Badge variant="outline" className="text-xs">
                          #{index + 1} Priority
                        </Badge>
                        <Badge className={`${status.color} text-white text-xs`}>
                          {status.label}
                        </Badge>
                      </div>

                      {/* Skill Name */}
                      <h4 className="font-semibold mb-1">{skill.name}</h4>

                      {/* Metadata */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        <span className="font-mono">{skill.code}</span>
                        <span>•</span>
                        <span>Level {skill.level}</span>
                        <span>•</span>
                        <span>{skill.attempt_count} attempts</span>
                      </div>

                      {/* Mastery Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className={status.textColor}>Current Mastery</span>
                          <span className="font-bold">{masteryPct}%</span>
                        </div>
                        <div className="h-2 bg-white border-2 border-charcoal rounded-full overflow-hidden">
                          <div
                            className={`h-full ${status.color} transition-all duration-500`}
                            style={{ width: `${masteryPct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Goal: 70%+</span>
                          <span className={masteryPct >= 70 ? "text-green-600 font-semibold" : ""}>
                            {masteryPct >= 70 ? "✓ Achieved" : `${70 - masteryPct}% to go`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      size="sm"
                      className="shrink-0"
                      onClick={() => handlePracticeSkill(skill)}
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      Practice Now
                    </Button>
                  </div>
                </div>
              )
            })}

            {/* Recommendations */}
            <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Recommendations</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Focus on your top 2-3 weak skills first for maximum impact</li>
                <li>• Aim for 70%+ mastery before moving to the next skill</li>
                <li>• Practice in short, focused sessions (15-20 minutes)</li>
                <li>• Review explanations carefully when you get questions wrong</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto text-green-500 mb-2" />
            <p className="font-medium text-green-700 mb-1">Great job!</p>
            <p className="text-sm text-muted-foreground">
              No significant weak areas detected. Keep up the practice!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
