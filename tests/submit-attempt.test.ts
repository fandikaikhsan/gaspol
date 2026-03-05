/**
 * Unit Tests: Scoring Logic (T-018)
 *
 * Tests all point calculation, correctness checking, construct impact,
 * error tag derivation, and pass/fail logic.
 */

import { describe, it, expect } from "vitest"
import {
  getPointValue,
  calculatePointsAwarded,
  checkMCQCorrectness,
  checkMCKCorrectness,
  checkFillInCorrectness,
  checkCorrectness,
  calculateConstructImpact,
  calculateAllConstructImpacts,
  computeNewConstructScore,
  determineTrend,
  checkModulePassFail,
  deriveErrorTags,
} from "@/lib/assessment/scoring"

// ============================================================
// T-014: Point value calculation
// ============================================================
describe("getPointValue", () => {
  it("L1 → 1 point", () => {
    expect(getPointValue("L1")).toBe(1)
  })

  it("L2 → 2 points", () => {
    expect(getPointValue("L2")).toBe(2)
  })

  it("L3 → 5 points", () => {
    expect(getPointValue("L3")).toBe(5)
  })

  it("null → 0 points", () => {
    expect(getPointValue(null)).toBe(0)
  })

  it("unknown string → 0 points", () => {
    expect(getPointValue("invalid")).toBe(0)
  })
})

describe("calculatePointsAwarded", () => {
  it("correct L1 answer → 1 point", () => {
    expect(calculatePointsAwarded(true, 1, "L1")).toBe(1)
  })

  it("correct L2 answer → 2 points", () => {
    expect(calculatePointsAwarded(true, 2, "L2")).toBe(2)
  })

  it("correct L3 answer → 5 points", () => {
    expect(calculatePointsAwarded(true, 5, "L3")).toBe(5)
  })

  it("incorrect answer → 0 points (any difficulty)", () => {
    expect(calculatePointsAwarded(false, 1, "L1")).toBe(0)
    expect(calculatePointsAwarded(false, 2, "L2")).toBe(0)
    expect(calculatePointsAwarded(false, 5, "L3")).toBe(0)
  })

  it("correct with null point_value → falls back to difficulty", () => {
    expect(calculatePointsAwarded(true, null, "L3")).toBe(5)
    expect(calculatePointsAwarded(true, null, "L1")).toBe(1)
  })

  it("correct with null point_value and null difficulty → 0", () => {
    expect(calculatePointsAwarded(true, null, null)).toBe(0)
  })
})

// ============================================================
// Correctness checking
// ============================================================
describe("checkMCQCorrectness", () => {
  it("exact match (same case)", () => {
    expect(checkMCQCorrectness("A", "A")).toBe(true)
  })

  it("case-insensitive match", () => {
    expect(checkMCQCorrectness("a", "A")).toBe(true)
    expect(checkMCQCorrectness("B", "b")).toBe(true)
  })

  it("different answers", () => {
    expect(checkMCQCorrectness("A", "B")).toBe(false)
  })

  it("non-string selected answer", () => {
    expect(checkMCQCorrectness(null, "A")).toBe(false)
    expect(checkMCQCorrectness(123, "A")).toBe(false)
  })

  it("non-string correct answer", () => {
    expect(checkMCQCorrectness("A", null)).toBe(false)
  })
})

describe("checkMCKCorrectness", () => {
  it("matching arrays", () => {
    expect(checkMCKCorrectness(["A", "C"], ["A", "C"])).toBe(true)
  })

  it("matching arrays different order", () => {
    expect(checkMCKCorrectness(["C", "A"], ["A", "C"])).toBe(true)
  })

  it("mismatched arrays", () => {
    expect(checkMCKCorrectness(["A", "B"], ["A", "C"])).toBe(false)
  })

  it("correct answer as comma-separated string", () => {
    expect(checkMCKCorrectness(["A", "C"], "A,C")).toBe(true)
    expect(checkMCKCorrectness(["C", "A"], "A, C")).toBe(true)
  })

  it("non-array selected answer", () => {
    expect(checkMCKCorrectness("A", ["A"])).toBe(false)
  })
})

describe("checkFillInCorrectness", () => {
  it("exact match", () => {
    expect(checkFillInCorrectness("42", "42")).toBe(true)
  })

  it("case-insensitive + trim", () => {
    expect(checkFillInCorrectness("  Hello World  ", "hello world")).toBe(true)
  })

  it("normalized whitespace", () => {
    expect(checkFillInCorrectness("hello   world", "hello world")).toBe(true)
  })

  it("different answers", () => {
    expect(checkFillInCorrectness("42", "43")).toBe(false)
  })

  it("non-string inputs", () => {
    expect(checkFillInCorrectness(42, "42")).toBe(false)
    expect(checkFillInCorrectness("42", null)).toBe(false)
  })
})

describe("checkCorrectness (format dispatch)", () => {
  it("MCQ format", () => {
    expect(checkCorrectness("MCQ5", "A", "A")).toBe(true)
    expect(checkCorrectness("MCQ4", "A", "B")).toBe(false)
  })

  it("MCK format", () => {
    expect(checkCorrectness("MCK-Table", ["A", "C"], ["A", "C"])).toBe(true)
  })

  it("Fill-in format", () => {
    expect(checkCorrectness("Fill-in", "42", "42")).toBe(true)
  })

  it("TF format", () => {
    expect(checkCorrectness("TF", "True", "true")).toBe(true)
    expect(checkCorrectness("TF", "False", "True")).toBe(false)
  })
})

// ============================================================
// T-016: Construct impact calculation
// ============================================================
describe("calculateConstructImpact", () => {
  it("correct L1 with weight 0.5 → positive impact", () => {
    const impact = calculateConstructImpact(true, 0.5, "L1")
    expect(impact).toBeGreaterThan(0)
    expect(impact).toBe(1.75) // 0.5 * 5 * 0.7 = 1.75
  })

  it("correct L2 with weight 1.0 → larger positive impact", () => {
    const impact = calculateConstructImpact(true, 1.0, "L2")
    expect(impact).toBe(5.0) // 1.0 * 5 * 1.0 = 5.0
  })

  it("correct L3 with weight 0.8 → largest impact", () => {
    const impact = calculateConstructImpact(true, 0.8, "L3")
    expect(impact).toBe(6.0) // 0.8 * 5 * 1.5 = 6.0
  })

  it("incorrect → negative impact (half magnitude)", () => {
    const impact = calculateConstructImpact(false, 1.0, "L2")
    expect(impact).toBe(-2.5) // -1.0 * 5 * 1.0 * 0.5 = -2.5
  })

  it("zero weight → zero impact", () => {
    expect(calculateConstructImpact(true, 0, "L1")).toBe(0)
    expect(calculateConstructImpact(false, 0, "L1")).toBe(0)
  })
})

describe("calculateAllConstructImpacts", () => {
  it("returns impacts for all weighted constructs", () => {
    const weights = {
      teliti: 0.3,
      speed: 0.7,
      reasoning: 0,
      computation: 0,
      reading: 0,
    }
    const impacts = calculateAllConstructImpacts(true, weights, "L2")
    expect(impacts.teliti).toBe(1.5) // 0.3 * 5 * 1.0
    expect(impacts.speed).toBe(3.5) // 0.7 * 5 * 1.0
    expect(impacts.reasoning).toBeUndefined()
  })

  it("null weights → empty impacts", () => {
    expect(calculateAllConstructImpacts(true, null, "L1")).toEqual({})
  })
})

describe("computeNewConstructScore", () => {
  it("first data point has high learning rate", () => {
    const newScore = computeNewConstructScore(50, 5, 1)
    expect(newScore).toBe(55) // 50 + 5 * (1/sqrt(1)) = 55
  })

  it("learning rate decreases with more data", () => {
    const score1 = computeNewConstructScore(50, 5, 1) // +5
    const score4 = computeNewConstructScore(50, 5, 4) // +2.5
    const score100 = computeNewConstructScore(50, 5, 100) // +0.5
    expect(score1).toBeGreaterThan(score4)
    expect(score4).toBeGreaterThan(score100)
  })

  it("clamps between 0 and 100", () => {
    expect(computeNewConstructScore(2, -10, 1)).toBe(0)
    expect(computeNewConstructScore(98, 10, 1)).toBe(100)
  })
})

describe("determineTrend", () => {
  it("positive delta > 0.5 → improving", () => {
    expect(determineTrend(1.5)).toBe("improving")
  })

  it("negative delta < -0.5 → declining", () => {
    expect(determineTrend(-1.5)).toBe("declining")
  })

  it("small delta → stable", () => {
    expect(determineTrend(0.3)).toBe("stable")
    expect(determineTrend(-0.3)).toBe("stable")
    expect(determineTrend(0)).toBe("stable")
  })
})

// ============================================================
// T-019: Pass/fail threshold
// ============================================================
describe("checkModulePassFail", () => {
  it("70% threshold: 7/10 → pass", () => {
    const result = checkModulePassFail(7, 10, 0.7)
    expect(result.passed).toBe(true)
    expect(result.scoreRatio).toBe(0.7)
  })

  it("70% threshold: 6/10 → fail", () => {
    const result = checkModulePassFail(6, 10, 0.7)
    expect(result.passed).toBe(false)
    expect(result.scoreRatio).toBe(0.6)
  })

  it("100% score → pass", () => {
    const result = checkModulePassFail(10, 10, 0.7)
    expect(result.passed).toBe(true)
    expect(result.scoreRatio).toBe(1)
  })

  it("0% score → fail", () => {
    const result = checkModulePassFail(0, 10, 0.7)
    expect(result.passed).toBe(false)
    expect(result.scoreRatio).toBe(0)
  })

  it("custom threshold: 80%", () => {
    expect(checkModulePassFail(8, 10, 0.8).passed).toBe(true)
    expect(checkModulePassFail(7, 10, 0.8).passed).toBe(false)
  })

  it("0 total questions → fail", () => {
    const result = checkModulePassFail(0, 0, 0.7)
    expect(result.passed).toBe(false)
    expect(result.scoreRatio).toBe(0)
  })

  it("default threshold is 70%", () => {
    const result = checkModulePassFail(7, 10)
    expect(result.passed).toBe(true)
  })
})

// ============================================================
// T-017: Error tag derivation
// ============================================================
describe("deriveErrorTags", () => {
  it("slow answer → ERR.SLOW tag", () => {
    const tags = deriveErrorTags(true, 200, 100)
    expect(tags).toContainEqual({ tag_id: "ERR.SLOW", confidence: 1.0 })
  })

  it("rushed answer → ERR.RUSHED tag", () => {
    const tags = deriveErrorTags(true, 10, 100)
    expect(tags).toContainEqual({ tag_id: "ERR.RUSHED", confidence: 1.0 })
  })

  it("incorrect + fast → ERR.CARELESS", () => {
    const tags = deriveErrorTags(false, 50, 100)
    expect(tags).toContainEqual({ tag_id: "ERR.CARELESS", confidence: 0.8 })
  })

  it("incorrect + slow → ERR.STRUGGLE", () => {
    const tags = deriveErrorTags(false, 150, 100)
    expect(tags).toContainEqual({ tag_id: "ERR.STRUGGLE", confidence: 0.8 })
  })

  it("correct answer in normal time → no tags", () => {
    const tags = deriveErrorTags(true, 100, 100)
    expect(tags).toHaveLength(0)
  })

  it("incorrect with reading-heavy construct → ERR.READING", () => {
    const weights = {
      teliti: 0.1,
      speed: 0.1,
      reasoning: 0.1,
      computation: 0.1,
      reading: 0.8,
    }
    const tags = deriveErrorTags(false, 100, 100, weights)
    expect(tags).toContainEqual({ tag_id: "ERR.READING", confidence: 0.8 })
  })

  it("incorrect with computation-heavy construct → ERR.COMPUTATION", () => {
    const weights = {
      teliti: 0.1,
      speed: 0,
      reasoning: 0.2,
      computation: 0.5,
      reading: 0.1,
    }
    const tags = deriveErrorTags(false, 100, 100, weights)
    expect(tags).toContainEqual({ tag_id: "ERR.COMPUTATION", confidence: 0.5 })
  })

  it("correct answers do not get construct-based tags", () => {
    const weights = {
      teliti: 0.1,
      speed: 0.1,
      reasoning: 0.1,
      computation: 0.1,
      reading: 0.8,
    }
    const tags = deriveErrorTags(true, 100, 100, weights)
    expect(tags.filter((t) => t.tag_id.startsWith("ERR.R"))).toHaveLength(0)
  })

  it("construct weight below 0.3 threshold → no construct tag", () => {
    const weights = {
      teliti: 0.2,
      speed: 0.2,
      reasoning: 0.2,
      computation: 0.2,
      reading: 0.2,
    }
    const tags = deriveErrorTags(false, 100, 100, weights)
    const constructTags = tags.filter((t) =>
      [
        "ERR.ATTENTION",
        "ERR.SPEED",
        "ERR.REASONING",
        "ERR.COMPUTATION",
        "ERR.READING",
      ].includes(t.tag_id),
    )
    expect(constructTags).toHaveLength(0)
  })
})
