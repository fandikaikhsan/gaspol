"use client"

/**
 * MasteryStacks Component
 * Displays a 2×2 grid of mastery buckets with due/total counts.
 *
 * @see V3-T-016
 */

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import type { MasteryResponse } from "@/lib/assessment/flashcard-sm2"

interface FlashcardUserState {
  skill_id: string
  due_at: string
  mastery_bucket: string
}

interface MasteryStacksProps {
  flashcardStates: FlashcardUserState[]
  onStartReview: (bucket?: MasteryResponse) => void
}

interface BucketInfo {
  key: MasteryResponse
  label: string
  emoji: string
  color: string
  borderColor: string
  bgColor: string
}

const BUCKETS: BucketInfo[] = [
  {
    key: "forgot",
    label: "Lupa",
    emoji: "🔴",
    color: "text-red-700",
    borderColor: "border-red-300",
    bgColor: "bg-red-50",
  },
  {
    key: "hard",
    label: "Sulit",
    emoji: "🟠",
    color: "text-orange-700",
    borderColor: "border-orange-300",
    bgColor: "bg-orange-50",
  },
  {
    key: "good",
    label: "Baik",
    emoji: "🔵",
    color: "text-blue-700",
    borderColor: "border-blue-300",
    bgColor: "bg-blue-50",
  },
  {
    key: "easy",
    label: "Mudah",
    emoji: "🟢",
    color: "text-green-700",
    borderColor: "border-green-300",
    bgColor: "bg-green-50",
  },
]

export function MasteryStacks({
  flashcardStates,
  onStartReview,
}: MasteryStacksProps) {
  const now = useMemo(() => new Date().toISOString(), [])

  const stats = useMemo(() => {
    const result: Record<
      string,
      { total: number; due: number }
    > = {}

    for (const b of BUCKETS) {
      result[b.key] = { total: 0, due: 0 }
    }

    for (const state of flashcardStates) {
      const bucket = state.mastery_bucket as MasteryResponse
      if (!result[bucket]) continue
      result[bucket].total += 1
      if (state.due_at <= now) {
        result[bucket].due += 1
      }
    }

    return result
  }, [flashcardStates, now])

  const totalDue = useMemo(
    () => Object.values(stats).reduce((sum, s) => sum + s.due, 0),
    [stats],
  )

  return (
    <div className="space-y-6">
      {/* 2×2 Grid */}
      <div className="grid grid-cols-2 gap-4">
        {BUCKETS.map((bucket) => {
          const { total, due } = stats[bucket.key]

          return (
            <button
              key={bucket.key}
              onClick={() => due > 0 && onStartReview(bucket.key)}
              disabled={due === 0}
              className={`
                relative p-4 rounded-2xl border-2 transition-all
                ${bucket.borderColor} ${bucket.bgColor}
                ${due > 0 ? "cursor-pointer hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] active:translate-y-[1px]" : "opacity-60 cursor-default"}
              `}
            >
              {/* Stack visual */}
              <div className="flex justify-center mb-3">
                <StackVisual count={total} color={bucket.borderColor} />
              </div>

              {/* Label */}
              <p className={`text-lg font-bold ${bucket.color}`}>
                {bucket.emoji} {bucket.label}
              </p>

              {/* Counts */}
              <p className="text-sm text-muted-foreground mt-1">
                {due > 0 ? (
                  <>
                    <span className="font-semibold">{due} due</span>
                    {" / "}
                    {total} total
                  </>
                ) : (
                  <>{total} kartu</>
                )}
              </p>

              {/* Status */}
              <p className="text-xs text-muted-foreground mt-1">
                {due > 0
                  ? "Siap review"
                  : total > 0
                    ? "Belum due"
                    : "Kosong"}
              </p>
            </button>
          )
        })}
      </div>

      {/* Review All Due CTA */}
      <Button
        variant="brutal"
        size="lg"
        className="w-full"
        disabled={totalDue === 0}
        onClick={() => onStartReview()}
      >
        {totalDue > 0
          ? `Review Semua Due (${totalDue} kartu)`
          : "Tidak ada kartu yang due"}
      </Button>

      {/* Summary */}
      <p className="text-center text-sm text-muted-foreground">
        Total: {flashcardStates.length} kartu
        {totalDue > 0 && ` · ${totalDue} siap review`}
      </p>
    </div>
  )
}

/**
 * Visual stack of cards — empty / 3-layer / 5-layer based on count.
 */
function StackVisual({
  count,
  color,
}: {
  count: number
  color: string
}) {
  if (count === 0) {
    return (
      <div
        className={`w-16 h-10 rounded-lg border-2 border-dashed ${color} opacity-30`}
      />
    )
  }

  const layers = count >= 5 ? 3 : count >= 1 ? 2 : 1

  return (
    <div className="relative w-16 h-12">
      {Array.from({ length: layers }).map((_, i) => (
        <div
          key={i}
          className={`absolute rounded-lg border-2 ${color} bg-white`}
          style={{
            width: "100%",
            height: "70%",
            bottom: `${i * 4}px`,
            left: `${i * 2}px`,
            zIndex: layers - i,
          }}
        />
      ))}
    </div>
  )
}
