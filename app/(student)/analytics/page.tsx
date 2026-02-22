"use client"

/**
 * Analytics Dashboard
 * Phase 3: Analytics Dashboard
 *
 * Full analytics with readiness score, construct profile, skill breakdown
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ReadinessRing } from "@/components/analytics/ReadinessRing"
import { RadarChartFull } from "@/components/analytics/RadarChartFull"
import { ConstructBars } from "@/components/analytics/ConstructBars"
import { useToast } from "@/hooks/use-toast"
import { calculateReadinessFromSkillStates, getReadinessGradeLabel } from "@/lib/analytics/readiness-score"
import { getUserFriendlyError } from "@/lib/utils/error-messages"
import { identifyWeakConstructs, type ConstructProfile } from "@/lib/analytics/construct-scoring"

export default function AnalyticsPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [user, setUser] = useState<any>(null)
  const [userState, setUserState] = useState<any>(null)
  const [readiness, setReadiness] = useState<any>(null)
  const [constructProfile, setConstructProfile] = useState<ConstructProfile | null>(null)
  const [skillStates, setSkillStates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (!currentUser) {
        router.push('/login')
        return
      }

      setUser(currentUser)

      // Fetch user state
      const { data: state } = await supabase
        .from('user_state')
        .select('*')
        .eq('user_id', currentUser.id)
        .single()

      setUserState(state)

      // Fetch skill states
      const { data: skills } = await supabase
        .from('user_skill_state')
        .select('*')
        .eq('user_id', currentUser.id)

      setSkillStates(skills || [])

      // Fetch construct states
      const { data: constructs } = await supabase
        .from('user_construct_state')
        .select('*')
        .eq('user_id', currentUser.id)

      // Build construct profile
      const profile: any = {}
      ;['teliti', 'speed', 'reasoning', 'computation', 'reading'].forEach(construct => {
        const state = constructs?.find(c => c.construct_name === construct)
        profile[construct] = state || {
          construct_name: construct,
          score: 50,
          confidence: 0,
          trend: 'stable',
          data_points: 0,
        }
      })

      setConstructProfile(profile)

      // Calculate readiness
      const totalSkills = 36 // TODO: Get from taxonomy
      const readinessResult = await calculateReadinessFromSkillStates(skills || [], totalSkills)
      setReadiness(readinessResult)

      setIsLoading(false)
    }

    fetchData()
  }, [router])

  const handleGeneratePlan = async () => {
    if (!user) return

    setIsGeneratingPlan(true)

    try {
      const supabase = createClient()

      // Call generate_plan Edge Function
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        throw new Error('Failed to generate plan')
      }

      toast({
        title: "Plan Generated! 🎯",
        description: "Your personalized study plan is ready",
      })

      router.push('/plan')
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getUserFriendlyError(error, "Failed to generate plan. Please try again."),
      })
    } finally {
      setIsGeneratingPlan(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading analytics...</p>
      </div>
    )
  }

  const weakConstructs = constructProfile ? identifyWeakConstructs(constructProfile) : []
  const weakSkills = skillStates.filter(s => s.mastery_level === 'weak')
  const canGeneratePlan = userState?.current_phase === 'BASELINE_COMPLETE'

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Your Analytics</h1>
          <p className="text-muted-foreground">
            Deep insights into your performance and readiness
          </p>
        </div>

        {/* Readiness Score */}
        {readiness && (
          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
            <CardHeader>
              <CardTitle>Overall Readiness</CardTitle>
              <CardDescription>
                Combined score across all performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <ReadinessRing score={readiness.score} size="lg" showDelta={false} />

                <div className="flex-1 space-y-4">
                  <div>
                    <Badge variant={
                      readiness.grade === 'excellent' ? 'strong' :
                      readiness.grade === 'good' ? 'developing' :
                      readiness.grade === 'fair' ? 'outline' :
                      'destructive'
                    } className="text-base px-4 py-1">
                      {getReadinessGradeLabel(readiness.grade)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Accuracy</div>
                      <div className="text-2xl font-bold">{Math.round(readiness.breakdown.accuracy)}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Speed Index</div>
                      <div className="text-2xl font-bold">{Math.round(readiness.breakdown.speed_index)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Stability</div>
                      <div className="text-2xl font-bold">{Math.round(readiness.breakdown.stability)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Coverage</div>
                      <div className="text-2xl font-bold">{Math.round(readiness.breakdown.coverage)}%</div>
                    </div>
                  </div>

                  {readiness.recommendations.length > 0 && (
                    <div className="bg-background p-4 rounded-lg border-2 border-border">
                      <h4 className="font-semibold mb-2">Recommendations:</h4>
                      <ul className="space-y-1 text-sm">
                        {readiness.recommendations.map((rec: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Construct Radar Chart */}
          {constructProfile && (
            <Card>
              <CardHeader>
                <CardTitle>Construct Profile</CardTitle>
                <CardDescription>
                  Five-dimensional skill assessment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadarChartFull profile={constructProfile} />
              </CardContent>
            </Card>
          )}

          {/* Construct Bars */}
          {constructProfile && (
            <Card>
              <CardHeader>
                <CardTitle>Detailed Breakdown</CardTitle>
                <CardDescription>
                  Individual construct scores and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConstructBars profile={constructProfile} showDetails={true} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Weak Areas */}
        {(weakConstructs.length > 0 || weakSkills.length > 0) && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Areas Needing Attention</CardTitle>
              <CardDescription>
                Focus on these areas to improve your readiness
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {weakConstructs.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Weak Constructs:</h4>
                  <div className="flex flex-wrap gap-2">
                    {weakConstructs.map((construct) => (
                      <Badge key={construct} variant="weak">
                        {construct.charAt(0).toUpperCase() + construct.slice(1)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {weakSkills.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Weak Micro-Skills:</h4>
                  <p className="text-sm text-muted-foreground">
                    {weakSkills.length} skill{weakSkills.length !== 1 ? 's' : ''} need improvement
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Generate Plan CTA */}
        {canGeneratePlan && (
          <Card className="border-primary border-4">
            <CardHeader>
              <CardTitle className="text-primary">Ready to Start Your Plan?</CardTitle>
              <CardDescription>
                Generate a personalized study plan based on your analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleGeneratePlan}
                disabled={isGeneratingPlan}
                className="w-full"
                size="lg"
              >
                {isGeneratingPlan ? 'Generating...' : 'Generate My Study Plan'}
              </Button>
            </CardContent>
          </Card>
        )}

        {!canGeneratePlan && (
          <Card>
            <CardContent className="text-center py-6">
              <p className="text-muted-foreground">
                Complete all baseline modules to generate your study plan
              </p>
              <Button
                onClick={() => router.push('/baseline')}
                variant="brutal-outline"
                className="mt-4"
              >
                Continue Baseline Assessment
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
