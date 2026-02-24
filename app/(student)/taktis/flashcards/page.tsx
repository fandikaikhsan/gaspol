"use client"

/**
 * Flashcards Page
 * Phase 6: Taktis Learning Mode
 */

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { FlashcardStack } from "@/components/taktis/FlashcardStack"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n"

function FlashcardsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { t } = useTranslation('taktis')

  const taskId = searchParams.get('taskId')

  const [user, setUser] = useState<any>(null)
  const [flashcards, setFlashcards] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFlashcards = async () => {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (!currentUser) {
        router.push('/login')
        return
      }

      setUser(currentUser)

      // Fetch published flashcards
      const { data } = await supabase
        .from('flashcards')
        .select('*')
        .eq('status', 'published')
        .limit(20)

      setFlashcards(data || [])
      setIsLoading(false)
    }

    fetchFlashcards()
  }, [router])

  const handleReview = async (flashcardId: string, confidence: string) => {
    if (!user) return

    const supabase = createClient()
    await supabase.from('flashcard_reviews').insert({
      user_id: user.id,
      flashcard_id: flashcardId,
      confidence_level: confidence,
    })
  }

  const handleComplete = async () => {
    if (taskId && user) {
      const supabase = createClient()
      await supabase
        .from('plan_tasks')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .eq('user_id', user.id)
    }

    toast({
      title: t('flashcards.complete'),
      description: t('flashcards.completeDesc'),
    })
    router.push('/plan')
  }

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <p>{t('flashcards.loading')}</p>
    </div>
  }

  if (flashcards.length === 0) {
    return <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-2xl mb-4">📚</p>
        <p className="text-lg font-semibold mb-2">{t('flashcards.noCards')}</p>
        <p className="text-muted-foreground mb-6">
          {t('flashcards.noCardsDesc')}
        </p>
        <Button onClick={() => router.push('/plan')}>
          {t('flashcards.backToPlan')}
        </Button>
      </div>
    </div>
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">{t('flashcards.pageTitle')}</h1>
          <p className="text-muted-foreground">{t('flashcards.pageSubtitle')}</p>
        </div>

        <FlashcardStack
          flashcards={flashcards}
          onComplete={handleComplete}
          onReview={handleReview}
        />
      </div>
    </div>
  )
}

export default function FlashcardsPage() {
  const { t } = useTranslation('taktis')

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>{t('flashcards.loading')}</p>
      </div>
    }>
      <FlashcardsContent />
    </Suspense>
  )
}
