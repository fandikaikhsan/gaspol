/**
 * TaskCard Component
 * Phase 4: Plan Generation & Task System
 */

import Link from "next/link"
import { useTranslation } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface TaskCardProps {
  task: {
    id: string
    task_type: string
    task_order: number
    is_required: boolean
    title: string
    subtitle: string
    estimated_duration_min: number
    is_completed: boolean
    completion_score?: number
    target_node_id?: string
  }
}

const taskIcons = {
  drill_focus: "",
  drill_mixed: "",
  mock: "",
  flashcard: "",
  review: "",
}

const taskColors = {
  drill_focus: "bg-construct-teliti",
  drill_mixed: "bg-construct-reasoning",
  mock: "bg-construct-speed",
  flashcard: "bg-construct-computation",
  review: "bg-construct-reading",
}

function getTaskHref(task: TaskCardProps["task"]): string {
  const tid = task.id
  const target = task.target_node_id || ""
  switch (task.task_type) {
    case "drill_focus":
      return target
        ? `/review/${target}/drill?taskId=${tid}&from=plan`
        : `/review?taskId=${tid}`
    case "drill_mixed":
      return `/drill/mixed?taskId=${tid}`
    case "mock":
      return `/drill/mixed?taskId=${tid}`
    case "flashcard":
      return `/review/flashcards?taskId=${tid}`
    case "review":
      return `/review?taskId=${tid}`
    default:
      return `/drill/mixed?taskId=${tid}`
  }
}

export function TaskCard({ task }: TaskCardProps) {
  const { t } = useTranslation("common")
  const { t: tp } = useTranslation("plan")
  const icon = taskIcons[task.task_type as keyof typeof taskIcons] || ""
  const color =
    taskColors[task.task_type as keyof typeof taskColors] || "bg-muted"

  return (
    <Card
      className={[
        task.is_completed ? "bg-status-strong/5 border-status-strong" : "",
        task.is_required && !task.is_completed
          ? "border-l-4 border-l-destructive bg-destructive/5"
          : "",
      ].join(" ")}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-lg ${color} border-2 border-border flex items-center justify-center text-2xl`}
            >
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg">{task.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{task.subtitle}</p>
            </div>
          </div>
          {task.is_completed && (
            <Badge variant="strong">{t("status.done")}</Badge>
          )}
          {!task.is_completed && task.is_required && (
            <Badge variant="destructive">{t("status.required")}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {t("time.estimated", { minutes: task.estimated_duration_min })}
            {task.is_completed && task.completion_score && (
              <span className="ml-4 font-semibold text-foreground">
                {t("time.score", { score: task.completion_score.toFixed(0) })}
              </span>
            )}
          </div>
          <Link href={getTaskHref(task)}>
            <Button variant={task.is_completed ? "brutal-secondary" : "brutal"}>
              {task.is_completed ? t("button.review") : t("button.start")}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
