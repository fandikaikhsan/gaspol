# Gaspol Scoring System — Guideline

**Source of truth** for score hierarchy, relationships, and user-facing meaning.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Hierarchy](#2-hierarchy)
3. [Score Domains](#3-score-domains)
4. [Top-Level: Readiness](#4-top-level-readiness)
5. [Relationships & Flow](#5-relationships--flow)
6. [User-Facing Meaning](#6-user-facing-meaning)
7. [Thresholds Summary](#7-thresholds-summary)

---

## 1. Overview

Gaspol uses a multi-layered scoring system:

- **Skill-level** metrics (accuracy, points, coverage) — per micro-skill
- **Construct-level** metrics — cognitive dimensions (teliti, speed, reasoning, etc.)
- **Readiness** — single 0–100 score representing overall exam readiness

Readiness is the top-level metric that combines skill and construct data into one user-facing answer: *"Am I ready for the exam?"*

---

## 2. Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TOP: READINESS SCORE (0–100)                      │
│            Overall exam readiness: "Am I ready for the exam?"             │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
          ▼                           ▼                           ▼
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│   SKILL DOMAIN      │   │  CONSTRUCT DOMAIN   │   │  MODULE DOMAIN      │
│   (content mastery) │   │  (cognitive style)  │   │  (single session)   │
└─────────────────────┘   └─────────────────────┘   └─────────────────────┘
          │                           │                           │
          ▼                           ▼                           ▼
  Coverage + Accuracy          5 constructs              Module score
  (per micro-skill)            (profile)                 (pass/fail 70%)
```

---

## 3. Score Domains

### A. Skill Domain (Content Mastery)

Answers: *"Which topics have I mastered? Which are weak?"*

| Level | Unit | What It Represents | Stored In |
|-------|------|--------------------|-----------|
| **Points** | Per correct answer | L1→1pt, L2→2pt, L3→5pt | `attempts.points_awarded`, `user_skill_state.total_points` |
| **Coverage** | Per micro-skill | `total_points ≥ 20` = skill "covered" | `user_skill_state.is_covered` (generated) |
| **Accuracy** | Per micro-skill | `correct_count / attempt_count × 100` (0–100) | `user_skill_state.accuracy` |
| **Weak skills** | Subset | Skills with `accuracy < 70` and `attempt_count ≥ 3` | Computed by `get_top_weak_skills` |

**Point values by difficulty:**

| Difficulty | Code | Points (on correct answer) |
|------------|------|----------------------------|
| Easy | L1 | 1 |
| Medium | L2 | 2 |
| Hard/HOTS | L3 | 5 |

**Coverage rules (by taxonomy level):**

| Level | Node Type | Coverage Criteria |
|-------|-----------|-------------------|
| 5 | Micro-skill | `total_points ≥ 20` |
| 4 | Subtopic | All child micro-skills covered |
| 3 | Topic | All child subtopics covered |

### B. Construct Domain (Cognitive Profile)

Answers: *"How do I perform along cognitive dimensions (carefulness, speed, reasoning, etc.)?"*

| Item | Description |
|------|-------------|
| **5 constructs** | Teliti (attention), Speed, Reasoning, Computation, Reading |
| **Score range** | 0–100 per construct (starts at 50 = neutral) |
| **Update** | Each attempt updates constructs via question `construct_weights` + difficulty |

**Storage:** `user_construct_state` (one row per user × construct)

### C. Module Domain (Session Result)

Answers: *"Did I pass this drill/session?"*

| Item | Description |
|------|-------------|
| **Module score** | `correctAnswers / totalQuestions` (0–100) |
| **Pass threshold** | 70% (default, configurable per module) |
| **Pass** | Score ≥ threshold |

---

## 4. Top-Level: Readiness

Readiness is the single 0–100 score that answers: *"Am I ready for the exam?"*

### DB Formula (`get_user_readiness_score`)

```
Readiness = 0.4 × construct_avg + 0.4 × mastery_avg + 0.2 × coverage
```

- **construct_avg** — average of 5 construct scores
- **mastery_avg** — average of `user_skill_state.accuracy` (0–100) for skills with `attempt_count ≥ 3`
- **coverage** — % of micro-skills with `attempt_count > 0`

### Client Formula (`lib/analytics/readiness-score.ts`)

When using snapshot-based metrics:

```
Readiness = 0.4 × accuracy + 0.25 × speed_index + 0.2 × stability + 0.15 × coverage
```

### Readiness Grades

| Grade | Score Range | User Meaning |
|-------|-------------|--------------|
| Excellent | ≥ 80 | Ready for exam |
| Good | 65–79 | On track |
| Fair | 50–64 | Needs practice |
| Needs work | < 50 | Focus required |

---

## 5. Relationships & Flow

```
                    User answers question
                              │
                              ▼
              ┌───────────────────────────────┐
              │      submit-attempt           │
              └───────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
   user_skill_state    user_construct_state   attempts
   (per micro_skill)   (per construct)        (history)
          │                   │                   │
          │  • total_points   │  • score          │
          │  • accuracy       │  • trend          │
          │  • attempt_count  │                   │
          │                   │                   │
          └───────────────────┴───────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │   Readiness & Analytics       │
              │   • get_user_readiness_score  │
              │   • get_top_weak_skills       │
              │   • generate_analytics_       │
              │     snapshot                  │
              └───────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
     Plan generation    Re-cycle targeting    Analytics UI
     (uncovered skills) (weak skills)         (dashboard)
```

---

## 6. User-Facing Meaning

| Score / Concept | User Question | Where It Appears |
|-----------------|---------------|------------------|
| **Readiness** | "Am I ready for the exam?" | Analytics dashboard, Plan header |
| **Coverage** | "How much of the syllabus have I touched?" | Coverage map, Plan progress |
| **Accuracy** | "How well do I know each topic?" | Weak skills list, skill cards |
| **Points (X/20)** | "How close am I to mastering this skill?" | Skill cards, Plan tasks |
| **Constructs** | "What are my cognitive strengths/weaknesses?" | Radar chart, recommendations |
| **Module score** | "Did I pass this practice session?" | Drill result, Pembahasan screen |

---

## 7. Thresholds Summary

| Concept | Threshold | Meaning |
|---------|-----------|---------|
| Coverage | 20 points | Skill considered "covered" |
| Accuracy (weak) | < 70% | Skill flagged as weak |
| Accuracy (needs work) | < 60% | Triggers recommendations |
| Module pass | 70% | Default passing threshold |
| Construct weak | < 50 | Needs work |
| Construct developing | 50–69 | Developing |
| Construct strong | ≥ 70 | Strong |
| Min attempts for weak | 3 | Skills with insufficient data excluded |
| Readiness excellent | ≥ 80 | Ready for exam |
| Readiness good | 65–79 | On track |
| Readiness fair | 50–64 | Needs practice |
| Readiness needs work | < 50 | Focus required |

---

## Related Files

| File | Purpose |
|------|---------|
| `lib/analytics/readiness-score.ts` | Client-side readiness calculation |
| `lib/assessment/scoring.ts` | Point values, correctness checks, construct impact |
| `app/api/submit-attempt/route.ts` | Updates skill/construct state on each answer |
| `supabase/migrations/015_mastery_calculation_engine.sql` | `calculate_mastery_score`, `get_user_readiness_score` |
| `supabase/migrations/027_fix_analytics_pipeline.sql` | `get_top_weak_skills`, readiness formula |
