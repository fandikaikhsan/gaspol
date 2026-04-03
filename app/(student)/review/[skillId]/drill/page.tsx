"use client"

/**
 * Skill drill — published drill_focus modules for one L5 micro-skill (same target as material card).
 * Primary entry: Review → material → "Latihan skill ini".
 */

import { Suspense, useMemo, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Loader2, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DrillModuleCard } from "@/components/drill/DrillModuleCard"
import { DrillTutorSkillHubModal } from "@/components/drill/DrillTutorSkillHubModal"
import { fetchDrillHubData } from "@/lib/student-drill-hub"
import { resolveSkillDrillBackRoute } from "@/lib/review-navigation"
import { useTranslation } from "@/lib/i18n"

const PAGE_BG = "min-h-screen bg-[#F5F1E9]"

function SkillDrillContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation("drill")
  const [tutorModalOpen, setTutorModalOpen] = useState(false)
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
      <div
        className={`${PAGE_BG} flex items-center justify-center p-4 pb-24`}
      >
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${PAGE_BG} p-4 pb-24`}>
        <div className="mx-auto max-w-3xl">
          <p className="text-sm text-destructive">{t("skillHub.loadError")}</p>
          <Button
            variant="outline"
            className="mt-4 border-2 border-black shadow-[4px_4px_0px_0px_#000]"
            onClick={goBack}
          >
            {t("skillHub.back")}
          </Button>
        </div>
      </div>
    )
  }

  const skillTitle =
    orderedModules[0]?.l5_name || orderedModules[0]?.name || "Skill"

  const tutorButtonClass =
    "flex touch-target items-center justify-center gap-2 rounded-2xl border-2 border-black bg-[#EBA84F] px-4 py-3.5 font-sans text-base font-semibold text-black shadow-[4px_4px_0px_0px_#000] transition-[transform,box-shadow] hover:bg-[#e49a3d] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#000] md:py-3.5 md:text-base lg:px-5 lg:py-4 lg:text-lg whitespace-nowrap shrink-0"

  return (
    <div className={`${PAGE_BG} px-4 pb-28 pt-2 md:px-6 md:pt-4`}>
      <div className="mx-auto max-w-3xl space-y-6 xl:max-w-7xl">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <button
              type="button"
              onClick={goBack}
              aria-label={t("skillHub.back")}
              className="touch-target flex shrink-0 items-center justify-center rounded-xl text-black hover:bg-black/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black md:mt-1"
            >
              <ArrowLeft className="h-6 w-6" strokeWidth={2} />
            </button>
            <div className="min-w-0 flex-1 space-y-1 pt-0.5 md:pt-0">
              <p className="font-sans text-xs font-medium tracking-wide text-black/70 md:text-sm">
                {t("skillHub.pageSubtitle")}
              </p>
              <h1 className="font-serif text-2xl font-bold leading-tight tracking-tight text-black md:text-3xl md:leading-[1.15] lg:text-4xl">
                {skillTitle}
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setTutorModalOpen(true)}
            className={`${tutorButtonClass} w-full md:w-auto md:self-center`}
          >
            <Zap className="h-5 w-5 shrink-0 lg:h-6 lg:w-6" strokeWidth={2.25} />
            {t("skillHub.tutorCta")}
          </button>
        </header>

        <DrillTutorSkillHubModal
          open={tutorModalOpen}
          onOpenChange={setTutorModalOpen}
          skillTitle={skillTitle}
          practiceModuleCount={orderedModules.length}
        />

        <div
          className={
            orderedModules.length === 0
              ? ""
              : "grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3"
          }
        >
          {orderedModules.length === 0 ? (
            <p className="rounded-[28px] border-2 border-dashed border-black/40 bg-white/60 px-5 py-10 text-center font-sans text-sm text-black/70 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] md:text-base">
              {t("skillHub.empty")}
            </p>
          ) : (
            orderedModules.map((m, i) => (
              <DrillModuleCard
                key={m.id}
                module={m}
                returnSkillId={skillId}
                highlight={highlightTaskId === m.plan_task_id}
                variant="neo"
                moduleIndex={i + 1}
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
        <div
          className={`${PAGE_BG} flex min-h-screen items-center justify-center`}
        >
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <SkillDrillContent />
    </Suspense>
  )
}
