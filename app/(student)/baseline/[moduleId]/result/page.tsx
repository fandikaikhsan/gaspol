"use client"

/**
 * Baseline Results Screen
 * Phase 2: Question Runner & Assessment Engine
 *
 * Shows module completion results with partial analytics
 */

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface ModuleCompletion {
  score: number
  total_questions: number
  correct_count: number
  total_time_sec: number
  readiness_score: number
  construct_profile: {
    teliti_score: number
    speed_score: number
    reasoning_score: number
    computation_score: number
    reading_score: number
  }
}

export default function BaselineResultPage() {
  const router = useRouter()
  const params = useParams()
  const moduleId = params.moduleId as string

  const [completion, setCompletion] = useState<ModuleCompletion | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [allComplete, setAllComplete] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Fetch completion record
      const { data, error } = await supabase
        .from('module_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('module_id', moduleId)
        .eq('context_type', 'baseline')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) {
        router.push('/baseline')
        return
      }

      setCompletion(data as ModuleCompletion)

      // Check if all baseline complete
      const { data: userState } = await supabase
        .from('user_state')
        .select('current_phase')
        .eq('user_id', user.id)
        .single()

      setAllComplete(userState?.current_phase === 'BASELINE_COMPLETE')
      setIsLoading(false)
    }

    fetchData()
  }, [moduleId, router])

  if (isLoading || !completion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading results...</p>
      </div>
    )
  }

  const accuracy = Math.round(completion.score)
  const avgTimePerQuestion = Math.round(completion.total_time_sec / completion.total_questions)
  const constructs = completion.construct_profile

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-status-strong'
    if (score >= 50) return 'text-status-developing'
    return 'text-destructive'
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary text-primary-foreground border-4 border-border shadow-brutal-lg">
            <span className="text-3xl font-bold">✓</span>
          </div>

          <div>
            <h1 className="text-4xl font-bold mb-2">Module Complete!</h1>
            <p className="text-muted-foreground">
              Great work! Here's how you performed
            </p>
          </div>
        </div>

        {/* Score Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
          <CardHeader>
            <CardTitle>Your Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-6xl font-bold ${getScoreColor(accuracy)}`}>
                  {accuracy}%
                </div>
                <p className="text-muted-foreground mt-2">
                  {completion.correct_count} out of {completion.total_questions} correct
                </p>
              </div>

              <div className="text-right space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Time/Question</p>
                  <p className="text-2xl font-bold">{avgTimePerQuestion}s</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Partial Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Snapshot</CardTitle>
            <CardDescription>
              Based on this module - full analytics after all modules complete
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Readiness Score */}
            {completion.readiness_score && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Readiness Score</span>
                  <span className={`text-2xl font-bold ${getScoreColor(completion.readiness_score)}`}>
                    {Math.round(completion.readiness_score)}%
                  </span>
                </div>
                <Progress
                  value={completion.readiness_score}
                  className="h-3"
                />
              </div>
            )}

            {/* Construct Profile */}
            {constructs && (
              <div className="space-y-3">
                <h3 className="font-semibold">Skill Profile</h3>

                {[
                  { name: 'Teliti (Careful)', key: 'teliti_score', color: 'bg-construct-teliti' },
                  { name: 'Speed', key: 'speed_score', color: 'bg-construct-speed' },
                  { name: 'Reasoning', key: 'reasoning_score', color: 'bg-construct-reasoning' },
                  { name: 'Computation', key: 'computation_score', color: 'bg-construct-computation' },
                  { name: 'Reading', key: 'reading_score', color: 'bg-construct-reading' },
                ].map(({ name, key, color }) => {
                  const score = constructs[key as keyof typeof constructs] || 50
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{name}</span>
                        <span className="font-semibold">{Math.round(score)}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden border-2 border-border">
                        <div
                          className={`h-full ${color} transition-all`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Complete CTA */}
        {allComplete && (
          <Card className="border-status-strong border-4">
            <CardHeader>
              <CardTitle className="text-status-strong">
                🎉 Baseline Assessment Complete!
              </CardTitle>
              <CardDescription>
                All modules finished. Ready to generate your personalized study plan?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/analytics">
                <Button className="w-full" size="lg">
                  View Full Analytics & Generate Plan
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex gap-4">
          <Link href="/baseline" className="flex-1">
            <Button variant="brutal-outline" className="w-full">
              Back to Baseline Hub
            </Button>
          </Link>

          {!allComplete && (
            <Link href="/baseline" className="flex-1">
              <Button className="w-full">
                Continue to Next Module
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
