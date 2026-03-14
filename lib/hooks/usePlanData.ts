"use client"

/**
 * Plan Data Hooks (T-075)
 * React Query hooks for plan page data fetching
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { getActiveExamConfig } from "@/lib/active-exam"

export interface BaselineModule {
  id: string
  title: string
  is_completed: boolean
  score?: number
}

export interface PlanTask {
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

export interface PlanData {
  user: any
  userState: any
  currentCycle: any
  tasks: PlanTask[]
  baselineModules: BaselineModule[]
  readinessScore: number
  examDate: string | null
  hasActiveExam: boolean
}

async function fetchPlanData(): Promise<PlanData> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Not authenticated")

  // Parallel fetches for independent data
  const [stateResult, baselineResult, snapshotResult, profileResult] = await Promise.all([
    supabase.from("user_state").select("*").eq("user_id", user.id).single(),
    supabase
      .from("baseline_modules")
      .select("id, title, module_id")
      .eq("is_active", true)
      .order("checkpoint_order"),
    supabase
      .from("analytics_snapshots")
      .select("readiness_score")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("profiles")
      .select("exam_date")
      .eq("id", user.id)
      .single(),
  ])

  const state = stateResult.data
  const examConfig = await getActiveExamConfig(supabase, user.id)
  const baselineData = baselineResult.data || []

  // Fetch baseline completion status (N+1 eliminated — single query)
  const moduleIds = baselineData.map((m) => m.module_id)
  const { data: allCompletions } = moduleIds.length > 0
    ? await supabase
        .from("module_completions")
        .select("module_id, score")
        .eq("user_id", user.id)
        .eq("context_type", "baseline")
        .in("module_id", moduleIds)
    : { data: [] }

  const completionMap = new Map(
    (allCompletions || []).map((c) => [c.module_id, c.score])
  )

  const baselineModules: BaselineModule[] = baselineData.map((module) => ({
    id: module.id,
    title: module.title,
    is_completed: completionMap.has(module.module_id),
    score: completionMap.get(module.module_id),
  }))

  // Fetch cycle & tasks if present
  let currentCycle = null
  let tasks: PlanTask[] = []

  if (state?.current_cycle_id) {
    const { data: cycle } = await supabase
      .from("plan_cycles")
      .select("*")
      .eq("id", state.current_cycle_id)
      .single()

    currentCycle = cycle

    if (cycle) {
      const { data: cycleTasks } = await supabase
        .from("plan_tasks")
        .select("*")
        .eq("cycle_id", cycle.id)
        .order("task_order")

      tasks = [...(cycleTasks || [])].sort((a: PlanTask, b: PlanTask) => {
        const aPriority = a.is_required && !a.is_completed ? 0 : 1
        const bPriority = b.is_required && !b.is_completed ? 0 : 1
        if (aPriority !== bPriority) return aPriority - bPriority
        return a.task_order - b.task_order
      })
    }
  }

  const hasActiveExam = examConfig !== null

  return {
    user,
    userState: state,
    currentCycle,
    tasks,
    baselineModules,
    readinessScore: snapshotResult.data?.readiness_score || 0,
    examDate: profileResult.data?.exam_date || null,
    hasActiveExam,
  }
}

export function usePlanData() {
  const router = useRouter()

  return useQuery({
    queryKey: ["plan-data"],
    queryFn: fetchPlanData,
    retry: 1,
    meta: {
      onError: () => router.push("/login"),
    },
  })
}

export function useGeneratePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const supabase = createClient()
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Failed to generate plan")
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plan-data"] })
    },
  })
}
