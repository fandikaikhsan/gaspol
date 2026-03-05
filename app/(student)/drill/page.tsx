"use client"

/**
 * Drill Hub — T-045 full module listing, T-046 required task pinning, T-047 filter tabs
 * Surface color: surface-drill (peach)
 */

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Target,
  BookOpen,
  Clock,
  CheckCircle2,
  Pin,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { useTranslation } from "@/lib/i18n"

/* ── Types ─────────────────────────────────────────────── */

interface DrillModule {
  id: string
  title: string
  module_type: string
  question_count: number
  estimated_duration_min: number
  status: string
  topic_label?: string
  // Joined from plan context
  is_required?: boolean
  is_completed?: boolean
  plan_task_id?: string
}

type FilterTab = "all" | "required" | "completed"

/* ── Data hook ─────────────────────────────────────────── */

async function fetchDrillData() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // Parallel fetches: modules, plan tasks, readiness
  const [modulesRes, planTasksRes, snapshotRes] = await Promise.all([
    supabase
      .from("modules")
      .select(
        "id, title, module_type, question_count, estimated_duration_min, status",
      )
      .in("module_type", [
        "drill_focus",
        "drill_mixed",
        "mock",
        "flashcard",
        "review",
      ])
      .eq("status", "published")
      .order("title"),
    supabase
      .from("user_state")
      .select("current_cycle_id")
      .eq("user_id", user.id)
      .single()
      .then(async ({ data: state }) => {
        if (!state?.current_cycle_id) return []
        const { data } = await supabase
          .from("plan_tasks")
          .select("id, module_id, is_required, is_completed, title, task_type")
          .eq("cycle_id", state.current_cycle_id)
        return data || []
      }),
    supabase
      .from("analytics_snapshots")
      .select("readiness_score")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
  ])

  const modules: DrillModule[] = (modulesRes.data || []).map((m: any) => {
    const planTask = (planTasksRes as any[]).find(
      (t: any) => t.module_id === m.id,
    )
    return {
      ...m,
      is_required: planTask?.is_required ?? false,
      is_completed: planTask?.is_completed ?? false,
      plan_task_id: planTask?.id,
    }
  })

  // Also add plan tasks that don't have a module_id yet (generated tasks)
  const modulePlanTasks = (planTasksRes as any[]).filter(
    (t: any) => !modules.find((m) => m.id === t.module_id),
  )
  for (const pt of modulePlanTasks) {
    modules.push({
      id: pt.module_id || pt.id,
      title: pt.title,
      module_type: pt.task_type,
      question_count: 0,
      estimated_duration_min: 15,
      status: "published",
      is_required: pt.is_required,
      is_completed: pt.is_completed,
      plan_task_id: pt.id,
    })
  }

  return {
    modules,
    readinessScore: snapshotRes.data?.readiness_score || 0,
  }
}

/* ── Component ─────────────────────────────────────────── */

export default function DrillHubPage() {
  const router = useRouter()
  const { t } = useTranslation("drill")
  const { t: tc } = useTranslation("common")
  const [filter, setFilter] = useState<FilterTab>("all")

  const { data, isLoading } = useQuery({
    queryKey: ["drill-hub"],
    queryFn: fetchDrillData,
  })

  // T-046: Required tasks pinned at top + T-047: Filter tabs
  const filteredModules = useMemo(() => {
    if (!data) return []
    let list = data.modules

    if (filter === "required") list = list.filter((m) => m.is_required)
    else if (filter === "completed") list = list.filter((m) => m.is_completed)

    // Pin required incomplete at top
    return [...list].sort((a, b) => {
      const aPinned = a.is_required && !a.is_completed ? 0 : 1
      const bPinned = b.is_required && !b.is_completed ? 0 : 1
      if (aPinned !== bPinned) return aPinned - bPinned
      return a.title.localeCompare(b.title)
    })
  }, [data, filter])

  const requiredCount = data?.modules.filter((m) => m.is_required).length ?? 0
  const completedCount = data?.modules.filter((m) => m.is_completed).length ?? 0

  /* ── Loading skeleton ── */
  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-surface-drill/10 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="h-10 w-48 mx-auto rounded-lg bg-muted animate-skeleton-pulse" />
            <div className="h-4 w-64 mx-auto rounded bg-muted animate-skeleton-pulse" />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl border-2 border-border bg-muted/40 animate-skeleton-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  /* ── Type helpers ── */
  const typeIcon = (type: string) => {
    if (type.includes("focus")) return Target
    if (type.includes("mock")) return Clock
    if (type.includes("review")) return BookOpen
    return Target
  }

  const typeColor = (type: string) => {
    if (type.includes("focus")) return "bg-pastel-yellow"
    if (type.includes("mock")) return "bg-pastel-lavender"
    if (type.includes("review")) return "bg-pastel-peach"
    return "bg-pastel-mint"
  }

  return (
    <div className="min-h-screen bg-surface-drill/10 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
          {data.readinessScore > 0 && (
            <Badge variant="outline" className="text-lg px-4 py-1">
              {t("readiness", {
                score: data.readinessScore.toFixed(0),
                fallback: `Readiness: ${data.readinessScore.toFixed(0)}`,
              })}
            </Badge>
          )}
        </div>

        {/* T-047: Filter tabs */}
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as FilterTab)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="touch-target">
              {tc("filter.all", { fallback: "All" })} ({data.modules.length})
            </TabsTrigger>
            <TabsTrigger value="required" className="touch-target">
              {tc("filter.required", { fallback: "Required" })} ({requiredCount}
              )
            </TabsTrigger>
            <TabsTrigger value="completed" className="touch-target">
              {tc("filter.completed", { fallback: "Completed" })} (
              {completedCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Module listing */}
        {filteredModules.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">
                {filter === "required"
                  ? t("noRequired", { fallback: "No required tasks" })
                  : filter === "completed"
                    ? t("noCompleted", { fallback: "No completed modules yet" })
                    : t("noModules", { fallback: "No modules available" })}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredModules.map((module) => {
              const Icon = typeIcon(module.module_type)
              const bgColor = typeColor(module.module_type)

              return (
                <Card
                  key={module.id}
                  className={`border-2 border-border shadow-brutal hover:shadow-brutal-lg transition-all cursor-pointer hover:-translate-y-0.5 ${
                    module.is_required && !module.is_completed
                      ? "ring-2 ring-primary/40"
                      : ""
                  } ${module.is_completed ? "opacity-75" : ""}`}
                  onClick={() => {
                    if (module.plan_task_id) {
                      router.push(`/drill/drills/practice?module=${module.id}`)
                    } else {
                      router.push(`/drill/drills/practice?module=${module.id}`)
                    }
                  }}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div
                        className={`w-12 h-12 ${bgColor} rounded-xl border-2 border-border flex items-center justify-center shrink-0`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold truncate">
                            {module.title}
                          </h3>
                          {/* T-046: Required pin badge */}
                          {module.is_required && !module.is_completed && (
                            <Badge variant="default" className="shrink-0 gap-1">
                              <Pin className="h-3 w-3" />
                              {tc("status.required", {
                                fallback: "Required",
                              })}
                            </Badge>
                          )}
                          {module.is_completed && (
                            <Badge
                              variant="secondary"
                              className="shrink-0 gap-1"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              {tc("status.complete", {
                                fallback: "Done",
                              })}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="capitalize">
                            {module.module_type.replace("_", " ")}
                          </span>
                          {module.question_count > 0 && (
                            <>
                              <span>•</span>
                              <span>
                                {module.question_count}{" "}
                                {tc("unit.questions", {
                                  fallback: "questions",
                                })}
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span>
                            ~{module.estimated_duration_min}{" "}
                            {tc("unit.min", { fallback: "min" })}
                          </span>
                        </div>
                      </div>

                      {/* CTA */}
                      <Button
                        variant="brutal"
                        size="sm"
                        className="shrink-0 touch-target"
                      >
                        {module.is_completed
                          ? tc("button.retry", { fallback: "Retry" })
                          : tc("button.start", { fallback: "Start" })}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
