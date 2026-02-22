"use client"

/**
 * Flashcards Page
 * Phase 6: Taktis Learning Mode
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { FlashcardStack } from "@/components/taktis/FlashcardStack"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function FlashcardsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [flashcards, setFlashcards] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFlashcards = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

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

  const handleComplete = () => {
    toast({
      title: "Great work! 🎉",
      description: "Flashcard session complete",
    })
    router.push('/plan')
  }

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <p>Loading flashcards...</p>
    </div>
  }

  if (flashcards.length === 0) {
    return <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-2xl mb-4">📚</p>
        <p className="text-lg font-semibold mb-2">No flashcards available</p>
        <p className="text-muted-foreground mb-6">
          Flashcards will be added soon
        </p>
        <Button onClick={() => router.push('/plan')}>
          Back to Plan
        </Button>
      </div>
    </div>
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Flashcards 🗂️</h1>
          <p className="text-muted-foreground">Quick review with flip cards</p>
        </div>

        <FlashcardStack
          flashcards={flashcards}
          onComplete={handleComplete}
        />
      </div>
    </div>
  )
}
