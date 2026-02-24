/**
 * ProgressHeader Component
 * Phase 4: Plan Generation & Task System
 */

import { useTranslation } from "@/lib/i18n"
import { Card, CardContent } from "@/components/ui/card"

interface ProgressHeaderProps {
  currentDay: number
  totalDays: number
  daysUntilExam: number
}

export function ProgressHeader({ currentDay, totalDays, daysUntilExam }: ProgressHeaderProps) {
  const { t } = useTranslation('common')
  const { t: tp } = useTranslation('plan')

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
        <CardContent className="pt-6">
          <div className="text-4xl font-bold text-primary">
            {tp('dayProgress', { current: currentDay, total: totalDays })}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {tp('studyPlanProgress')}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5">
        <CardContent className="pt-6">
          <div className="text-4xl font-bold text-destructive">
            H-{daysUntilExam}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {t('time.daysUntilExam')}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-status-strong/10 to-status-strong/5 col-span-2 md:col-span-1">
        <CardContent className="pt-6 text-center md:text-left">
          <div className="text-2xl font-bold text-status-strong">
            {tp('daysLeft', { count: totalDays - currentDay })}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {tp('makeEveryDayCount')}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
