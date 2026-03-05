"use client"

/**
 * ActivePlanView Component (T-060)
 * Main plan dashboard when user has an active plan cycle
 */

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ReadinessRing } from "@/components/analytics/ReadinessRing"
import { ProgressHeader } from "@/components/plan/ProgressHeader"
import { TaskCard } from "@/components/plan/TaskCard"
import { useTranslation } from "@/lib/i18n"
import {
  CheckCircle2,
  Lock,
  BookOpen,
  AlertCircle,
  RefreshCw,
  Calendar,
} from "lucide-react"
import type { PlanTask } from "@/lib/hooks/usePlanData"

interface ActivePlanViewProps {
  currentCycle: any
  tasks: PlanTask[]
  userState: any
  readinessScore: number
  examDate: string | null
}

export function ActivePlanView({
  currentCycle,
  tasks,
  userState,
  readinessScore,
  examDate,
}: ActivePlanViewProps) {
  const router = useRouter()
  const { t } = useTranslation("plan")
  const { t: tc } = useTranslation("common")

  const stats = useMemo(() => {
    const completedTasks = tasks.filter((task) => task.is_completed).length
    const requiredTasks = tasks.filter((task) => task.is_required)
    const requiredTaskCount = requiredTasks.length
    const completedRequired = requiredTasks.filter(
      (task) => task.is_completed,
    ).length
    const canUnlockRecycle = completedRequired >= requiredTaskCount
    const requiredProgressPct =
      requiredTaskCount > 0 ? (completedRequired / requiredTaskCount) * 100 : 0
    const allTasksProgressPct =
      tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0
    const isRecycleUnlocked = userState?.current_phase === "RECYCLE_UNLOCKED"

    return {
      completedTasks,
      requiredTaskCount,
      completedRequired,
      canUnlockRecycle,
      requiredProgressPct,
      allTasksProgressPct,
      isRecycleUnlocked,
    }
  }, [tasks, userState])

  // T-059: Exam countdown
  const daysUntilExam = useMemo(() => {
    if (!examDate) return null
    const exam = new Date(examDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    exam.setHours(0, 0, 0, 0)
    return Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }, [examDate])

  const cycleStartDate = new Date(currentCycle.start_date)
  const today = new Date()
  const daysSinceStart = Math.floor(
    (today.getTime() - cycleStartDate.getTime()) / (1000 * 60 * 60 * 24),
  )
  const currentDay = Math.min(
    daysSinceStart + 1,
    currentCycle.target_days_remaining,
  )

  return (
    <div className="min-h-screen bg-surface-plan/10 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("cycleInfo", {
              cycle: currentCycle.cycle_number,
              completed: stats.completedTasks,
              total: tasks.length,
            })}
          </p>
        </div>

        {/* T-059: Exam countdown */}
        {daysUntilExam !== null && (
          <Card
            className={`border-2 ${daysUntilExam < 7 ? "border-destructive bg-destructive/5" : daysUntilExam < 14 ? "border-orange-400 bg-orange-50" : "border-primary bg-surface-plan/30"}`}
          >
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-6 w-6" />
                  <div>
                    <p className="font-bold text-lg">
                      {daysUntilExam}{" "}
                      {t("examCountdown.daysUntilExam", {
                        fallback: "days until exam",
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(examDate!).toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                {daysUntilExam < 7 && (
                  <Badge variant="destructive">
                    {t("examCountdown.urgent", { fallback: "Urgent" })}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Header */}
        <ProgressHeader
          daysUntilExam={currentCycle.target_days_remaining - currentDay}
        />

        {/* Readiness & Progress */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("active.currentReadiness")}</CardTitle>
              <CardDescription>
                {t("active.currentReadinessDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ReadinessRing
                score={readinessScore}
                size="md"
                showDelta={false}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("active.taskProgress")}</CardTitle>
              <CardDescription>
                {t("active.completeToUnlockRule")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>{t("active.requiredTasks")}</span>
                  <span className="font-semibold">
                    {stats.completedRequired}/{stats.requiredTaskCount}
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden border-2 border-border">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${stats.requiredProgressPct}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>{t("active.allTasks")}</span>
                  <span className="font-semibold">
                    {stats.completedTasks}/{tasks.length}
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden border-2 border-border">
                  <div
                    className="h-full bg-secondary transition-all"
                    style={{ width: `${stats.allTasksProgressPct}%` }}
                  />
                </div>
              </div>

              <div
                className={`rounded-lg border p-3 text-sm ${
                  stats.canUnlockRecycle
                    ? "border-green-200 bg-green-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={
                      stats.canUnlockRecycle
                        ? "text-green-800"
                        : "text-amber-900"
                    }
                  >
                    {t("active.nextAssessmentStatus")}
                  </span>
                  <Badge
                    variant={stats.canUnlockRecycle ? "strong" : "secondary"}
                  >
                    {stats.canUnlockRecycle
                      ? tc("status.ready")
                      : tc("status.locked")}
                  </Badge>
                </div>
                <p
                  className={`mt-2 text-xs ${stats.canUnlockRecycle ? "text-green-700" : "text-amber-800"}`}
                >
                  {stats.canUnlockRecycle
                    ? t("active.recycleReadyMessage")
                    : t("active.completeToUnlockRule")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{t("active.yourTasks")}</h2>
            <Button
              variant="brutal-outline"
              size="sm"
              className="min-h-[44px]"
              onClick={() => router.push("/drill")}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              {t("active.browseAllPractice")}
            </Button>
          </div>

          {/* Timeline Start: Assessment 1 */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700 touch-target">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-900">Assessment 1</p>
                    <p className="text-sm text-green-700">
                      {tc("status.complete")}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="border-green-300 text-green-700"
                >
                  {tc("status.complete")}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {tasks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">{t("active.noTasks")}</p>
                <p className="text-muted-foreground">
                  {t("active.noTasksDesc")}
                </p>
              </CardContent>
            </Card>
          ) : (
            tasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}

          {/* Timeline End: Assessment 2 */}
          <Card
            className={
              stats.canUnlockRecycle
                ? "border-primary bg-primary/5"
                : "opacity-90 border-amber-200 bg-amber-50"
            }
          >
            <CardContent className="py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full touch-target ${
                      stats.canUnlockRecycle
                        ? "bg-primary/15 text-primary"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {stats.canUnlockRecycle ? (
                      <RefreshCw className="h-5 w-5" />
                    ) : (
                      <Lock className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">Assessment 2</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.canUnlockRecycle
                        ? t("active.recycleReadyMessage")
                        : t("active.completeToUnlockRule")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="min-h-[44px]"
                    disabled={
                      !stats.canUnlockRecycle && !stats.isRecycleUnlocked
                    }
                    onClick={() => router.push("/recycle")}
                  >
                    {t("active.startRecycle")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
