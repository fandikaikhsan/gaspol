"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Target,
  Shuffle,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
} from "lucide-react"
import type { DrillModule } from "@/lib/student-drill-hub"
import { useTranslation } from "@/lib/i18n"
import { cn } from "@/lib/utils"

function drillUrl(moduleId: string, returnSkillId?: string, retry?: boolean) {
  const q = new URLSearchParams()
  if (returnSkillId) q.set("skillId", returnSkillId)
  if (retry) q.set("retry", "1")
  const s = q.toString()
  return `/drill/drill/${moduleId}${s ? `?${s}` : ""}`
}

/** Estimated minutes for chip display (matches previous hub heuristic, tuned to ~9 min for 5 Q). */
function estimateMinutes(questionCount: number) {
  const n = questionCount > 0 ? questionCount : 6
  return Math.max(1, Math.round(n * 1.8))
}

export function DrillModuleCard({
  module,
  showL4Badge = false,
  returnSkillId,
  highlight = false,
  variant = "default",
  moduleIndex = 1,
}: {
  module: DrillModule
  showL4Badge?: boolean
  /** When set, runner/pembahasan/result return to `/review/[skillId]/drill` */
  returnSkillId?: string
  highlight?: boolean
  /** Large neo-brutalist card for skill drill hub */
  variant?: "default" | "neo"
  /** 1-based module number (neo only) */
  moduleIndex?: number
}) {
  const router = useRouter()
  const { t } = useTranslation("drill")

  const handleCardClick = () => {
    if (module.is_completed) {
      router.push(
        `/drill/drill/${module.id}/result${returnSkillId ? `?skillId=${returnSkillId}` : ""}`,
      )
    } else {
      router.push(drillUrl(module.id, returnSkillId))
    }
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (module.is_completed) {
      router.push(drillUrl(module.id, returnSkillId, true))
    } else {
      router.push(drillUrl(module.id, returnSkillId))
    }
  }

  const buttonLabelDefault = module.is_completed
    ? "Ulangi"
    : module.is_in_progress
      ? "Lanjutkan"
      : "Mulai"

  const qc = module.question_count > 0 ? module.question_count : 0
  const minutes = estimateMinutes(qc)

  if (variant === "neo") {
    const neoButtonLabel = module.is_completed
      ? t("skillHub.repeat")
      : module.is_in_progress
        ? t("skillHub.continue")
        : t("skillHub.start")

    const btnBg = module.is_completed
      ? "bg-[#D0E9D6] hover:bg-[#c0dfc8]"
      : module.is_in_progress
        ? "bg-[#EBA84F] hover:bg-[#e49a3d] text-[#1a1a1a]"
        : "bg-[#D6D1F0] hover:bg-[#c9c2e8]"

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleCardClick()
          }
        }}
        className={cn(
          "h-full min-h-0 cursor-pointer rounded-[28px] border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_#000] transition-[transform,box-shadow] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-[#F5F1E9]",
          module.is_required && !module.is_completed && "ring-2 ring-amber-500/90 ring-offset-2 ring-offset-[#F5F1E9]",
          highlight && "ring-2 ring-amber-500 ring-offset-2 ring-offset-[#F5F1E9]",
        )}
      >
        <div className="flex h-full min-h-0 gap-3 sm:gap-4">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-baseline gap-2">
              <h3 className="line-clamp-2 font-serif text-xl font-bold tracking-tight text-black md:text-2xl">
                {module.name?.trim() ||
                  module.l5_name ||
                  t("skillHub.moduleTitle", { n: moduleIndex })}
              </h3>
              {module.is_required && !module.is_completed && (
                <span className="rounded-full border-2 border-black bg-amber-100 px-2 py-0.5 font-sans text-xs font-semibold text-black">
                  {t("skillHub.required")}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full border-2 border-black bg-white px-3 py-1.5 font-sans text-sm font-medium text-black/65">
                {qc > 0
                  ? t("skillHub.questionChip", { count: qc })
                  : t("skillHub.questionChipUnknown")}
              </span>
              <span className="inline-flex rounded-full border-2 border-black bg-white px-3 py-1.5 font-sans text-sm font-medium text-black/65">
                {t("skillHub.minutesChip", { count: minutes })}
              </span>
            </div>

            <div>
              <button
                type="button"
                className={cn(
                  "touch-target rounded-xl border-2 border-black px-4 py-2.5 font-sans text-sm font-semibold shadow-[4px_4px_0px_0px_#000] transition-[transform,box-shadow] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#000]",
                  btnBg,
                )}
                onClick={handleButtonClick}
              >
                {neoButtonLabel}
              </button>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end justify-start pt-1">
            <div
              className={cn(
                "h-14 w-14 rounded-full border-2 border-black md:h-16 md:w-16",
                module.is_completed ? "bg-[#2D7D71]" : "bg-[#B12030]",
              )}
              aria-hidden
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card
      className={`border-2 border-border shadow-brutal hover:shadow-brutal-lg transition-all cursor-pointer hover:-translate-y-0.5 ${
        module.is_required && !module.is_completed
          ? "ring-2 ring-primary/40"
          : ""
      } ${highlight ? "ring-2 ring-amber-500/80" : ""} ${
        module.is_completed ? "opacity-70" : ""
      }`}
      onClick={handleCardClick}
    >
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-3">
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

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm truncate">
                {module.l5_name || module.name}
              </h3>
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
                ~{estimateMinutes(module.question_count)} menit
              </span>
            </div>
          </div>

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
            {buttonLabelDefault}
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
