/**
 * TaskCard Component
 * Phase 4: Plan Generation & Task System
 */

import Link from "next/link"
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
  drill_focus: '🎯',
  drill_mixed: '🔄',
  mock: '📝',
  flashcard: '🗂️',
  review: '👁️',
}

const taskColors = {
  drill_focus: 'bg-construct-teliti',
  drill_mixed: 'bg-construct-reasoning',
  mock: 'bg-construct-speed',
  flashcard: 'bg-construct-computation',
  review: 'bg-construct-reading',
}

function getTaskHref(task: TaskCardProps['task']): string {
  switch (task.task_type) {
    case 'drill_focus':
      return `/locked-in/drills/practice?mode=focused&node=${task.target_node_id || ''}&count=10&taskId=${task.id}`
    case 'drill_mixed':
      return `/locked-in/drills/practice?mode=mixed&count=10&taskId=${task.id}`
    case 'mock':
      return `/locked-in/mock?taskId=${task.id}`
    case 'flashcard':
      return `/taktis/flashcards?taskId=${task.id}`
    case 'review':
      return `/locked-in/review?taskId=${task.id}`
    default:
      return `/locked-in/drills/practice?mode=mixed&count=10&taskId=${task.id}`
  }
}

export function TaskCard({ task }: TaskCardProps) {
  const icon = taskIcons[task.task_type as keyof typeof taskIcons] || '📌'
  const color = taskColors[task.task_type as keyof typeof taskColors] || 'bg-muted'

  return (
    <Card className={task.is_completed ? 'bg-status-strong/5 border-status-strong' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg ${color} border-2 border-border flex items-center justify-center text-2xl`}>
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg">{task.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{task.subtitle}</p>
            </div>
          </div>
          {task.is_completed && (
            <Badge variant="strong">✓ Done</Badge>
          )}
          {!task.is_completed && task.is_required && (
            <Badge variant="destructive">Required</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            ⏱️ ~{task.estimated_duration_min} min
            {task.is_completed && task.completion_score && (
              <span className="ml-4 font-semibold text-foreground">
                Score: {task.completion_score.toFixed(0)}%
              </span>
            )}
          </div>
          <Link href={getTaskHref(task)}>
            <Button variant={task.is_completed ? "brutal-secondary" : "brutal"}>
              {task.is_completed ? 'Review' : 'Start'}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
