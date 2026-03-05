/**
 * Flashcard SM-2 Scheduling Logic
 *
 * Pure function implementing a modified SM-2 spaced repetition algorithm.
 * Maps 4 mastery responses (forgot/hard/good/easy) to interval + ease updates.
 *
 * @see Blueprint §7.9 (Flashcard SM-2 Scheduling)
 * @see V3-T-014
 */

export type MasteryResponse = "forgot" | "hard" | "good" | "easy"

export interface FlashcardState {
  ease_factor: number
  interval_days: number
  reps: number
  due_at: string // ISO timestamp
  mastery_bucket: MasteryResponse
  total_reviews: number
  last_reviewed_at: string | null
}

export interface FlashcardStateUpdate extends FlashcardState {}

const MIN_EASE = 1.3

/**
 * Compute the next flashcard state after a user response.
 *
 * Algorithm per response:
 * - Forgot: reps=0, interval=0, ease-=0.2 (min 1.3), due=now+10min
 * - Hard:   reps++, interval*=1.2 (min 1), ease-=0.15 (min 1.3), due=now+interval days
 * - Good:   reps++, interval=(1 if reps==1, 3 if reps==2, else interval*ease), due=now+interval days
 * - Easy:   reps++, interval*=(ease+0.3) (min 1), ease+=0.15, due=now+interval days
 *
 * @param current - current flashcard state
 * @param response - user's mastery response
 * @param now - optional: override current time (for testing)
 * @returns updated flashcard state
 */
export function updateFlashcardState(
  current: FlashcardState,
  response: MasteryResponse,
  now?: Date,
): FlashcardStateUpdate {
  const reviewTime = now ?? new Date()
  const nowIso = reviewTime.toISOString()

  let { ease_factor, interval_days, reps } = current
  const total_reviews = current.total_reviews + 1

  switch (response) {
    case "forgot": {
      reps = 0
      interval_days = 0
      ease_factor = Math.max(MIN_EASE, ease_factor - 0.2)
      // Due in 10 minutes
      const dueDate = new Date(reviewTime.getTime() + 10 * 60 * 1000)
      return {
        ease_factor: round2(ease_factor),
        interval_days,
        reps,
        due_at: dueDate.toISOString(),
        mastery_bucket: "forgot",
        total_reviews,
        last_reviewed_at: nowIso,
      }
    }

    case "hard": {
      reps += 1
      interval_days = Math.max(1, Math.round(interval_days * 1.2))
      ease_factor = Math.max(MIN_EASE, ease_factor - 0.15)
      const dueDate = addDays(reviewTime, interval_days)
      return {
        ease_factor: round2(ease_factor),
        interval_days,
        reps,
        due_at: dueDate.toISOString(),
        mastery_bucket: "hard",
        total_reviews,
        last_reviewed_at: nowIso,
      }
    }

    case "good": {
      reps += 1
      if (reps === 1) {
        interval_days = 1
      } else if (reps === 2) {
        interval_days = 3
      } else {
        interval_days = Math.round(interval_days * ease_factor)
      }
      // ease stays unchanged for "good"
      const dueDate = addDays(reviewTime, interval_days)
      return {
        ease_factor: round2(ease_factor),
        interval_days,
        reps,
        due_at: dueDate.toISOString(),
        mastery_bucket: "good",
        total_reviews,
        last_reviewed_at: nowIso,
      }
    }

    case "easy": {
      reps += 1
      interval_days = Math.max(
        1,
        Math.round(interval_days * (ease_factor + 0.3)),
      )
      ease_factor += 0.15
      const dueDate = addDays(reviewTime, interval_days)
      return {
        ease_factor: round2(ease_factor),
        interval_days,
        reps,
        due_at: dueDate.toISOString(),
        mastery_bucket: "easy",
        total_reviews,
        last_reviewed_at: nowIso,
      }
    }
  }
}

/** Round to 2 decimal places */
function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Add days to a date */
function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime())
  result.setDate(result.getDate() + days)
  return result
}
