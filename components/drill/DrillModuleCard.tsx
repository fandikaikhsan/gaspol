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

function drillUrl(moduleId: string, returnSkillId?: string, retry?: boolean) {
  const q = new URLSearchParams()
  if (returnSkillId) q.set("skillId", returnSkillId)
  if (retry) q.set("retry", "1")
  const s = q.toString()
  return `/drill/drill/${moduleId}${s ? `?${s}` : ""}`
}

export function DrillModuleCard({
  module,
  showL4Badge = false,
  returnSkillId,
  highlight = false,
}: {
  module: DrillModule
  showL4Badge?: boolean
  /** When set, runner/pembahasan/result return to `/review/[skillId]/drill` */
  returnSkillId?: string
  highlight?: boolean
}) {
  const router = useRouter()

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
                ~{Math.max(5, Math.round((module.question_count || 10) * 1.5))}{" "}
                menit
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
            {buttonLabel}
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
