"use client"

/**
 * Plan Dashboard (T-060 decomposed, T-075 React Query)
 * Phase 4: Plan Generation & Task System
 *
 * Slim orchestrator — all UI in sub-components, data via React Query.
 * Each sub-component file < 300 lines.
 */

import { usePlanData } from "@/lib/hooks/usePlanData"
import { PlanPageSkeleton } from "@/components/plan/PlanPageSkeleton"
import { BaselineIncomplete } from "@/components/plan/BaselineIncomplete"
import { GeneratePlanCTA } from "@/components/plan/GeneratePlanCTA"
import { ActivePlanView } from "@/components/plan/ActivePlanView"

export default function PlanDashboardPage() {
  const { data, isLoading, error } = usePlanData()

  if (isLoading || !data) return <PlanPageSkeleton />

  // Check baseline completion
  const baselineCompleted =
    data.baselineModules.length > 0 &&
    data.baselineModules.every((m) => m.is_completed)

  // Baseline not done → show baseline prompt
  if (!baselineCompleted) {
    return <BaselineIncomplete baselineModules={data.baselineModules} />
  }

  // Baseline done but no plan → show generate CTA
  if (!data.currentCycle) {
    return <GeneratePlanCTA baselineModules={data.baselineModules} />
  }

  // Active plan
  return (
    <ActivePlanView
      currentCycle={data.currentCycle}
      tasks={data.tasks}
      userState={data.userState}
      readinessScore={data.readinessScore}
      examDate={data.examDate}
    />
  )
}
