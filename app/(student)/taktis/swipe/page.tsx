"use client"

/**
 * Swipe Test Page
 * Phase 6: Taktis Learning Mode - Tinder-like quick answers
 */

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n"

export default function SwipeTestPage() {
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const { t } = useTranslation('taktis')
  const { t: tc } = useTranslation('common')

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">{t('swipe.pageTitle')}</h1>
          <p className="text-muted-foreground">
            {t('swipe.pageSubtitle')}
          </p>
          <div className="mt-4 text-2xl font-bold">
            {t('swipe.score', { correct: score, total })}
          </div>
        </div>

        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
          <CardContent className="text-center py-16">
            <p className="text-xl mb-8">
              {t('swipe.comingSoon')}
            </p>
            <p className="text-muted-foreground mb-6">
              {t('swipe.comingSoonDesc')}
            </p>
            <Button onClick={() => window.history.back()}>
              {tc('button.goBack')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
