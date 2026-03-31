"use client"

/**
 * Skill drill — published drill_focus modules for one L5 micro-skill (same target as material card).
 * Primary entry: Review → material → "Latihan skill ini".
 */

import { Suspense, useMemo } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DrillModuleCard } from "@/components/drill/DrillModuleCard"
import { fetchDrillHubData } from "@/lib/student-drill-hub"
import { resolveSkillDrillBackRoute } from "@/lib/review-navigation"

function SkillDrillContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const skillId = params.skillId as string
  const highlightTaskId = searchParams.get("taskId")
  const from = searchParams.get("from")
  const pembahasanModuleId = searchParams.get("moduleId")

  const goBack = () => {
    const target = resolveSkillDrillBackRoute(
      skillId,
      from,
      pembahasanModuleId,
    )
    if (target) router.push(target)
    else router.back()
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ["skill-drill", skillId],
    queryFn: fetchDrillHubData,
  })

  const orderedModules = useMemo(() => {
    const all = data?.modules || []
    const forSkill = all.filter(
      (m) =>
        m.module_type === "drill_focus" && m.target_node_id === skillId,
    )
    const mandatory = forSkill.filter((m) => m.is_required && !m.is_completed)
    const rest = forSkill.filter(
      (m) => !(m.is_required && !m.is_completed),
    )
    return [...mandatory, ...rest]
  }, [data?.modules, skillId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-drill/10 flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-drill/10 p-4">
        <p className="text-destructive text-sm">Gagal memuat modul.</p>
        <Button variant="outline" className="mt-4" onClick={goBack}>
          Kembali
        </Button>
      </div>
    )
  }

  const skillLabel =
    orderedModules[0]?.l5_name || orderedModules[0]?.name || "Skill"

  return (
    <div className="min-h-screen bg-surface-drill/10 p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 touch-target"
            onClick={goBack}
            aria-label="Kembali"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Latihan skill</h1>
            <p className="text-sm text-muted-foreground">{skillLabel}</p>
          </div>
        </div>

        <div className="space-y-2">
          {orderedModules.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center border-2 border-dashed rounded-xl">
              Belum ada modul latihan untuk skill ini.
            </p>
          ) : (
            orderedModules.map((m) => (
              <DrillModuleCard
                key={m.id}
                module={m}
                showL4Badge
                returnSkillId={skillId}
                highlight={highlightTaskId === m.plan_task_id}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default function SkillDrillPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-drill/10 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <SkillDrillContent />
    </Suspense>
  )
}
