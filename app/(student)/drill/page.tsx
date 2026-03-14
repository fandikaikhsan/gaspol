"use client"

/**
 * Drill Hub — V3 Two-Tab Layout (F-001)
 *
 * - Mandatory plan tasks pinned at top
 * - Tab 1: Topic-Based Modules (level-5 skill modules, grouped by level-2/3 accordion)
 * - Tab 2: Mixed Drills (level-3 topic modules, grouped by level-2)
 * - Status filter (All / Wajib / Selesai) + search bar
 * - Surface color: surface-drill (peach)
 */

import { Suspense, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Target,
  Shuffle,
  Search,
  CheckCircle2,
  Pin,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  Filter,
  FilterX,
} from "lucide-react"
import { getActiveExamId } from "@/lib/active-exam"

/* ── Types ─────────────────────────────────────────────── */

interface TaxonomyNode {
  id: string
  parent_id: string | null
  level: number
  code: string
  name: string
}

interface DrillModule {
  id: string
  name: string
  module_type: "drill_focus" | "drill_mixed"
  question_count: number
  target_node_id: string | null
  is_in_progress?: boolean
  // Resolved from taxonomy
  l5_name?: string
  l4_name?: string
  l3_name?: string
  l3_id?: string
  l2_name?: string
  l2_id?: string
  // From plan/completion joins
  is_required: boolean
  is_completed: boolean
  plan_task_id?: string
}

type StatusFilter = "all" | "required" | "completed"
type DrillTab = "topic" | "mixed"

/* ── Data hook ─────────────────────────────────────────── */

async function fetchDrillData() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // Get active exam ID — students only see modules for the active exam
  const activeExamId = await getActiveExamId(supabase, user.id)

  // Parallel fetches — filter by active exam
  const [modulesRes, taxonomyRes, completionsRes, inProgressRes, planTasksRes] =
    await Promise.all([
      // 1. Published drill modules for active exam only (empty when no active exam)
      (() => {
        let q = supabase
          .from("modules")
          .select("id, name, module_type, question_count, target_node_id, exam_id")
          .in("module_type", ["drill_focus", "drill_mixed"])
          .eq("is_published", true)
        q = activeExamId ? q.eq("exam_id", activeExamId) : q.in("exam_id", [])
        return q.order("name")
      })(),

      // 2. Taxonomy tree for active exam only
      (() => {
        let q = supabase
          .from("taxonomy_nodes")
          .select("id, parent_id, level, code, name, exam_id")
          .eq("is_active", true)
        q = activeExamId ? q.eq("exam_id", activeExamId) : q.in("exam_id", [])
        return q.order("level").order("position")
      })(),

      // 3. User's module completions (drill context only)
      supabase
        .from("module_completions")
        .select("module_id")
        .eq("user_id", user.id)
        .eq("context_type", "drill"),

      // 4. Modules in progress (has attempts, no completion)
      (() => {
        if (!activeExamId) return Promise.resolve({ data: [] })
        return (supabase as any)
          .from("attempts")
          .select("module_id")
          .eq("user_id", user.id)
          .eq("context_type", "drill")
          .not("module_id", "is", null)
      })(),

      // 5. Plan tasks for current cycle — only if cycle belongs to active exam
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

  // Build taxonomy lookup
  const nodes: TaxonomyNode[] = taxonomyRes.data || []
  const nodeMap = new Map<string, TaxonomyNode>()
  for (const n of nodes) nodeMap.set(n.id, n)

  // Resolve ancestry for a node: walk up to get l2, l3, l4, l5
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

  // Enrich modules
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

/* ── Module Card Component ─────────────────────────────── */

function ModuleCard({
  module,
  showL4Badge = false,
}: {
  module: DrillModule
  showL4Badge?: boolean
}) {
  const router = useRouter()

  const handleCardClick = () => {
    if (module.is_completed) {
      router.push(`/drill/drill/${module.id}/result`)
    } else {
      router.push(`/drill/drill/${module.id}`)
    }
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (module.is_completed) {
      router.push(`/drill/drill/${module.id}?retry=1`)
    } else if (module.is_in_progress) {
      router.push(`/drill/drill/${module.id}`)
    } else {
      router.push(`/drill/drill/${module.id}`)
    }
  }

  const buttonLabel = module.is_completed
    ? "Ulangi"
    : module.is_in_progress
      ? "Lanjutkan"
      : "Mulai"

  return (
    <Card
      className={`border-2 border-border shadow-brutal hover:shadow-brutal-lg transition-all cursor-pointer hover:-translate-y-0.5 ${
        module.is_required && !module.is_completed
          ? "ring-2 ring-primary/40"
          : ""
      } ${module.is_completed ? "opacity-70" : ""}`}
      onClick={handleCardClick}
    >
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className={`w-10 h-10 ${
              module.module_type === "drill_focus"
                ? "bg-pastel-yellow"
                : "bg-pastel-mint"
            } rounded-xl border-2 border-border flex items-center justify-center shrink-0`}
          >
            {module.module_type === "drill_focus" ? (
              <Target className="h-5 w-5" />
            ) : (
              <Shuffle className="h-5 w-5" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm truncate">
                {module.l5_name || module.name}
              </h3>
              {/* Badges */}
              {module.is_required && !module.is_completed && (
                <Badge
                  variant="default"
                  className="shrink-0 gap-1 text-[10px] px-1.5 py-0"
                >
                  <AlertTriangle className="h-3 w-3" />
                  Wajib
                </Badge>
              )}
              {module.is_completed && (
                <Badge
                  variant="secondary"
                  className="shrink-0 gap-1 text-[10px] px-1.5 py-0"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Selesai
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
              {showL4Badge && module.l4_name && (
                <>
                  <span className="text-xs font-medium text-foreground/60">
                    {module.l4_name}
                  </span>
                  <span>·</span>
                </>
              )}
              {module.question_count > 0 && (
                <>
                  <span>{module.question_count} soal</span>
                  <span>·</span>
                </>
              )}
              <span>
                ~{Math.max(5, Math.round((module.question_count || 10) * 1.5))}{" "}
                menit
              </span>
            </div>
          </div>

          {/* CTA */}
          <Button
            variant={module.is_in_progress ? "default" : "brutal"}
            size="sm"
            className={`shrink-0 touch-target text-xs h-8 px-3 ${
              module.is_in_progress
                ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-600"
                : ""
            }`}
            onClick={handleButtonClick}
          >
            {buttonLabel}
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/* ── Main Component ────────────────────────────────────── */

export default function DrillHubPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-drill/10 p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="h-10 w-48 mx-auto rounded-lg bg-muted animate-skeleton-pulse" />
              <div className="h-4 w-64 mx-auto rounded bg-muted animate-skeleton-pulse" />
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl border-2 border-border bg-muted/40 animate-skeleton-pulse"
              />
            ))}
          </div>
        </div>
      }
    >
      <DrillHubContent />
    </Suspense>
  )
}

function DrillHubContent() {
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get("tab") as DrillTab) || "topic"

  const [activeTab, setActiveTab] = useState<DrillTab>(initialTab)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [l3Filter, setL3Filter] = useState<string>("all")
  const [l4Filter, setL4Filter] = useState<string>("all")
  const [l5Filter, setL5Filter] = useState<string>("all")

  const { data, isLoading } = useQuery({
    queryKey: ["drill-hub-v3"],
    queryFn: fetchDrillData,
  })

  // Split modules by type
  const topicModules = useMemo(
    () => (data?.modules || []).filter((m) => m.module_type === "drill_focus"),
    [data],
  )
  const mixedModules = useMemo(
    () => (data?.modules || []).filter((m) => m.module_type === "drill_mixed"),
    [data],
  )

  // Mandatory (required + incomplete) tasks — pinned at top
  const mandatoryTasks = useMemo(
    () => (data?.modules || []).filter((m) => m.is_required && !m.is_completed),
    [data],
  )

  // Taxonomy filter options — cascading from active tab modules
  const taxonomyOptions = useMemo(() => {
    const mods = activeTab === "topic" ? topicModules : mixedModules
    const l3s = new Set<string>()
    const l4s = new Set<string>()
    const l5s = new Set<string>()

    for (const m of mods) {
      if (m.l3_name) l3s.add(m.l3_name)
      if (m.l4_name && (l3Filter === "all" || m.l3_name === l3Filter))
        l4s.add(m.l4_name)
      if (
        m.l5_name &&
        (l3Filter === "all" || m.l3_name === l3Filter) &&
        (l4Filter === "all" || m.l4_name === l4Filter)
      )
        l5s.add(m.l5_name)
    }

    return {
      l3: Array.from(l3s).sort(),
      l4: Array.from(l4s).sort(),
      l5: Array.from(l5s).sort(),
    }
  }, [activeTab, topicModules, mixedModules, l3Filter, l4Filter])

  const resetTaxonomyFilters = () => {
    setL3Filter("all")
    setL4Filter("all")
    setL5Filter("all")
  }

  const handleTabChange = (v: string) => {
    setActiveTab(v as DrillTab)
    resetTaxonomyFilters()
  }

  // Apply status filter + search + taxonomy
  function filterModules(modules: DrillModule[]) {
    let list = modules

    if (statusFilter === "required") list = list.filter((m) => m.is_required)
    else if (statusFilter === "completed")
      list = list.filter((m) => m.is_completed)

    if (l3Filter !== "all") list = list.filter((m) => m.l3_name === l3Filter)
    if (l4Filter !== "all") list = list.filter((m) => m.l4_name === l4Filter)
    if (l5Filter !== "all") list = list.filter((m) => m.l5_name === l5Filter)

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (m) =>
          (m.l5_name || m.name).toLowerCase().includes(q) ||
          (m.l4_name || "").toLowerCase().includes(q) ||
          (m.l3_name || "").toLowerCase().includes(q) ||
          (m.l2_name || "").toLowerCase().includes(q),
      )
    }

    return list
  }

  // Group topic modules: level-2 → level-3 → modules
  const topicGroups = useMemo(() => {
    const filtered = filterModules(topicModules)
    const groups: Record<
      string,
      {
        l2_name: string
        l3_groups: Record<string, { l3_name: string; modules: DrillModule[] }>
      }
    > = {}

    for (const m of filtered) {
      const l2Key = m.l2_id || "unknown"
      const l2Name = m.l2_name || "Lainnya"
      const l3Key = m.l3_id || "unknown"
      const l3Name = m.l3_name || "Topik Umum"

      if (!groups[l2Key]) groups[l2Key] = { l2_name: l2Name, l3_groups: {} }
      if (!groups[l2Key].l3_groups[l3Key])
        groups[l2Key].l3_groups[l3Key] = { l3_name: l3Name, modules: [] }
      groups[l2Key].l3_groups[l3Key].modules.push(m)
    }

    return groups
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicModules, statusFilter, searchQuery, l3Filter, l4Filter, l5Filter])

  // Group mixed modules: level-2 → modules
  const mixedGroups = useMemo(() => {
    const filtered = filterModules(mixedModules)
    const groups: Record<string, { l2_name: string; modules: DrillModule[] }> =
      {}

    for (const m of filtered) {
      const l2Key = m.l2_id || "unknown"
      const l2Name = m.l2_name || "Lainnya"
      if (!groups[l2Key]) groups[l2Key] = { l2_name: l2Name, modules: [] }
      groups[l2Key].modules.push(m)
    }

    return groups
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mixedModules, statusFilter, searchQuery, l3Filter, l4Filter, l5Filter])

  // Counts
  const activeModules = activeTab === "topic" ? topicModules : mixedModules
  const requiredCount = activeModules.filter((m) => m.is_required).length
  const completedCount = activeModules.filter((m) => m.is_completed).length

  /* ── Loading ── */
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
              className="h-20 rounded-xl border-2 border-border bg-muted/40 animate-skeleton-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-drill/10 p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold">Drill</h1>
          <p className="text-sm text-muted-foreground">
            Latihan modul per topik atau campuran
          </p>
        </div>

        {/* ── Mandatory Tasks ── */}
        {mandatoryTasks.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
              <Pin className="h-4 w-4 text-primary" />
              Tugas Wajib ({mandatoryTasks.length})
            </div>
            {mandatoryTasks.map((m) => (
              <ModuleCard key={m.id} module={m} showL4Badge />
            ))}
          </div>
        )}

        {/* ── Search ── */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari modul..."
            className="pl-9 border-2 border-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* ── Tab Switcher ── */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="topic" className="touch-target gap-1.5">
              <Target className="h-4 w-4" />
              Per Topik
            </TabsTrigger>
            <TabsTrigger value="mixed" className="touch-target gap-1.5">
              <Shuffle className="h-4 w-4" />
              Campuran
            </TabsTrigger>
          </TabsList>

          {/* ── Status Filter ── */}
          <div className="flex gap-2 mt-3">
            {(
              [
                ["all", "Semua"],
                ["required", "Wajib"],
                ["completed", "Selesai"],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                variant={statusFilter === value ? "default" : "outline"}
                size="sm"
                className="text-xs h-7 px-3"
                onClick={() => setStatusFilter(value)}
              >
                {label}{" "}
                {value === "all"
                  ? `(${activeModules.length})`
                  : value === "required"
                    ? `(${requiredCount})`
                    : `(${completedCount})`}
              </Button>
            ))}
          </div>

          {/* ── Taxonomy Filters ── */}
          {(taxonomyOptions.l3.length > 0 ||
            taxonomyOptions.l4.length > 0 ||
            taxonomyOptions.l5.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {taxonomyOptions.l3.length > 0 && (
                <Select
                  value={l3Filter}
                  onValueChange={(v) => {
                    setL3Filter(v)
                    setL4Filter("all")
                    setL5Filter("all")
                  }}
                >
                  <SelectTrigger className="w-[180px] h-8 text-xs border-2 border-border">
                    <Filter className="h-3 w-3 mr-1.5 shrink-0" />
                    <SelectValue placeholder="Subtopik (L3)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Subtopik</SelectItem>
                    {taxonomyOptions.l3.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {taxonomyOptions.l4.length > 0 && (
                <Select
                  value={l4Filter}
                  onValueChange={(v) => {
                    setL4Filter(v)
                    setL5Filter("all")
                  }}
                >
                  <SelectTrigger className="w-[180px] h-8 text-xs border-2 border-border">
                    <Filter className="h-3 w-3 mr-1.5 shrink-0" />
                    <SelectValue placeholder="Materi (L4)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Materi</SelectItem>
                    {taxonomyOptions.l4.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {taxonomyOptions.l5.length > 0 && (
                <Select value={l5Filter} onValueChange={(v) => setL5Filter(v)}>
                  <SelectTrigger className="w-[180px] h-8 text-xs border-2 border-border">
                    <Filter className="h-3 w-3 mr-1.5 shrink-0" />
                    <SelectValue placeholder="Skill (L5)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Skill</SelectItem>
                    {taxonomyOptions.l5.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {(l3Filter !== "all" ||
                l4Filter !== "all" ||
                l5Filter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-muted-foreground"
                  onClick={resetTaxonomyFilters}
                >
                  <FilterX className="h-3.5 w-3.5 mr-1" />
                  Reset
                </Button>
              )}
            </div>
          )}

          {/* ── Tab 1: Topic-Based Modules ── */}
          <TabsContent value="topic" className="mt-4 space-y-6">
            {Object.keys(topicGroups).length === 0 ? (
              <EmptyState message="Tidak ada modul topik yang ditemukan" />
            ) : (
              Object.entries(topicGroups).map(([l2Key, l2Group]) => (
                <div key={l2Key} className="space-y-2">
                  {/* Level-2 header */}
                  <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground px-1">
                    {l2Group.l2_name}
                  </h2>

                  {/* Level-3 accordions */}
                  <Accordion
                    type="multiple"
                    defaultValue={Object.keys(l2Group.l3_groups)}
                  >
                    {Object.entries(l2Group.l3_groups).map(
                      ([l3Key, l3Group]) => (
                        <AccordionItem
                          key={l3Key}
                          value={l3Key}
                          className="border-2 border-border rounded-xl mb-2 overflow-hidden"
                        >
                          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
                            <div className="flex items-center gap-2">
                              {l3Group.l3_name}
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5"
                              >
                                {l3Group.modules.length}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-3 pb-3 space-y-2">
                            {l3Group.modules.map((m) => (
                              <ModuleCard key={m.id} module={m} showL4Badge />
                            ))}
                          </AccordionContent>
                        </AccordionItem>
                      ),
                    )}
                  </Accordion>
                </div>
              ))
            )}
          </TabsContent>

          {/* ── Tab 2: Mixed Drills ── */}
          <TabsContent value="mixed" className="mt-4 space-y-6">
            {Object.keys(mixedGroups).length === 0 ? (
              <EmptyState message="Tidak ada modul campuran yang ditemukan" />
            ) : (
              Object.entries(mixedGroups).map(([l2Key, l2Group]) => (
                <div key={l2Key} className="space-y-2">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground px-1">
                    {l2Group.l2_name}
                  </h2>
                  <div className="space-y-2">
                    {l2Group.modules.map((m) => (
                      <ModuleCard key={m.id} module={m} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="border-2 border-dashed">
      <CardContent className="py-10 text-center">
        <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  )
}
