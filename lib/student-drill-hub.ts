/**
 * Shared data for student drill listings (skill drill, mixed drills, plan).
 */

import { createClient } from "@/lib/supabase/client"
import { getActiveExamId } from "@/lib/active-exam"

export interface TaxonomyNode {
  id: string
  parent_id: string | null
  level: number
  code: string
  name: string
}

export interface DrillModule {
  id: string
  name: string
  module_type: "drill_focus" | "drill_mixed"
  question_count: number
  target_node_id: string | null
  is_in_progress?: boolean
  l5_name?: string
  l4_name?: string
  l3_name?: string
  l3_id?: string
  l2_name?: string
  l2_id?: string
  is_required: boolean
  is_completed: boolean
  plan_task_id?: string
}

export async function fetchDrillHubData(): Promise<{ modules: DrillModule[] }> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const activeExamId = await getActiveExamId(supabase, user.id)

  const [modulesRes, taxonomyRes, completionsRes, inProgressRes, planTasksRes] =
    await Promise.all([
      (() => {
        let q = supabase
          .from("modules")
          .select("id, name, module_type, question_count, target_node_id, exam_id")
          .in("module_type", ["drill_focus", "drill_mixed"])
          .eq("is_published", true)
        q = activeExamId ? q.eq("exam_id", activeExamId) : q.in("exam_id", [])
        return q.order("name")
      })(),

      (() => {
        let q = supabase
          .from("taxonomy_nodes")
          .select("id, parent_id, level, code, name, exam_id")
          .eq("is_active", true)
        q = activeExamId ? q.eq("exam_id", activeExamId) : q.in("exam_id", [])
        return q.order("level").order("position")
      })(),

      supabase
        .from("module_completions")
        .select("module_id")
        .eq("user_id", user.id)
        .eq("context_type", "drill"),

      (() => {
        if (!activeExamId) return Promise.resolve({ data: [] })
        return (supabase as any)
          .from("attempts")
          .select("module_id")
          .eq("user_id", user.id)
          .eq("context_type", "drill")
          .not("module_id", "is", null)
      })(),

      supabase
        .from("user_state")
        .select("current_cycle_id")
        .eq("user_id", user.id)
        .single()
        .then(async ({ data: state }) => {
          if (!state?.current_cycle_id || !activeExamId) return []
          const { data: cycle } = await supabase
            .from("plan_cycles")
            .select("id, exam_id")
            .eq("id", state.current_cycle_id)
            .single()
          if (!cycle || cycle.exam_id !== activeExamId) return []
          const { data } = await supabase
            .from("plan_tasks")
            .select(
              "id, module_id, is_required, is_completed, title, task_type",
            )
            .eq("cycle_id", cycle.id)
          return data || []
        }),
    ])

  const nodes: TaxonomyNode[] = taxonomyRes.data || []
  const nodeMap = new Map<string, TaxonomyNode>()
  for (const n of nodes) nodeMap.set(n.id, n)

  function resolveAncestry(nodeId: string | null) {
    if (!nodeId) return {}
    const result: Record<string, string> = {}
    const levels: Record<number, TaxonomyNode> = {}
    let current = nodeMap.get(nodeId)
    while (current) {
      levels[current.level] = current
      current = current.parent_id ? nodeMap.get(current.parent_id) : undefined
    }
    if (levels[5]) result.l5_name = levels[5].name
    if (levels[4]) result.l4_name = levels[4].name
    if (levels[3]) {
      result.l3_name = levels[3].name
      result.l3_id = levels[3].id
    }
    if (levels[2]) {
      result.l2_name = levels[2].name
      result.l2_id = levels[2].id
    }
    return result
  }

  const completedModuleIds = new Set(
    (completionsRes.data || []).map((c: { module_id: string }) => c.module_id),
  )

  const inProgressModuleIds = new Set(
    (inProgressRes.data || [])
      .map((a: { module_id: string }) => a.module_id)
      .filter((id: string) => id && !completedModuleIds.has(id)),
  )

  const planTasksByModule = new Map<
    string,
    { id: string; is_required: boolean; is_completed: boolean }
  >()
  for (const pt of planTasksRes as Array<{
    id: string
    module_id?: string
    is_required: boolean
    is_completed: boolean
  }>) {
    if (pt.module_id) planTasksByModule.set(pt.module_id, pt)
  }

  const modules: DrillModule[] = (modulesRes.data || []).map(
    (m: {
      id: string
      name: string
      module_type: "drill_focus" | "drill_mixed"
      question_count: number
      target_node_id: string | null
    }) => {
      const ancestry = resolveAncestry(m.target_node_id)
      const planTask = planTasksByModule.get(m.id)
      return {
        ...m,
        ...ancestry,
        is_required: planTask?.is_required ?? false,
        is_completed:
          completedModuleIds.has(m.id) || (planTask?.is_completed ?? false),
        is_in_progress: inProgressModuleIds.has(m.id),
        plan_task_id: planTask?.id,
      }
    },
  )

  return { modules }
}
