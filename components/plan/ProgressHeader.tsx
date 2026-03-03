/**
 * ProgressHeader Component
 * Phase 4: Plan Generation & Task System
 */

import { useTranslation } from "@/lib/i18n"
import { Card, CardContent } from "@/components/ui/card"

interface ProgressHeaderProps {
  daysUntilExam: number
}

export function ProgressHeader({ daysUntilExam }: ProgressHeaderProps) {
  const { t } = useTranslation('common')

  return (
    <div className="grid grid-cols-1 gap-4">
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
    </div>
  )
}
