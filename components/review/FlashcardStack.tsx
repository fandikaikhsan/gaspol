"use client"

/**
 * FlashcardStack Component — SM-2 Integrated
 *
 * Shows cards one at a time: front → "Show Answer" → back → 4 mastery buttons.
 * Calls POST /api/flashcard-review on each response.
 *
 * @see V3-T-017
 * Fixes B-004 (hardcoded labels), B-005 (button overflow)
 */

import { useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { MasteryResponse } from "@/lib/assessment/flashcard-sm2"

interface MaterialCard {
  id: string
  skill_id: string
  title: string
  core_idea: string | null
  key_facts: string[] | null
}

interface ReviewCard {
  id: string
  skill_id: string
  mastery_bucket: string
  material?: MaterialCard
}

interface FlashcardStackProps {
  cards: ReviewCard[]
  onComplete?: () => void
}

const MASTERY_BUTTONS: {
  value: MasteryResponse
  label: string
  className: string
}[] = [
  {
    value: "forgot",
    label: "Lupa",
    className: "bg-red-500 hover:bg-red-600 text-white",
  },
  {
    value: "hard",
    label: "Sulit",
    className: "bg-orange-500 hover:bg-orange-600 text-white",
  },
  {
    value: "good",
    label: "Baik",
    className: "bg-blue-500 hover:bg-blue-600 text-white",
  },
  {
    value: "easy",
    label: "Mudah",
    className: "bg-green-600 hover:bg-green-700 text-white",
  },
]

export function FlashcardStack({ cards, onComplete }: FlashcardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [animating, setAnimating] = useState<MasteryResponse | null>(null)

  const currentCard = cards[currentIndex]
  const progress =
    cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0

  const handleResponse = useCallback(
    async (response: MasteryResponse) => {
      if (isSubmitting || !currentCard) return
      setIsSubmitting(true)
      setAnimating(response)

      try {
        await fetch("/api/flashcard-review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            skill_id: currentCard.skill_id,
            response,
          }),
        })
      } catch (err) {
        console.error("[FlashcardStack] API error:", err)
      }

      // Animate then advance
      setTimeout(() => {
        setAnimating(null)
        if (currentIndex < cards.length - 1) {
          setCurrentIndex(currentIndex + 1)
          setShowAnswer(false)
        } else {
          onComplete?.()
        }
        setIsSubmitting(false)
      }, 400)
    },
    [currentCard, currentIndex, cards.length, isSubmitting, onComplete],
  )

  if (!currentCard || cards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-2xl mb-4">✅</p>
        <p className="text-lg font-semibold mb-2">
          Tidak ada kartu untuk review
        </p>
        <p className="text-muted-foreground">Semua kartu sudah diperbarui!</p>
      </div>
    )
  }

  // Card content from material_cards
  const frontText = currentCard.material?.title ?? "Flashcard"
  const backParts: string[] = []
  if (currentCard.material?.core_idea) {
    backParts.push(currentCard.material.core_idea)
  }
  if (currentCard.material?.key_facts?.length) {
    backParts.push(currentCard.material.key_facts.join("\n• "))
  }
  const backText = backParts.length > 0 ? backParts.join("\n\n") : "—"

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="font-semibold">
            Kartu {currentIndex + 1} dari {cards.length}
          </span>
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
        className={`transition-all duration-300 ${
          animating ? "scale-95 opacity-70" : ""
        }`}
      >
        <Card className="min-h-[320px] border-2 border-border shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] rounded-2xl">
          <CardContent className="h-full flex flex-col items-center justify-center p-8 text-center">
            {!showAnswer ? (
              <>
                {/* FRONT */}
                <p className="text-2xl font-bold mb-6">{frontText}</p>
                <Button
                  variant="brutal"
                  size="lg"
                  onClick={() => setShowAnswer(true)}
                >
                  Tampilkan Jawaban
                </Button>
              </>
            ) : (
              <>
                {/* BACK */}
                <p className="text-sm text-muted-foreground mb-2 font-medium">
                  {frontText}
                </p>
                <div className="text-lg leading-relaxed whitespace-pre-line">
                  {backText}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4 Mastery buttons (visible after show answer) */}
      {showAnswer && (
        <div className="space-y-3">
          <p className="text-sm text-center text-muted-foreground font-medium">
            Seberapa ingat kamu?
          </p>
          <div className="flex gap-2">
            {MASTERY_BUTTONS.map((btn) => (
              <Button
                key={btn.value}
                className={`flex-1 min-w-0 ${btn.className}`}
                disabled={isSubmitting}
                onClick={() => handleResponse(btn.value)}
              >
                {btn.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Skip / back controls */}
      <div className="flex gap-4">
        <Button
          variant="brutal-outline"
          className="flex-1"
          disabled={currentIndex === 0 || isSubmitting}
          onClick={() => {
            if (currentIndex > 0) {
              setCurrentIndex(currentIndex - 1)
              setShowAnswer(false)
            }
          }}
        >
          Sebelumnya
        </Button>
        <Button
          variant="brutal-outline"
          className="flex-1"
          disabled={isSubmitting}
          onClick={() => {
            if (currentIndex < cards.length - 1) {
              setCurrentIndex(currentIndex + 1)
              setShowAnswer(false)
            } else {
              onComplete?.()
            }
          }}
        >
          {currentIndex === cards.length - 1 ? "Selesai" : "Lewati"}
        </Button>
      </div>
    </div>
  )
}
