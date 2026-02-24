"use client"

/**
 * Student Analytics Dashboard
 * Display readiness score, constructs, coverage, and insights
 */

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, TrendingUp, Target, Brain, AlertCircle, RefreshCw } from "lucide-react"
import { SkeletonCard, SkeletonRing, SkeletonBar } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { ReadinessScore } from "@/components/analytics/ReadinessScore"
import { ConstructRadarChart } from "@/components/analytics/ConstructRadarChart"
import { CoverageMap } from "@/components/analytics/CoverageMap"
import { WeakSkillsList } from "@/components/analytics/WeakSkillsList"
import { ErrorPatternAnalysis } from "@/components/analytics/ErrorPatternAnalysis"

interface AnalyticsSnapshot {
  id: string
  scope: string
  coverage: Record<string, number>
  readiness: number
  radar: Record<string, number>
  constructs: Record<string, number>
  top_weak_skills: Array<{
    node_id: string
    name: string
    code: string
    level: number
    mastery: number
    attempt_count: number
  }>
  top_error_tags: Array<{
    tag_id: string
    name: string
    count: number
    percentage: number
  }>
  created_at: string
}

interface ExamConfig {
  exam_id: string
  exam_type: string
  exam_name: string
  construct_count: number
  error_tag_count: number
}

// Compute breakdown from snapshot data (avoids NaN)
function computeBreakdown(snapshot: AnalyticsSnapshot) {
  const coverageValues = Object.values(snapshot.coverage || {})
  const coverageCount = coverageValues.length

  // Calculate coverage percentage (avoid division by zero)
  const coveragePct = coverageCount > 0
    ? (coverageValues.reduce((a, b) => a + (b as number), 0) / coverageCount) * 100
    : 0

  // Calculate average mastery from weak skills (if available)
  const weakSkills = snapshot.top_weak_skills || []
  const masteryAvg = weakSkills.length > 0
    ? (1 - (weakSkills.reduce((sum, s) => sum + s.mastery, 0) / weakSkills.length)) * 100
    : snapshot.readiness || 50

  // Construct average as proxy for consistency
  const constructValues = Object.values(snapshot.constructs || {})
  const constructAvg = constructValues.length > 0
    ? constructValues.reduce((a, b) => a + (b as number), 0) / constructValues.length
    : 50

  return {
    mastery_avg: Math.round(masteryAvg),
    coverage_pct: Math.round(coveragePct),
    consistency: Math.round(constructAvg),
    time_efficiency: Math.round(snapshot.readiness || 50) // Use readiness as proxy
  }
}

export default function AnalyticsPage() {
  const { toast } = useToast()
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null)
  const [examConfig, setExamConfig] = useState<ExamConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadSnapshot()
  }, [])

  const loadSnapshot = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error("Not authenticated")
      }

      // Fetch snapshot and exam config in parallel
      const [snapshotResult, examConfigResult] = await Promise.all([
        supabase.rpc("get_latest_snapshot", {
          p_user_id: user.id,
          p_scope: null // Get most recent of any type
        }),
        supabase.rpc("get_user_exam_config", {
          p_user_id: user.id
        })
      ])

      if (snapshotResult.error) throw snapshotResult.error

      if (snapshotResult.data && snapshotResult.data.length > 0) {
        setSnapshot(snapshotResult.data[0])
      } else {
        setSnapshot(null)
      }

      // Set exam config (for passing to components)
      if (examConfigResult.data && examConfigResult.data.length > 0) {
        setExamConfig(examConfigResult.data[0])
      }
    } catch (error) {
      console.error("Load snapshot error:", error)
      toast({
        variant: "destructive",
        title: "Failed to Load Analytics",
        description: error instanceof Error ? error.message : "Please try again"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateSnapshot = async () => {
    setIsRefreshing(true)
    try {
      const supabase = createClient()
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token

      const response = await fetch('/api/generate-snapshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ scope: 'checkpoint' }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to generate snapshot')

      if (data.success) {
        toast({
          title: "Analytics Updated!",
          description: "Your latest performance has been analyzed."
        })
        loadSnapshot()
      }
    } catch (error) {
      console.error("Generate snapshot error:", error)
      toast({
        variant: "destructive",
        title: "Failed to Update Analytics",
        description: error instanceof Error ? error.message : "Please try again"
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <SkeletonBar className="h-8 w-48" />
            <SkeletonBar className="h-4 w-32" />
          </div>
          <SkeletonBar className="h-10 w-36" />
        </div>
        <SkeletonRing className="py-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard />
      </div>
    )
  }

  // No snapshot available
  if (!snapshot) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <AlertCircle className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-2xl font-bold">No Analytics Available Yet</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Start practicing questions to build your analytics. Your performance data will be
            analyzed automatically as you complete practice sessions.
          </p>
          <Button onClick={generateSnapshot} disabled={isRefreshing}>
            {isRefreshing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Analytics Now"
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Analytics</h1>
          <p className="text-muted-foreground">
            {examConfig && (
              <span className="mr-2">
                <Badge variant="outline">{examConfig.exam_type}</Badge>
              </span>
            )}
            Last updated: {new Date(snapshot.created_at).toLocaleDateString()}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={generateSnapshot}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Analytics
            </>
          )}
        </Button>
      </div>

      {/* Readiness Score - Big Hero Section */}
      <ReadinessScore
        score={snapshot.readiness || 50}
        breakdown={computeBreakdown(snapshot)}
      />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cognitive Constructs */}
        <ConstructRadarChart
          constructs={snapshot.constructs as any}
          examId={examConfig?.exam_id}
        />

        {/* Coverage Map */}
        <CoverageMap coverage={snapshot.coverage} />
      </div>

      {/* Weak Skills */}
      <WeakSkillsList weakSkills={snapshot.top_weak_skills || []} />

      {/* Error Patterns */}
      <ErrorPatternAnalysis
        errorTags={snapshot.top_error_tags || []}
        examId={examConfig?.exam_id}
      />
    </div>
  )
}
