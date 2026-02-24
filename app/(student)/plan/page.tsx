"use client"

/**
 * Plan Dashboard
 * Phase 4: Plan Generation & Task System
 *
 * Shows:
 * 1. Baseline assessment status (1st assessment)
 * 2. Current study plan with tasks
 * 3. Locked 2nd assessment (re-cycle) until tasks complete
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ReadinessRing } from "@/components/analytics/ReadinessRing"
import { ProgressHeader } from "@/components/plan/ProgressHeader"
import { TaskCard } from "@/components/plan/TaskCard"
import { GatedCTAButton } from "@/components/plan/GatedCTAButton"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n"
import {
  CheckCircle2,
  Circle,
  Lock,
  Target,
  BookOpen,
  AlertCircle,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Loader2
} from "lucide-react"
import { SkeletonCard, SkeletonRing, SkeletonBar } from "@/components/ui/skeleton"

interface BaselineModule {
  id: string
  title: string
  is_completed: boolean
  score?: number
}

interface PlanTask {
  id: string
  task_type: string
  task_order: number
  is_required: boolean
  title: string
  subtitle: string
  estimated_duration_min: number
  is_completed: boolean
  completion_score?: number
  module_id?: string
  target_node_id?: string
}

export default function PlanDashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation('plan')
  const { t: tc } = useTranslation('common')

  const [user, setUser] = useState<any>(null)
  const [userState, setUserState] = useState<any>(null)
  const [currentCycle, setCurrentCycle] = useState<any>(null)
  const [tasks, setTasks] = useState<PlanTask[]>([])
  const [baselineModules, setBaselineModules] = useState<BaselineModule[]>([])
  const [readinessScore, setReadinessScore] = useState(0)
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

      // Fetch baseline modules and their completion status
      const { data: baselineData } = await supabase
        .from('baseline_modules')
        .select('id, title, module_id')
        .eq('is_active', true)
        .order('checkpoint_order')

      const modulesWithStatus = await Promise.all(
        (baselineData || []).map(async (module) => {
          const { data: completion } = await supabase
            .from('module_completions')
            .select('score')
            .eq('user_id', currentUser.id)
            .eq('module_id', module.module_id)
            .eq('context_type', 'baseline')
            .single()

          return {
            id: module.id,
            title: module.title,
            is_completed: !!completion,
            score: completion?.score,
          }
        })
      )

      setBaselineModules(modulesWithStatus)

      // Fetch current cycle if exists
      if (state?.current_cycle_id) {
        const { data: cycle } = await supabase
          .from('plan_cycles')
          .select('*')
          .eq('id', state.current_cycle_id)
          .single()

        setCurrentCycle(cycle)

        // Fetch tasks
        const { data: cycleTasks } = await supabase
          .from('plan_tasks')
          .select('*')
          .eq('cycle_id', cycle?.id)
          .order('task_order')

        setTasks(cycleTasks || [])
      }

      // Fetch latest readiness
      const { data: snapshot } = await supabase
        .from('analytics_snapshots')
        .select('readiness_score')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      setReadinessScore(snapshot?.readiness_score || 0)
      setIsLoading(false)
    }

    fetchData()
  }, [router])

  const generatePlan = async () => {
    if (!user) return

    setIsGeneratingPlan(true)

    try {
      const supabase = createClient()
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: t('toast.planGenerated'),
          description: t('toast.planGeneratedDesc'),
        })
        // Refresh the page data
        window.location.reload()
      } else {
        throw new Error(result.error || 'Failed to generate plan')
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('toast.error'),
        description: error.message || "Failed to generate plan",
      })
    } finally {
      setIsGeneratingPlan(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <SkeletonBar className="h-10 w-64 mx-auto" />
            <SkeletonBar className="h-4 w-48 mx-auto" />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <SkeletonRing className="py-8" />
            <SkeletonCard />
          </div>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  // Check baseline completion
  const baselineCompleted = baselineModules.length > 0 &&
    baselineModules.every(m => m.is_completed)
  const baselineProgress = baselineModules.length > 0
    ? (baselineModules.filter(m => m.is_completed).length / baselineModules.length) * 100
    : 0

  // If no baseline completed, show baseline prompt
  if (!baselineCompleted) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground">
              {t('baselineIncomplete.subtitle')}
            </p>
          </div>

          {/* Step 1: Baseline Assessment */}
          <Card className="border-2 border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                    1
                  </div>
                  <div>
                    <CardTitle>{t('baselineIncomplete.completeBaseline')}</CardTitle>
                    <CardDescription>
                      {t('baselineIncomplete.baselineDesc')}
                    </CardDescription>
                  </div>
                </div>
                {baselineProgress > 0 && (
                  <Badge variant="secondary">
                    {t('baselineIncomplete.progressPercent', { percent: Math.round(baselineProgress) })}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>{t('baselineIncomplete.progress')}</span>
                  <span className="font-medium">
                    {t('baselineIncomplete.modulesCount', { completed: baselineModules.filter(m => m.is_completed).length, total: baselineModules.length })}
                  </span>
                </div>
                <Progress value={baselineProgress} className="h-3" />
              </div>

              {/* Module List */}
              <div className="space-y-2">
                {baselineModules.map((module, idx) => (
                  <div
                    key={module.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {module.is_completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className={module.is_completed ? 'text-muted-foreground' : ''}>
                        {module.title}
                      </span>
                    </div>
                    {module.is_completed && module.score && (
                      <Badge variant="outline">{module.score.toFixed(0)}%</Badge>
                    )}
                  </div>
                ))}
              </div>

              <Button
                className="w-full"
                onClick={() => router.push('/baseline')}
              >
                {baselineProgress > 0 ? t('baselineIncomplete.continueAssessment') : t('baselineIncomplete.startAssessment')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Locked Steps */}
          <Card className="opacity-60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-muted-foreground font-bold">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-muted-foreground">{t('baselineIncomplete.completeTasks')}</CardTitle>
                  <CardDescription>
                    {t('baselineIncomplete.completeTasksDesc')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="opacity-60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-muted-foreground font-bold">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-muted-foreground">{t('baselineIncomplete.recycleAssessment')}</CardTitle>
                  <CardDescription>
                    {t('baselineIncomplete.recycleAssessmentDesc')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  // Baseline complete but no plan yet
  if (!currentCycle) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground">
              {t('baselineComplete.subtitle')}
            </p>
          </div>

          {/* Completed Baseline */}
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div>
                  <CardTitle className="text-green-800">{t('baselineComplete.assessmentComplete')}</CardTitle>
                  <CardDescription className="text-green-700">
                    {t('baselineComplete.avgScore', { score: (baselineModules.reduce((acc, m) => acc + (m.score || 0), 0) / baselineModules.length).toFixed(0) })}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Generate Plan CTA */}
          <Card className="border-2 border-primary">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>{t('baselineComplete.generatePlan')}</CardTitle>
                  <CardDescription>
                    {t('baselineComplete.generatePlanDesc')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={generatePlan}
                disabled={isGeneratingPlan}
              >
                {isGeneratingPlan ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('baselineComplete.generating')}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {t('baselineComplete.generateButton')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Locked Steps */}
          <Card className="opacity-60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-muted-foreground font-bold">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-muted-foreground">{t('baselineComplete.recycleAssessment')}</CardTitle>
                  <CardDescription>
                    {t('baselineComplete.recycleLockedDesc')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  // Has active plan
  const completedTasks = tasks.filter(t => t.is_completed).length
  const requiredTasks = tasks.filter(t => t.is_required)
  const completedRequired = requiredTasks.filter(t => t.is_completed).length
  const canUnlockRecycle = completedRequired >= currentCycle.required_task_count
  const isRecycleUnlocked = userState?.current_phase === 'RECYCLE_UNLOCKED'

  const cycleStartDate = new Date(currentCycle.start_date)
  const today = new Date()
  const daysSinceStart = Math.floor((today.getTime() - cycleStartDate.getTime()) / (1000 * 60 * 60 * 24))
  const currentDay = Math.min(daysSinceStart + 1, currentCycle.target_days_remaining)

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('cycleInfo', { cycle: currentCycle.cycle_number, completed: completedTasks, total: tasks.length })}
          </p>
        </div>

        {/* Progress Header */}
        <ProgressHeader
          currentDay={currentDay}
          totalDays={currentCycle.target_days_remaining}
          daysUntilExam={currentCycle.target_days_remaining - currentDay}
        />

        {/* Status Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Baseline Status */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">{t('active.firstAssessment')}</p>
                  <p className="text-sm text-green-600">{tc('status.complete')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasks Status */}
          <Card className={canUnlockRecycle ? 'bg-green-50 border-green-200' : 'border-primary'}>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                {canUnlockRecycle ? (
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                ) : (
                  <Target className="h-8 w-8 text-primary" />
                )}
                <div>
                  <p className="font-semibold">{t('active.studyTasks')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('active.requiredCount', { completed: completedRequired, required: currentCycle.required_task_count })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recycle Status */}
          <Card className={canUnlockRecycle ? 'border-primary' : 'opacity-60'}>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                {canUnlockRecycle ? (
                  <RefreshCw className="h-8 w-8 text-primary" />
                ) : (
                  <Lock className="h-8 w-8 text-muted-foreground" />
                )}
                <div>
                  <p className="font-semibold">{t('active.secondAssessment')}</p>
                  <p className="text-sm text-muted-foreground">
                    {canUnlockRecycle ? tc('status.ready') : tc('status.locked')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Readiness & Progress */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('active.currentReadiness')}</CardTitle>
              <CardDescription>{t('active.currentReadinessDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ReadinessRing score={readinessScore} size="md" showDelta={false} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('active.taskProgress')}</CardTitle>
              <CardDescription>{t('active.taskProgressDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>{t('active.requiredTasks')}</span>
                  <span className="font-semibold">
                    {completedRequired}/{currentCycle.required_task_count}
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden border-2 border-border">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(completedRequired / currentCycle.required_task_count) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>{t('active.allTasks')}</span>
                  <span className="font-semibold">
                    {completedTasks}/{tasks.length}
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden border-2 border-border">
                  <div
                    className="h-full bg-secondary transition-all"
                    style={{ width: `${(completedTasks / tasks.length) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{t('active.yourTasks')}</h2>
            <Button
              variant="brutal-outline"
              size="sm"
              onClick={() => router.push('/locked-in')}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              {t('active.browseAllPractice')}
            </Button>
          </div>

          {tasks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">{t('active.noTasks')}</p>
                <p className="text-muted-foreground">
                  {t('active.noTasksDesc')}
                </p>
              </CardContent>
            </Card>
          ) : (
            tasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))
          )}
        </div>

        {/* Re-cycle CTA */}
        <GatedCTAButton
          isUnlocked={canUnlockRecycle || isRecycleUnlocked}
          unlockedText={t('active.startRecycle')}
          lockedReason={t('active.completeMoreRequired', { count: currentCycle.required_task_count - completedRequired })}
          onClick={() => router.push('/recycle')}
        />
      </div>
    </div>
  )
}
