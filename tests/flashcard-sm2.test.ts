/**
 * Unit tests for SM-2 flashcard scheduling logic.
 * @see V3-T-014
 */

import { describe, it, expect } from "vitest"
import {
  updateFlashcardState,
  type FlashcardState,
  type MasteryResponse,
} from "@/lib/assessment/flashcard-sm2"

const NOW = new Date("2025-01-15T10:00:00.000Z")

function makeState(overrides: Partial<FlashcardState> = {}): FlashcardState {
  return {
    ease_factor: 2.5,
    interval_days: 0,
    reps: 0,
    due_at: NOW.toISOString(),
    mastery_bucket: "forgot",
    total_reviews: 0,
    last_reviewed_at: null,
    ...overrides,
  }
}

describe("updateFlashcardState", () => {
  // ──────────────── FORGOT ────────────────

  describe("forgot response", () => {
    it("resets reps and interval, reduces ease, due in 10min", () => {
      const state = makeState({ reps: 3, interval_days: 10, ease_factor: 2.5 })
      const result = updateFlashcardState(state, "forgot", NOW)

      expect(result.reps).toBe(0)
      expect(result.interval_days).toBe(0)
      expect(result.ease_factor).toBe(2.3)
      expect(result.mastery_bucket).toBe("forgot")
      expect(result.total_reviews).toBe(1)

      // Due = now + 10 minutes
      const due = new Date(result.due_at)
      expect(due.getTime() - NOW.getTime()).toBe(10 * 60 * 1000)
    })

    it("clamps ease_factor at minimum 1.3", () => {
      const state = makeState({ ease_factor: 1.35 })
      const result = updateFlashcardState(state, "forgot", NOW)

      expect(result.ease_factor).toBe(1.3)
    })

    it("works on a card that was already forgotten (reps already 0)", () => {
      const state = makeState({ reps: 0, interval_days: 0, ease_factor: 1.5 })
      const result = updateFlashcardState(state, "forgot", NOW)

      expect(result.reps).toBe(0)
      expect(result.interval_days).toBe(0)
      expect(result.ease_factor).toBe(1.3)
    })
  })

  // ──────────────── HARD ────────────────

  describe("hard response", () => {
    it("increments reps, multiplies interval by 1.2, reduces ease", () => {
      const state = makeState({
        reps: 2,
        interval_days: 10,
        ease_factor: 2.5,
      })
      const result = updateFlashcardState(state, "hard", NOW)

      expect(result.reps).toBe(3)
      expect(result.interval_days).toBe(12) // round(10 * 1.2)
      expect(result.ease_factor).toBe(2.35) // 2.5 - 0.15
      expect(result.mastery_bucket).toBe("hard")
    })

    it("clamps interval to minimum 1 day", () => {
      const state = makeState({ reps: 0, interval_days: 0, ease_factor: 2.5 })
      const result = updateFlashcardState(state, "hard", NOW)

      expect(result.interval_days).toBe(1) // max(1, round(0 * 1.2))
    })

    it("clamps ease at minimum 1.3", () => {
      const state = makeState({ ease_factor: 1.4 })
      const result = updateFlashcardState(state, "hard", NOW)

      expect(result.ease_factor).toBe(1.3) // max(1.3, 1.4 - 0.15)
    })

    it("sets due_at correctly based on interval", () => {
      const state = makeState({
        reps: 2,
        interval_days: 5,
        ease_factor: 2.5,
      })
      const result = updateFlashcardState(state, "hard", NOW)

      // interval = round(5 * 1.2) = 6
      const expected = new Date(NOW)
      expected.setDate(expected.getDate() + 6)
      expect(new Date(result.due_at).toISOString()).toBe(expected.toISOString())
    })
  })

  // ──────────────── GOOD ────────────────

  describe("good response", () => {
    it("first review: interval = 1 day", () => {
      const state = makeState({ reps: 0, interval_days: 0, ease_factor: 2.5 })
      const result = updateFlashcardState(state, "good", NOW)

      expect(result.reps).toBe(1)
      expect(result.interval_days).toBe(1)
      expect(result.ease_factor).toBe(2.5) // unchanged
      expect(result.mastery_bucket).toBe("good")
    })

    it("second review: interval = 3 days", () => {
      const state = makeState({ reps: 1, interval_days: 1, ease_factor: 2.5 })
      const result = updateFlashcardState(state, "good", NOW)

      expect(result.reps).toBe(2)
      expect(result.interval_days).toBe(3)
    })

    it("third review: interval = interval * ease", () => {
      const state = makeState({ reps: 2, interval_days: 3, ease_factor: 2.5 })
      const result = updateFlashcardState(state, "good", NOW)

      expect(result.reps).toBe(3)
      expect(result.interval_days).toBe(8) // round(3 * 2.5) = 7.5 → 8
    })

    it("subsequent review with custom ease", () => {
      const state = makeState({ reps: 3, interval_days: 8, ease_factor: 2.0 })
      const result = updateFlashcardState(state, "good", NOW)

      expect(result.reps).toBe(4)
      expect(result.interval_days).toBe(16) // round(8 * 2.0)
    })
  })

  // ──────────────── EASY ────────────────

  describe("easy response", () => {
    it("multiplies interval by (ease + 0.3), increases ease", () => {
      const state = makeState({
        reps: 2,
        interval_days: 3,
        ease_factor: 2.5,
      })
      const result = updateFlashcardState(state, "easy", NOW)

      expect(result.reps).toBe(3)
      expect(result.interval_days).toBe(8) // round(3 * (2.5 + 0.3)) = round(8.4) = 8
      expect(result.ease_factor).toBe(2.65) // 2.5 + 0.15
      expect(result.mastery_bucket).toBe("easy")
    })

    it("clamps interval to minimum 1 day from 0", () => {
      const state = makeState({ reps: 0, interval_days: 0, ease_factor: 2.5 })
      const result = updateFlashcardState(state, "easy", NOW)

      expect(result.interval_days).toBe(1) // max(1, round(0 * 2.8))
    })

    it("ease continuously increases with easy", () => {
      let state = makeState({ reps: 1, interval_days: 1, ease_factor: 2.5 })
      state = updateFlashcardState(state, "easy", NOW)
      expect(state.ease_factor).toBe(2.65)

      state = updateFlashcardState(state, "easy", NOW)
      expect(state.ease_factor).toBe(2.8)
    })
  })

  // ──────────────── CROSS-CUTTING ────────────────

  describe("cross-cutting behaviors", () => {
    it("always increments total_reviews", () => {
      const state = makeState({ total_reviews: 5 })
      const responses: MasteryResponse[] = ["forgot", "hard", "good", "easy"]

      responses.forEach((response) => {
        const result = updateFlashcardState(state, response, NOW)
        expect(result.total_reviews).toBe(6)
      })
    })

    it("always sets last_reviewed_at to now", () => {
      const state = makeState()
      const result = updateFlashcardState(state, "good", NOW)
      expect(result.last_reviewed_at).toBe(NOW.toISOString())
    })

    it("handles a full lifecycle: forgot → good → good → easy", () => {
      let state = makeState()
      const t0 = new Date("2025-01-15T10:00:00.000Z")

      // 1) Forgot → reps=0, interval=0, ease=2.3
      state = updateFlashcardState(state, "forgot", t0)
      expect(state.reps).toBe(0)
      expect(state.ease_factor).toBe(2.3)
      expect(state.mastery_bucket).toBe("forgot")

      // 2) Good → reps=1, interval=1
      const t1 = new Date("2025-01-15T10:10:00.000Z")
      state = updateFlashcardState(state, "good", t1)
      expect(state.reps).toBe(1)
      expect(state.interval_days).toBe(1)
      expect(state.mastery_bucket).toBe("good")

      // 3) Good → reps=2, interval=3
      const t2 = new Date("2025-01-16T10:00:00.000Z")
      state = updateFlashcardState(state, "good", t2)
      expect(state.reps).toBe(2)
      expect(state.interval_days).toBe(3)

      // 4) Easy → reps=3, interval=round(3*(2.3+0.3))=round(7.8)=8, ease=2.45
      const t3 = new Date("2025-01-19T10:00:00.000Z")
      state = updateFlashcardState(state, "easy", t3)
      expect(state.reps).toBe(3)
      expect(state.interval_days).toBe(8)
      expect(state.ease_factor).toBe(2.45)
      expect(state.mastery_bucket).toBe("easy")
      expect(state.total_reviews).toBe(4)
    })

    it("uses current time when no now parameter provided", () => {
      const state = makeState()
      const before = Date.now()
      const result = updateFlashcardState(state, "good")
      const after = Date.now()

      const dueMs = new Date(result.due_at).getTime()
      // due_at should be ~1 day from now
      expect(dueMs).toBeGreaterThanOrEqual(before + 24 * 60 * 60 * 1000 - 1000)
      expect(dueMs).toBeLessThanOrEqual(after + 24 * 60 * 60 * 1000 + 1000)
    })
  })
})
