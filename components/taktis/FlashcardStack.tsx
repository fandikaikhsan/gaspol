"use client"

/**
 * FlashcardStack Component
 * Phase 6: Taktis Learning Mode
 */

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Flashcard {
  id: string
  front_text: string
  back_text: string
  front_image?: string
  back_image?: string
}

interface FlashcardStackProps {
  flashcards: Flashcard[]
  onComplete?: () => void
}

export function FlashcardStack({ flashcards, onComplete }: FlashcardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  const currentCard = flashcards[currentIndex]
  const progress = ((currentIndex + 1) / flashcards.length) * 100

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
    } else {
      onComplete?.()
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIsFlipped(false)
    }
  }

  if (!currentCard) return null

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="font-semibold">Card {currentIndex + 1} of {flashcards.length}</span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden border-2 border-border">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div
        className="relative h-96 cursor-pointer perspective-1000"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={`
            relative w-full h-full transition-transform duration-500 transform-style-3d
            ${isFlipped ? 'rotate-y-180' : ''}
          `}
        >
          {/* Front */}
          <Card className={`
            absolute inset-0 backface-hidden
            ${!isFlipped ? '' : 'invisible'}
          `}>
            <CardContent className="h-full flex flex-col items-center justify-center p-8 text-center">
              <p className="text-2xl font-bold mb-4">{currentCard.front_text}</p>
              <p className="text-sm text-muted-foreground">Tap to flip</p>
            </CardContent>
          </Card>

          {/* Back */}
          <Card className={`
            absolute inset-0 backface-hidden rotate-y-180 bg-primary/10
            ${isFlipped ? '' : 'invisible'}
          `}>
            <CardContent className="h-full flex flex-col items-center justify-center p-8 text-center">
              <p className="text-xl leading-relaxed">{currentCard.back_text}</p>
              <p className="text-sm text-muted-foreground mt-4">Tap to flip back</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        <Button
          variant="brutal-outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex-1"
        >
          ← Previous
        </Button>
        <Button
          variant="brutal"
          onClick={handleNext}
          className="flex-1"
        >
          {currentIndex === flashcards.length - 1 ? 'Finish' : 'Next →'}
        </Button>
      </div>
    </div>
  )
}
