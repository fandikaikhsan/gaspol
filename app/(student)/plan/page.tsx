"use client"

/**
 * Plan Dashboard
 * Phase 4: Plan Generation & Task System
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ReadinessRing } from "@/components/analytics/ReadinessRing"
import { ProgressHeader } from "@/components/plan/ProgressHeader"
import { TaskCard } from "@/components/plan/TaskCard"
import { GatedCTAButton } from "@/components/plan/GatedCTAButton"
import { useToast } from "@/hooks/use-toast"

export default function PlanDashboardPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [user, setUser] = useState<any>(null)
  const [userState, setUserState] = useState<any>(null)
  const [currentCycle, setCurrentCycle] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [readinessScore, setReadinessScore] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

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

      // Fetch current cycle
      const { data: cycle } = await supabase
        .from('plan_cycles')
        .select('*')
        .eq('id', state?.current_cycle_id)
        .single()

      setCurrentCycle(cycle)

      // Fetch tasks
      const { data: cycleTasks } = await supabase
        .from('plan_tasks')
        .select('*')
        .eq('cycle_id', cycle?.id)
        .order('task_order')

      setTasks(cycleTasks || [])

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading plan...</p>
      </div>
    )
  }

  if (!currentCycle) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">No Active Plan</h2>
              <p className="text-muted-foreground mb-6">
                Complete your baseline assessment to generate a study plan
              </p>
              <button
                onClick={() => router.push('/baseline')}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold"
              >
                Go to Baseline
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

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
          <h1 className="text-4xl font-bold">Your Study Plan</h1>
          <p className="text-muted-foreground">
            Cycle {currentCycle.cycle_number} • {completedTasks}/{tasks.length} tasks complete
          </p>
        </div>

        {/* Progress Header */}
        <ProgressHeader
          currentDay={currentDay}
          totalDays={currentCycle.target_days_remaining}
          daysUntilExam={currentCycle.target_days_remaining - currentDay}
        />

        {/* Readiness & Progress */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Readiness</CardTitle>
              <CardDescription>Your overall exam readiness score</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ReadinessRing score={readinessScore} size="md" showDelta={false} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Task Progress</CardTitle>
              <CardDescription>Complete required tasks to unlock re-cycle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Required Tasks</span>
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
                  <span>All Tasks</span>
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
          <h2 className="text-2xl font-bold">Your Tasks</h2>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>

        {/* Re-cycle CTA */}
        <GatedCTAButton
          isUnlocked={canUnlockRecycle || isRecycleUnlocked}
          unlockedText="🔄 Start Re-cycle Checkpoint"
          lockedReason="Complete Required Tasks First"
          onClick={() => router.push('/recycle')}
        />
      </div>
    </div>
  )
}
