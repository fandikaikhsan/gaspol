# Gaspol Project Blueprint v3

**Comprehensive Documentation for Project Recreation**

> ⚠️ **SOURCE OF TRUTH**: This document is the authoritative reference for all Gaspol product decisions, data models, and business logic. When in doubt, defer to this document.

- **Version:** 3.0
- **Updated on:** 2026-03-05
- **Derived from:** PROJECT_BLUEPRINT_v2.md (v2.1, 2026-03-03)

---

## Changelog / Delta vs v2

### Added Features

| ID    | Feature                                                                                                                                                        | Section    | Scope            |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------- |
| F-001 | Drill page restructure: two-tab layout (Topic-Based Modules + Mixed Drills), mandatory task pinning, accordion grouping by taxonomy levels, advanced filtering | §4.3, §5.5 | Student / Drill  |
| F-002 | Module Result page with pembahasan (answer review) flow                                                                                                        | §5.5, §5.1 | Student / Drill  |
| F-003 | Pembahasan page: per-question explanation with material card links                                                                                             | §5.7       | Student / Drill  |
| F-004 | Material Card drill & navigation button                                                                                                                        | §5.2       | Student / Review |
| F-005 | Tanya Gaspol AI chat feature with token quota                                                                                                                  | §5.8       | Student / Review |
| F-006 | Flashcard spaced repetition revamp (Anki-like SM-2 system with mastery stacks)                                                                                 | §5.9       | Student / Review |

### Behavior Changes / Clarifications

- Drill page is now a single route (`/drill`) replacing the old `/drill` + `/drill/drills` split.
- Module cards now clearly show assigned-as-task (⚠️), completed (✓), or default state.
- Questions in drill modules are not randomized; they follow admin-defined order.
- Retrying a completed module resets its completion status so progress is re-measured.
- Material Card CTA button is context-aware: shows "Drill This Skill" from Review, or "Back to Pembahasan" when opened from Pembahasan page.
- Flashcard forgot/hard/good/easy buttons now drive spaced repetition scheduling (SM-2 inspired).

### Known Bugs (from v2 audit)

| ID    | Bug                                                                                 | Status | Section |
| ----- | ----------------------------------------------------------------------------------- | ------ | ------- |
| B-001 | `/drill` and `/drill/drills` route redundancy                                       | Known  | §13     |
| B-002 | Filter labels show i18n keys ("filter.all", "filter.required", "filter.completed")  | Known  | §13     |
| B-003 | Answer check always returns wrong / 0 points — error: "Failed to save attempt"      | Known  | §13     |
| B-004 | Flashcard labels show i18n keys ("flashcards.cardOf", "flashcards.tapToFlip", etc.) | Known  | §13     |
| B-005 | Flashcard status buttons (forgot/hard/good/easy) overflow outside the page          | Known  | §13     |

### Spec Reorganizations

- New Section §5.7 (Pembahasan Page) added.
- New Section §5.8 (Tanya Gaspol AI Chat) added.
- Section §5.9 (Flashcard Spaced Repetition System) added as complete spec.
- Section §13 (Known Issues) added as structured bug-tracking section.
- Section §5.5 (Drill System) substantially rewritten for two-tab layout.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Context](#2-business-context)
3. [Product Definition](#3-product-definition)
4. [User Journeys](#4-user-journeys)
5. [Feature Specifications](#5-feature-specifications)
6. [Data Architecture](#6-data-architecture)
7. [Business Logic & Algorithms](#7-business-logic--algorithms)
8. [Technical Architecture](#8-technical-architecture)
9. [Forking for Other Content Types](#9-forking-for-other-content-types)
10. [AI Code Generation Prompt](#10-ai-code-generation-prompt)
11. [Appendix](#11-appendix)
12. [Version History](#12-version-history)
13. [Known Issues (as of v3)](#13-known-issues-as-of-v3)

---

## 1. Executive Summary

### 1.1 What is Gaspol?

Gaspol is a **mobile-first adaptive learning platform** designed for last-minute exam preparation. The platform combines **deep cognitive analytics**, **personalized study plans**, and an **AI-powered content pipeline** to maximize learning efficiency within constrained timeframes (calculated from exam date).

### 1.2 Core Value Proposition

**"Maximize exam readiness through personalized, data-driven preparation in limited time."**

The platform differentiates itself through:

1. **Cognitive Profiling** — Measures 5 cognitive constructs (Attention, Speed, Reasoning, Computation, Reading)
2. **Adaptive Learning** — Dynamically adjusts content based on real-time performance
3. **Complete Micro-skill Coverage** — Baseline tests ALL level-5 skills through topic-based modules
4. **Point-Based Mastery System** — Questions weighted by difficulty (Easy=1pt, Medium=2pt, Hard=5pt); 20 points = skill covered
5. **Material Cards** — Structured learning content (core idea, facts, common mistakes, examples) for every micro-skill
6. **Tanya Gaspol AI Chat** — Conversational AI that helps students understand concepts, scoped to material cards with a token budget
7. **Flashcard Spaced Repetition** — Anki-like SM-2 system with mastery stacks for long-term retention
8. **Campus-Targeted Readiness** — Score comparison against target university requirements
9. **Timeline-Based Journey** — Clear progression from baseline → plan → tasks → recycle → repeat
10. **Real-Time Profile Updates** — Every module completion updates user skill state and analytics
11. **Cost-Efficient AI** — Strategic AI usage for content ops and scoped student chat, not per-question diagnosis

### 1.3 Target Market (Current Implementation: UTBK)

- **Primary**: Indonesian high school students preparing for UTBK (university entrance exam)
- **Time Constraint**: Users with limited days until exam (auto-calculated from exam date)
- **Device**: 80%+ mobile traffic expected
- **Pain Point**: Limited time, overwhelming content, no personalized guidance

### 1.4 Core Concept: Point-Based Coverage System

The platform uses a **point-based system** to determine when a user has "covered" (understood) a micro-skill:

**Question Difficulty & Points:**

| Difficulty | Code | Description                  | Points (on correct answer) |
| ---------- | ---- | ---------------------------- | -------------------------- |
| Easy       | L1   | Recall, basic application    | 1 point                    |
| Medium     | L2   | Analysis, multi-step         | 2 points                   |
| Hard/HOTS  | L3   | Synthesis, complex reasoning | 5 points                   |

**Coverage Rules:**

| Level | Node Type   | Coverage Criteria                                |
| ----- | ----------- | ------------------------------------------------ |
| 5     | Micro-skill | User accumulated ≥20 points from correct answers |
| 4     | Subtopic    | ALL child micro-skills (level 5) are covered     |
| 3     | Topic       | ALL child subtopics (level 4) are covered        |

**Why This System?**

1. **Difficulty-Weighted Learning** — Hard questions prove deeper understanding, so they're worth more
2. **Multiple Paths to Coverage** — 20 easy, 10 medium, 4 hard, or any combination totaling ≥20
3. **Real Progress Tracking** — Partial progress (e.g., 15/20 pts) is visible and meaningful
4. **Fair Assessment** — Users can cover skills through their preferred difficulty level

**Real-Time Updates:**

Every answer submission immediately updates the user's skill profile. This ensures:

- The profile always reflects the user's **current** knowledge state
- Analytics are always up-to-date, not just checkpoint-based
- Plan generation uses the most recent data

---

## 2. Business Context

### 2.1 Market Opportunity

| Factor          | Details                                                        |
| --------------- | -------------------------------------------------------------- |
| **Market Size** | 1M+ UTBK test-takers annually in Indonesia                     |
| **Problem**     | Generic prep materials, no personalization                     |
| **Gap**         | No affordable adaptive learning platforms in Indonesian market |
| **Timing**      | Peak demand 1-2 months before exam dates                       |

### 2.2 Value Proposition Canvas

**Customer Jobs:**

- Prepare effectively with limited time
- Identify and fix weak areas quickly
- Build confidence before exam day
- Track improvement objectively
- Know if they can reach their target university

**Gains Created:**

- Personalized study plan (not one-size-fits-all)
- Clear progress metrics and readiness score compared to target campus
- Focused practice on weak areas with Material Cards
- AI chat for on-demand concept clarification (Tanya Gaspol)
- Flashcard spaced repetition for long-term retention
- Mobile-first for learning anywhere
- Timeline visibility from baseline to exam day

**Pains Relieved:**

- Information overload → curated, prioritized content
- Time anxiety → clear daily plan with countdown
- Uncertainty about progress → quantified readiness vs target campus
- Generic feedback → specific error pattern analysis + Material Cards
- "Am I ready?" anxiety → campus-specific readiness score
- "I don't understand this concept" → Tanya Gaspol AI chat

### 2.3 Business Model

| Revenue Stream        | Description                                         |
| --------------------- | --------------------------------------------------- |
| **Package Tiers**     | Time-based access calculated from exam date         |
| **Freemium**          | Free baseline + limited content, paid for full plan |
| **B2B**               | School/bimbel partnerships                          |
| **Content Licensing** | White-label platform for other exams                |

### 2.4 Competitive Advantages

1. **Campus-Targeted Analytics** — Know if you can reach your target university
2. **Complete Micro-skill Coverage** — Every skill tested and tracked
3. **Material Cards + AI Chat** — Structured learning content with conversational AI help
4. **Flashcard Spaced Repetition** — Anki-like mastery stacks for retention
5. **Adaptive Engine** — Plan adjusts based on performance
6. **Timeline Journey** — Clear progression visualization
7. **AI-Powered Content** — Scalable content generation
8. **Exam-Agnostic Architecture** — Replicable to any standardized test

---

## 3. Product Definition

### 3.1 Platform Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        GASPOL PLATFORM                       │
├─────────────────────────────────────────────────────────────┤
│  STUDENT PORTAL              │    ADMIN CONSOLE             │
│  ─────────────              │    ─────────────             │
│  • Plan (Timeline View)     │    • Exam Research (AI)      │
│  • Drill (Modules)          │    • Taxonomy Management     │
│    → Topic-Based Modules    │    • Question Generation     │
│    → Mixed Drills Modules   │    • Material Card Gen (AI)  │
│    → Pembahasan / Results   │    • Module Composition      │
│  • Review (Material Cards)  │    • Campus Score Database   │
│    → Material Card Detail   │    • AI Operations Log       │
│    → Tanya Gaspol AI Chat   │    • AI Settings (Model)     │
│    → Flashcard SR System    │    • Diagnostics             │
│  • Analytics                │                              │
│                             │                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Two-Portal Architecture

**Student Portal** — Public-facing learning application

- Mobile-first responsive design
- Bottom navigation: **Plan, Drill, Review, Analytics**
- Timeline-based journey visualization
- Campus-targeted readiness tracking

**Admin Console** — Content management and operations

- Desktop-optimized sidebar navigation
- AI-assisted content pipeline (questions + Material Cards)
- Campus score database management (human-in-loop)
- Quality control and publishing workflows

### 3.3 Design System: Soft Neubrutalism

| Element          | Specification                                                       |
| ---------------- | ------------------------------------------------------------------- |
| **Cards**        | 2px charcoal border, 4px offset shadow, 16px radius                 |
| **Colors**       | Pastel surfaces (pink, lavender, mint, peach, sky)                  |
| **Typography**   | Bold headers, high contrast, rounded sans-serif (Plus Jakarta Sans) |
| **Interactions** | Subtle lift on hover, quick press feedback                          |
| **Mobile**       | Bottom nav, horizontal scrolling carousels                          |

> See `DESIGN.v2.md` for full design token reference, component library, animation specs, and screen-by-screen wireframes.

---

## 4. User Journeys

### 4.1 Student Journey Overview

The student journey follows a **timeline-based loop**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         STUDENT TIMELINE                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ONBOARDING                                                          │
│      │                                                               │
│      ▼                                                               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              BASELINE PHASE (in Plan page)                   │   │
│  │  • See all baseline modules (topic-level, 15 questions each) │   │
│  │  • Complete modules to test ALL micro-skills                 │   │
│  │  • See partial analytics after each module                    │   │
│  │  • "Generate Plan" button LOCKED until all done              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│      │                                                               │
│      ▼ (all baseline done → unlock Generate Plan)                   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    PLAN ACTIVE PHASE                         │   │
│  │  • View generated tasks (5 module-based tasks)               │   │
│  │  • Tasks = weak skill-focused drill modules                   │   │
│  │  • Complete tasks from Drill page                            │   │
│  │  • 70% threshold to pass; else Material Cards + retry        │   │
│  │  • "Recycle" LOCKED until all required tasks done            │   │
│  └──────────────────────────────────────────────────────────────┘   │
│      │                                                               │
│      ▼ (all required tasks done → unlock Recycle)                   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    RECYCLE PHASE                             │   │
│  │  • Targeted assessment modules (weak micro-skills only)      │   │
│  │  • Behavior same as baseline (complete modules)              │   │
│  │  • See delta analytics (before/after)                        │   │
│  │  • "Generate Plan" button for next cycle                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│      │                                                               │
│      └─────────► (loop back to PLAN ACTIVE)                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Detailed Student Phases

#### Phase 1: ONBOARDING

**Entry Point:** `/onboarding`

**User Actions:**

1. **Input exam date** via calendar picker (required)
2. Set daily time budget in minutes (required)
3. Select target university (optional but recommended)
4. Select target major (optional)

**Key:** User does NOT manually select package duration. The system auto-calculates `package_days = exam_date - current_date`.

**System Actions:**

- Creates/updates `profiles` record
- Calculates `package_days` from exam date input
- Sets `user_state.current_phase` = `BASELINE_ASSESSMENT_IN_PROGRESS`
- Calculates exam countdown

**Data Collected:**

```typescript
{
  exam_date: Date,              // User picks from calendar
  package_days: number,         // AUTO-CALCULATED: exam_date - today
  time_budget_min: number,      // Daily study time in minutes
  target_university: string,    // Optional - for readiness comparison
  target_major: string          // Optional
}
```

**Admin Dependency:** Admin research pipeline includes exam date discovery. Default exam date is set by admin (from research) with human-in-loop confirmation. User can adjust if needed.

---

#### Phase 2: BASELINE_ASSESSMENT_IN_PROGRESS

**Entry Point:** `/plan` (unified Plan page with timeline view)

**Core Requirement:** Test ALL micro-skills (level 5) in the taxonomy. Every micro-skill must be assessed to build a complete learner profile.

**Module Structure:**

- Modules are organized at **Topic level (level 3)**
- Each module contains **10-15 questions**
- Each module covers multiple micro-skills under that topic
- Questions are distributed to ensure ALL micro-skills are tested

**User Flow (Plan Page — Baseline View):**

1. See **Timeline Overview**:
   - Baseline Section: List of baseline modules with completion status
   - Plan Section: "Generate Plan" button (LOCKED with message: "Complete all baseline modules first")
   - Tasks Section: Empty (shows after plan generation)
2. Select a baseline module to begin
3. Complete assessment in QuestionRunner (10-15 questions)
4. View Module Result + Updated Analytics
5. Return to Plan page, see updated timeline
6. Repeat until ALL baseline modules complete
7. "Generate My Plan" button becomes ENABLED

**Question Types Supported:**

| Type       | Code   | Description                      |
| ---------- | ------ | -------------------------------- |
| MCQ-5      | `MCQ5` | 5-option multiple choice         |
| MCQ-4      | `MCQ4` | 4-option multiple choice         |
| MCK-Table  | `MCK`  | Matrix selection (multiple rows) |
| True/False | `TF`   | Binary choice                    |
| Fill-in    | `FILL` | Numeric or text input            |

**System Actions on Each Answer:**

1. POST to `/api/submit-attempt`
2. Compute correctness
3. Apply rule-based error tags
4. **Award difficulty points** to the micro-skill (L1=1pt, L2=2pt, L3=5pt for correct answers)
5. Update `user_skill_state` (per micro-skill) — accumulate points, check coverage (20pt threshold)
6. Update `user_construct_state` (5 constructs)
7. Insert `attempts` and `attempt_error_tags` records

> **IMPORTANT: Real-Time Profile Updates**
> Every answer submission updates the user's skill profile immediately. This ensures the profile always reflects the user's "real" current knowledge state, not just snapshots from checkpoints.

**System Actions on Module Completion:**

1. POST to `/api/finalize-baseline-module`
2. Record `module_completions`
3. Check which micro-skills reached 20pt coverage threshold
4. Check if subtopics (level 4) are fully covered (all child level-5 skills covered)
5. Generate/update `analytics_snapshots` (partial)
6. Check if all baseline modules done → unlock plan generation

---

#### Phase 3: PLAN_GENERATION (Transition)

**Trigger:** User taps "Generate My Plan" after all baseline modules complete

**Entry Point:** Still `/plan` page

**User Flow:**

1. View Full Analytics Dashboard (popup or section)
   - **Readiness Score** (0-100) compared to target campus requirement
   - Construct Radar Chart (5 dimensions)
   - Coverage Map (by level 4 — subtopic) — shows covered vs uncovered
   - Weak Skills List (level 5 — micro-skills below 20 points)
   - Error Pattern Analysis (by construct)
2. Tap "Generate My Plan"
3. See generated tasks appear in timeline

**Coverage Definitions:**

| Level | Node Type   | Coverage Criteria                              |
| ----- | ----------- | ---------------------------------------------- |
| 5     | Micro-skill | User accumulated ≥20 points on correct answers |
| 4     | Subtopic    | ALL child micro-skills (level 5) are covered   |
| 3     | Topic       | ALL child subtopics (level 4) are covered      |

**Point System:**

| Difficulty | Code | Points (on correct answer) |
| ---------- | ---- | -------------------------- |
| Easy       | L1   | 1 point                    |
| Medium     | L2   | 2 points                   |
| Hard/HOTS  | L3   | 5 points                   |

**Readiness Score Formula:**

```typescript
function calculateReadiness(skillStates: UserSkillState[]): number {
  const totalSkills = skillStates.length
  const coveredSkills = skillStates.filter((s) => s.total_points >= 20).length
  const coveragePercent = (coveredSkills / totalSkills) * 100

  const totalPossiblePoints = totalSkills * 20
  const totalEarnedPoints = skillStates.reduce(
    (sum, s) => sum + Math.min(s.total_points, 20),
    0,
  )
  const progressPercent = (totalEarnedPoints / totalPossiblePoints) * 100

  // Weighted: 70% coverage completion, 30% partial progress
  return coveragePercent * 0.7 + progressPercent * 0.3
}
```

```
readiness_vs_target = (readiness / target_campus_score) * 100
```

**System Actions:**

1. POST to `/api/generate-plan`
2. Fetch latest `analytics_snapshots`
3. Fetch target campus score (if target_university set)
4. Identify uncovered/weak skills (points < 20)
5. Generate `plan_cycles` with **5 tasks** (drill modules)
6. Set `user_state.current_phase` = `PLAN_ACTIVE`

---

#### Phase 4: PLAN_ACTIVE

**Entry Point:** `/plan` (same unified page, now showing tasks)

**Timeline View:**

```
┌─────────────────────────────────────────────────┐
│  PLAN PAGE — TIMELINE VIEW                       │
├─────────────────────────────────────────────────┤
│                                                  │
│  📅 Day 5 of 21 | H-16 until exam               │
│  ───────────────────────────────────────        │
│                                                  │
│  ✅ BASELINE (Completed)                         │
│     └── All 5 modules done                       │
│                                                  │
│  📋 CYCLE 1 TASKS (Current)                      │
│     ├── ✅ Module: Aljabar Dasar (Done)          │
│     ├── ✅ Module: Geometri (Done)               │
│     ├── 🔄 Module: Statistika (In Progress)     │
│     ├── ⬜ Module: Penalaran Verbal              │
│     └── ⬜ Module: Reading Comprehension         │
│                                                  │
│  🔒 RECYCLE ASSESSMENT (Locked)                  │
│     └── Complete all tasks to unlock            │
│                                                  │
└─────────────────────────────────────────────────┘
```

**User Flow:**

1. View timeline with 5 task modules
2. Each task is a drill module (accessible from Drill page)
3. Go to **Drill** page to see available modules
4. Complete module (10-15 questions)
5. **Every answer updates user profile in real-time** (skill points, constructs, error tags)
6. **Pass Threshold: 70% correct**
   - If passed: Mark task complete ✅
   - If failed: Show result with pembahasan link + Material Cards, allow retry
7. Return to Plan page, see updated progress
8. All tasks complete → Unlock Recycle Assessment

> **IMPORTANT: Continuous Profile Updates**
> Unlike traditional learning apps that only assess at checkpoints, Gaspol updates the user's cognitive profile after EVERY question answered. Drill modules contribute points to micro-skills, and analytics reflect real-time knowledge state.

**Module Result Flow (on completion):**

See §5.1 (Assessment Engine) and §5.7 (Pembahasan Page) for detailed result + review flow.

---

#### Phase 5: RECYCLE_UNLOCKED → RECYCLE_ASSESSMENT

**Trigger:** All required tasks (5 modules) completed

**Entry Point:** `/plan` (Recycle section)

**User Flow:**

1. View "Recycle Assessment Unlocked" notification
2. Timeline shows Recycle section is now active
3. Recycle contains **targeted modules for weak micro-skills**
4. **Behavior identical to baseline:**
   - See list of recycle modules
   - Complete each module (questions for weak skills + control items)
   - See updated analytics after each
5. After all recycle modules: See Delta Analytics
6. "Generate Next Plan" button enabled

**Delta Analytics Display:**

```
┌─────────────────────────────────────────────────┐
│  IMPROVEMENT SUMMARY                             │
├─────────────────────────────────────────────────┤
│                                                  │
│  Overall Readiness:  62% → 71%  (+9%)           │
│  Target Campus: 75%                              │
│                                                  │
│  Constructs:                                     │
│  ├── Attention:    55 → 68  (+13)               │
│  ├── Speed:        70 → 72  (+2)                │
│  ├── Reasoning:    58 → 65  (+7)                │
│  ├── Computation:  65 → 78  (+13)               │
│  └── Reading:      60 → 62  (+2)                │
│                                                  │
│  [Generate Next Plan]                            │
└─────────────────────────────────────────────────┘
```

**System Actions:**

1. Create `recycle_checkpoints` record
2. Generate targeted module(s) from weak skills (points < 20)
3. On each question answer: update user profile immediately
4. On each module completion: Update analytics, check new coverage
5. On all complete: Generate delta `analytics_snapshots`
6. Enable next plan generation

**Loop:** After generating next plan → return to PLAN_ACTIVE with new 5 tasks

---

### 4.3 Navigation Structure (Student Portal)

**Bottom Navigation (4 tabs):**

| Tab           | Route        | Purpose                                             |
| ------------- | ------------ | --------------------------------------------------- |
| **Plan**      | `/plan`      | Timeline view: baseline → tasks → recycle           |
| **Drill**     | `/drill`     | Two-tab module listing (Topic-Based + Mixed Drills) |
| **Review**    | `/review`    | Material Cards, Tanya Gaspol, Flashcards            |
| **Analytics** | `/analytics` | Deep analytics dashboard                            |

#### Plan Page (`/plan`)

- **Purpose:** Central hub showing user's journey timeline
- **Content:**
  - Day counter, exam countdown
  - Readiness ring (vs target campus)
  - Baseline modules section
  - Current cycle tasks section
  - Recycle assessment section
  - Clear locked/unlocked states

#### Drill Page (`/drill`)

See §5.5 for full specification. Summary:

- **Purpose:** Access all drill modules organized by type
- **Layout:** Mandatory tasks pinned at top + two tabs (Topic-Based Modules / Mixed Drills)
- **Route:** Single `/drill` page (no sub-routes for listing)

#### Review Page (`/review`)

See §5.2; §5.8; §5.9. Summary:

- **Purpose:** Review weak areas with Material Cards, AI chat, and flashcards
- **Content:**
  - Skill tree organized by taxonomy levels
  - Material Card viewer with Tanya Gaspol button
  - Flashcard spaced repetition system with mastery stacks

#### Analytics Page (`/analytics`)

- **Purpose:** Deep analytics dashboard
- **Content:**
  - Readiness Score (vs target campus)
  - Construct Radar Chart (5 dimensions)
  - Coverage Map (by level 4)
  - Weak Skills List (level 5)
  - Error Pattern Analysis
  - Historical progress chart

---

### 4.4 Admin Journey Overview

```
Create Exam → Research (AI) → Build Taxonomy → Generate Questions →
Generate Material Cards → Configure Metadata → Compose Modules →
Setup Baseline → Manage Campus Scores → Configure AI Settings → Publish
```

#### Admin Workflow Steps:

**Step 1: Exam Setup** (`/admin/exams`)

- Create exam record (e.g., UTBK 2026)
- Configure basic metadata
- Set default exam date (from research, human-in-loop confirmation)

**Step 2: AI Research Pipeline** (`/admin/exams/[id]`)

- Trigger 5-batch research process:
  1. **Structure**: Sections, timing, scoring, question distribution
  2. **Taxonomy**: Complete 5-level hierarchy (Subject → Subtest → Topic → Subtopic → Micro-skill)
  3. **Constructs**: Cognitive dimensions, weights, time expectations
  4. **Error Patterns**: Common mistakes, detection signals, remediation
  5. **Exam Date**: Predict exam date from research (requires human confirmation)

**Step 3: Taxonomy Management** (`/admin/taxonomy`)

- Review AI-generated taxonomy
- Manual CRUD for 5-level hierarchy
- AI suggestions for gaps
- Ensure complete micro-skill coverage

**Step 4: Question Management** (`/admin/questions`)

- AI generation batch → specify micro-skill, count, **difficulty level (L1/L2/L3)**
- Manual creation/import
- Auto-tagging for imported content
- QC review queue
- Publish verified questions
- **Each question must have an `explanation` field** (used in Pembahasan page; ensure generation pipeline produces explanations)
- **Coverage dashboard**: See which micro-skills have questions, which need more
- **Difficulty distribution**: Ensure each micro-skill has mix of L1, L2, L3 questions

> **IMPORTANT: Question Explanation Requirement**
> Every question MUST have an `explanation` text. This is displayed in the Pembahasan (answer review) page after module completion. The AI question generation pipeline should generate explanations as part of the output. Admin can edit explanations manually.

**Step 5: Material Card Generation** (`/admin/materials`)

- AI batch generation → specify micro-skills to generate
- Each Material Card contains:
  - Core Idea (1-2 paragraphs)
  - Key Facts (bullet points)
  - Common Mistakes (bullet points)
  - Example(s) (worked examples)
- Admin can edit and refine AI-generated content
- **All micro-skills must have Material Cards**
- Coverage dashboard: See which micro-skills have material cards

**Step 6: Metadata Configuration** (`/admin/metadata`)

- Assign construct weights to questions
- Set time estimates
- Configure cognitive levels
- AI suggestions available

**Step 7: Module Composition** (`/admin/modules`)

- Create modules from question collections
- Module types supported in admin:
  - `baseline` — Topic-level, 10-15 questions, cover all micro-skills under topic
  - `drill_focus` — Focused on a single level-5 micro-skill (topic-based modules tab in student app)
  - `drill_mixed` — Mixed level-5 skills under a level-3 topic (mixed drills tab in student app)
  - `mock` — Full mock exam
  - `flashcard` — Flashcard deck
  - `swipe` — Swipe-based review
- Order questions within modules
- Admin must be able to create **both `drill_focus` and `drill_mixed`** module types

**Step 8: Campus Score Database** (`/admin/campus`)

- Manage university/campus passing scores
- AI assists with internet research for score data
- **Human-in-loop required**: Admin must confirm/edit scores
- Data structure: University name, Major/program, Minimum score, Year, Source URL

**Step 9: Baseline Builder** (`/admin/baseline`)

- Create baseline checkpoint from modules
- Ensure all micro-skills are covered
- Set module sequence
- Configure targeting rules

**Step 10: AI Settings** (`/admin/ai-runs`)

- Configure AI provider (Anthropic/OpenAI/Gemini)
- Set active model
- View AI operation logs (tokens, cost, status)
- **The Tanya Gaspol feature uses the model defined here**

**Step 11: Operations Monitoring** (`/admin/diagnostics`)

- System health checks
- Content coverage validation
- Auto-fix capabilities

---

## 5. Feature Specifications

### 5.1 Assessment Engine (QuestionRunner)

**Core Component:** `components/assessment/QuestionRunner.tsx`

**Responsibilities:**

- Render any question type (MCQ5, MCQ4, MCK, TF, Fill-in)
- Track time per question
- Navigation (previous/next/review later)
- Submit answers via API
- Display results on completion
- **Show pass/fail status with 70% threshold**
- **On completion: Show Module Result page**

**Props Interface:**

```typescript
interface QuestionRunnerProps {
  questions: Question[]
  moduleId?: string
  moduleType: "baseline" | "drill" | "recycle"
  passThreshold?: number // default 0.7 (70%)
  onComplete: (results: ModuleResult) => void
  showTimer?: boolean
  allowReview?: boolean
}

interface ModuleResult {
  attempts: AttemptResult[]
  score: number // 0-100
  passed: boolean // score >= passThreshold
  weakSkills: MicroSkill[] // skills to review if failed
  materialCardsToReview: string[] // material card IDs
}
```

**Question Flow:**

1. User sees question with timer
2. Selects/inputs answer
3. Navigates to next or submits
4. On final submit: batch process all attempts
5. Calculate score
6. Navigate to Module Result page

**Module Result Page (post-completion):**

After completing a module (or opening a previously completed module), the user sees the result page:

- **Completion status** — Pass/Fail based on 70% threshold (already implemented)
- **Score percentage** — e.g., "85% — Lulus!"
- **"Lihat Pembahasan" button** — Navigates to the Pembahasan page (§5.7)
- **Two action buttons:**
  - **"Coba Lagi" (Retry)** — Restarts the module with the same questions; resets completion status so the module is marked as not completed, allowing the user to drill again
  - **"Kembali ke Drill" (Back)** — Returns to the Drill page

**Retry behavior:**

When user taps Retry, the module's `module_completions` record for this user is reset (or a new attempt is created), and the user re-enters the QuestionRunner with the same admin-defined question set.

### 5.2 Material Card System

**Data Structure:**

```typescript
interface MaterialCard {
  id: string
  skill_id: string // references taxonomy_nodes level 5
  title: string

  // Content
  core_idea: string // 1-2 paragraphs explaining the concept
  key_facts: string[] // Key facts as bullet points
  common_mistakes: string[] // Common errors students make
  examples: Example[] // Worked examples

  // Metadata
  status: "draft" | "review" | "published"
  created_at: string
  updated_at: string
}

interface Example {
  problem: string
  solution: string
  explanation?: string
}
```

**DB Table:** `material_cards` (migration 031)

**Material Card Detail Page (`/review/[skillId]`):**

The Material Card detail view displays:

1. **Skill name + progress** — X/20 pts progress bar
2. **Core Idea** (💡 IDE UTAMA)
3. **Key Facts** (📋 FAKTA PENTING)
4. **Common Mistakes** (⚠️ KESALAHAN UMUM)
5. **Examples** (📝 CONTOH SOAL)

**Two action buttons at the top:**

1. **"Latihan Skill Ini" (Drill This Skill) button** — Context-aware:
   - **From Review page:** Navigates to Drill page with filter set to this level-5 skill, showing only modules that cover this micro-skill.
   - **From Pembahasan page:** Button label changes to **"Kembali ke Pembahasan"** (Back to Pembahasan) and navigates back to the Pembahasan page the user came from.

2. **"Tanya Gaspol" button** — Opens the Tanya Gaspol AI chat modal (§5.8).

**Usage:**

1. **Review Page**: Browse all Material Cards by topic/subtopic
2. **After Failed Module**: Show relevant Material Cards before retry
3. **Analytics Weak Skills**: Link to Material Card from weak skill list
4. **Pembahasan Page**: Each question links to its Material Card (if one exists for the level-5 skill)

### 5.3 Analytics System

**Snapshot Structure:**

```typescript
interface AnalyticsSnapshot {
  id: string
  user_id: string
  scope:
    | "partial_baseline"
    | "full_baseline"
    | "cycle_end"
    | "checkpoint"
    | "daily"

  // Core metrics
  readiness: number // 0-100 overall score
  target_campus_score: number // Required score for target university
  readiness_vs_target: number // readiness / target * 100
  constructs: ConstructScores // {C.ATTENTION: 72, ...}

  // Point-based coverage data
  coverage: {
    by_topic: TopicCoverage[] // Level 3
    by_subtopic: SubtopicCoverage[] // Level 4
    total_microskills: number
    covered_microskills: number // points >= 20
    uncovered_microskills: number // points < 20
    total_points_earned: number // Sum of all skill points
  }

  // Weakness identification
  weak_skills: WeakSkill[]
  error_patterns: ErrorPattern[]

  created_at: string
}
```

**Components:**

| Component              | Purpose                                        | Data Source               |
| ---------------------- | ---------------------------------------------- | ------------------------- |
| `ReadinessScore`       | Large circular + vs target campus              | `snapshot.readiness`      |
| `ConstructRadarChart`  | N-sided radar (dynamic)                        | `snapshot.constructs`     |
| `CoverageMap`          | Bar chart by subtopic (level 4)                | `snapshot.coverage`       |
| `WeakSkillsList`       | Micro-skills with points + Material Card links | `snapshot.weak_skills`    |
| `ErrorPatternAnalysis` | Accordion with tips                            | `snapshot.error_patterns` |
| `DeltaAnalyticsCard`   | Before/after comparison                        | Two snapshots             |
| `PointsProgress`       | Shows X/20 points per skill                    | `user_skill_state`        |

### 5.4 Timeline/Plan System

**Plan Page Structure:**

```typescript
interface PlanPageData {
  // Header
  daysElapsed: number
  totalDays: number
  daysRemaining: number
  examDate: Date
  readinessVsTarget: number

  // Sections
  baseline: {
    status: "in_progress" | "completed"
    modules: BaselineModule[]
    completedCount: number
    totalCount: number
  }

  currentCycle: {
    cycleIndex: number
    status: "active" | "completed"
    tasks: PlanTask[]
    completedCount: number
    requiredCount: number
  } | null

  recycle: {
    status: "locked" | "unlocked" | "in_progress" | "completed"
    modules: RecycleModule[]
  } | null
}
```

### 5.5 Drill System (Restructured in v3)

**Route:** `/drill` (single page — replaces old `/drill` + `/drill/drills` split)

#### Summary / User Value

The Drill page is the primary module execution hub. It shows modules organized into two categories (Topic-Based and Mixed), pins mandatory plan tasks at the top, and provides rich filtering/search. Users can start, continue, or review any module from here.

#### User Story / JTBD

- As a student, I want to see my mandatory plan tasks prominently at the top so I complete them first.
- As a student, I want to browse topic-based modules (level-5 skill modules) organized by subject (level-2) and topic (level-3) so I can practice specific skills.
- As a student, I want to browse mixed drills (level-3 modules with mixed level-5 questions) so I can practice integrated problem-solving.
- As a student, I want to filter by status (All / Required Tasks / Completed) and search by name so I can quickly find what I need.

#### UX Flow

**Page Layout:**

```
┌─────────────────────────────────────────────────┐
│  Drill                                    🔍     │
├─────────────────────────────────────────────────┤
│                                                  │
│  📌 MANDATORY TASKS (from Plan)                  │
│  ┌──────────────────────────────────────────┐   │
│  │ ⚠️ Statistika Dasar    10 soal · ~15 min │   │
│  │    ████████░░░░░░░ 30%    [Lanjutkan →]  │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │ ⚠️ Penalaran Verbal    12 soal · ~18 min │   │
│  │                          [Mulai →]       │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ [Topic-Based Modules] | [Mixed Drills]   │   │ ← Tab switcher
│  └──────────────────────────────────────────┘   │
│                                                  │
│  Filter: [All] [Required Tasks] [Completed]      │
│  Search: [🔍 Search modules...]                  │
│  Filter by: Level-3 ▼  Level-4 ▼  Level-5 ▼    │
│                                                  │
│  (Tab content below)                             │
│                                                  │
├─────────────────────────────────────────────────┤
│   📋       📚        📖       📊                │
│  Plan    (●)Drill  Review  Analytics             │
└─────────────────────────────────────────────────┘
```

**Tab 1: Topic-Based Modules**

Displays level-5 (micro-skill) based modules, organized hierarchically:

```
Level-2 Group: TPS (Tes Potensi Skolastik)
│
├── ▼ Level-3 Accordion: Penalaran Umum
│   ├── [Module Card] Silogisme — L4: Logika · Mod 1 · 10 soal · ~12 min · ✓
│   ├── [Module Card] Silogisme — L4: Logika · Mod 2 · 8 soal · ~10 min
│   ├── [Module Card] Analogi — L4: Logika · Mod 1 · 10 soal · ~15 min · ⚠️
│   └── ...
│
├── ▶ Level-3 Accordion: Penalaran Matematika
│   └── ...
```

**Module card content:**

- Level-5 skill name
- Level-4 tags (parent subtopic badge)
- Module number (if > 1 module for same level-5 skill, e.g., "Mod 1", "Mod 2")
- Question count
- Estimated time
- Status indicator:
  - ✓ (checkmark) = Completed
  - ⚠️ (warn) = Assigned as plan task
  - (nothing) = Not assigned, not completed

**Tab 2: Mixed Drills Modules**

Displays level-3 (topic) based modules with mixed level-5 skill questions, grouped by level-2:

```
Level-2 Group: TPS
│
├── [Module Card] Penalaran Umum — Mixed · 15 soal · ~20 min · ✓
├── [Module Card] Penalaran Matematika — Mixed · 12 soal · ~18 min
└── ...
```

**Filtering:**

- **Status filter:** All / Required Tasks / Completed
  - "Required Tasks" shows only modules assigned as tasks in the current plan cycle
  - "Completed" shows only modules the user has completed
- **Taxonomy filter:** Filter by Level-3, Level-4, or Level-5
- **Search:** Search modules by name (text input)

**Module Click Behavior:**

1. **Module not completed:** Navigate to QuestionRunner with the questions assigned to that module. Questions are served in admin-defined order (not random).
2. **Module already completed:** Show the Module Result page (§5.1). From there, user can view Pembahasan or Retry.

**Retry behavior:** When user taps "Retry" on a completed module's result page, the module's completion status is reset and the user re-enters the QuestionRunner with the same questions.

#### Data Model Impact

- **No new tables required.** Existing `modules` table already has `module_type` with `drill_focus` and `drill_mixed` values.
- Admin module composition page (`/admin/modules`) already supports creating `drill_mixed` type modules. Verify it also supports `drill_focus` type fully (targeting a single level-5 node).
- Module questions are stored in `modules.question_ids` (JSONB array of question UUIDs) and fetched for the QuestionRunner.

#### Backend/API Impact

- Drill page data fetching query needs to:
  - Fetch all published modules of type `drill_focus` and `drill_mixed`
  - Join with taxonomy nodes (level-2, level-3, level-4, level-5) for grouping/labeling
  - Join with `plan_tasks` to identify required tasks
  - Join with `module_completions` for completion status
- No new API endpoints required.

#### Admin Impact

- Admin module composition page (`/admin/modules`):
  - Must support `drill_focus` module type (per-level-5 skill modules)
  - Must support `drill_mixed` module type (level-3 topic mixed skill modules)
  - Both types already exist as options in the current admin modules page
  - Verify question assignment works for both types

#### Analytics / Telemetry

Events to emit (align with existing naming):

- `drill.module_started` — `{ module_id, module_type, is_required }`
- `drill.module_completed` — `{ module_id, module_type, score, passed }`
- `drill.module_retried` — `{ module_id, attempt_number }`

#### Acceptance Criteria

1. Drill page shows mandatory tasks pinned at top
2. Two tabs: Topic-Based Modules and Mixed Drills
3. Topic-Based tab shows level-5 modules grouped by level-2 with level-3 accordions
4. Mixed Drills tab shows level-3 modules grouped by level-2
5. Module cards show correct status indicator (✓, ⚠️, or none)
6. Status filter (All/Required Tasks/Completed) works correctly with proper labels (not i18n keys)
7. Taxonomy filter (level-3/4/5) works correctly
8. Search by name works
9. Clicking incomplete module → QuestionRunner with admin-defined question order
10. Clicking completed module → Module Result page
11. Retry from result page resets completion and re-enters QuestionRunner
12. Old routes (`/drill/drills`, `/drill/modules`) are removed or redirect to `/drill`

#### Test Plan

- **Unit:** Filter/search logic, module grouping by taxonomy level
- **Integration:** Data fetching with taxonomy joins, plan task identification
- **E2E:** Complete flow: open drill → start module → complete → view result → retry
- **Manual:** Visual verification of accordion grouping, status indicators

### 5.6 Admin AI Operations

**Research Pipeline (5 Batches):**

```typescript
interface ResearchBatch {
  batch_number: 1 | 2 | 3 | 4 | 5
  purpose: string
  inputs: {
    exam_id: string
    source_materials?: string
    existing_data?: any
  }
  outputs: {
    structure?: ExamStructure // Batch 1
    taxonomy?: TaxonomyNode[] // Batch 2
    constructs?: ConstructDefinition[] // Batch 3
    error_patterns?: ErrorTag[] // Batch 4
    exam_date?: ExamDatePrediction // Batch 5
  }
  requires_human_confirmation: boolean
  tokens_used: number
  cost_estimate: number
}
```

**Material Card Generation:**

```typescript
interface MaterialCardGenerationJob {
  micro_skill_ids: string[]
  exam_id: string
  batch_size: number
  status: "pending" | "running" | "completed" | "failed"
  results: {
    generated: number
    failed: number
    material_card_ids: string[]
  }
}
```

### 5.7 Pembahasan (Answer Review) Page

**NEW in v3.**

#### Summary / User Value

After completing a drill module, users can review every question, see the correct answer, and read the explanation. This enables active learning from mistakes. Each question also links to its material card for deeper study.

#### User Story / JTBD

- As a student, I want to review my answers after completing a module so I can understand my mistakes.
- As a student, I want to see the explanation for each question so I can learn the correct approach.
- As a student, I want to jump from a question to its material card so I can study the underlying concept.

#### UX Flow

**Route:** `/drill/pembahasan?moduleId=<id>` (or similar — a dedicated page or panel)

**Page Content:**

For each question in the module (in order):

```
┌─────────────────────────────────────────────────┐
│  Soal 1 / 10                                    │
├─────────────────────────────────────────────────┤
│                                                  │
│  [Question text with math rendering]             │
│                                                  │
│  A. Option A                                     │
│  B. Option B  ← Your answer (❌ wrong)           │
│  C. Option C  ← Correct answer (✅)              │
│  D. Option D                                     │
│  E. Option E                                     │
│                                                  │
│  ─────────────────────────────────────────       │
│  📖 PEMBAHASAN                                   │
│  [Explanation text from question.explanation]    │
│                                                  │
│  ─────────────────────────────────────────       │
│  [📚 Lihat Materi: SPLDV]   ← Material card     │
│  (only shown if level-5 has a published          │
│   material card)                                 │
│                                                  │
└─────────────────────────────────────────────────┘
│                                                  │
│  Soal 2 / 10                                    │
│  ...                                            │
└─────────────────────────────────────────────────┘
```

**Key behaviors:**

- Shows all questions in module order
- Each question shows: question text, user's answer (highlighted), correct answer (highlighted), explanation
- **Material card link:** If the question's level-5 skill has a published material card, show a "Lihat Materi: [Skill Name]" button. Tapping it opens the material card detail page (`/review/[skillId]`). The material card page's drill button will say "Kembali ke Pembahasan" (back to pembahasan) instead of "Latihan Skill Ini".
- If the level-5 skill does NOT have a material card, the button is hidden.
- Answers show green highlight for correct, red for incorrect user answers.

#### Data Model Impact

- **Requires `explanation` field on questions table.** This field already exists in the `questions` table (`explanation TEXT`). The AI question generation pipeline must produce explanations. Admin can edit.
- No new tables needed.
- Need to fetch `material_cards` by `skill_id` to check existence.

#### Backend/API Impact

- When loading pembahasan, fetch:
  - Module questions (from `modules.question_ids`)
  - User's attempts for this module (from `attempts` where `module_id` matches)
  - Question data including `explanation`, `correct_answer`, `micro_skill_id`
  - Material card existence check (join `material_cards` on `skill_id` = question's `micro_skill_id`, where `status = 'published'`)
- No new Edge Functions needed.

#### Admin Impact

- **Question generation pipeline** must include explanation generation. Verify the `generate_questions` Edge Function outputs `explanation` with each question.
- Admin should see and be able to edit the `explanation` field on each question.

#### Analytics / Telemetry

- `pembahasan.viewed` — `{ module_id }`
- `pembahasan.material_card_opened` — `{ skill_id, question_id }`

#### Acceptance Criteria

1. Pembahasan page shows all questions in module order
2. Each question shows user's answer, correct answer, and explanation
3. Material card button shown only when a published material card exists for the question's skill
4. Tapping material card opens the material card detail page
5. Material card's drill button says "Kembali ke Pembahasan" when opened from pembahasan
6. Questions support math rendering (KaTeX)

#### Test Plan

- **Unit:** Question/answer display logic, material card existence check
- **Integration:** Correct attempt + question + material card data loading
- **E2E:** Complete module → view pembahasan → open material card → return
- **Manual:** Verify math rendering, answer highlighting

### 5.8 Tanya Gaspol AI Chat

**NEW in v3.**

#### Summary / User Value

Conversational AI assistant scoped to individual material cards. Students can ask questions about concepts they don't understand, with preset prompts and free-form input. Controlled by a token budget to manage cost.

#### User Story / JTBD

- As a student, I want to ask questions about a concept in my own words so I can understand it better.
- As a student, I want preset question templates so I don't have to think of what to ask.
- As a student, I want my chat history preserved per skill so I can revisit previous explanations.

#### UX Flow

**Trigger:** "Tanya Gaspol" button on Material Card detail page.

**Chat Modal:**

```
┌─────────────────────────────────────────────────┐
│  Tanya Gaspol                            ✕ Close│
├─────────────────────────────────────────────────┤
│                                                  │
│  Token Quota: 🪙 75 / 100 remaining             │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  🤖 Halo! Ada yang mau kamu tanyakan     │   │
│  │     tentang [SPLDV]? Aku siap bantu! 💪  │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  Preset questions (tap to send):                 │
│  ┌──────────────────────────────────────────┐   │
│  │ "Saya kurang paham dengan konsep ini,    │   │
│  │  bisa jelaskan dengan bahasa yang lebih  │   │
│  │  sederhana?"                             │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │ "Bisa jelaskan dengan contoh soal lain?" │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │ "Apa tips menghindari kesalahan umum     │   │
│  │  di topik ini?"                          │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ─── Previous chat messages (if any) ───        │
│  👤 "Bisa jelaskan dengan contoh lain?"         │
│  🤖 "Tentu! Berikut contoh lain: ..."          │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ Ketik pertanyaanmu...            [Kirim] │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
└─────────────────────────────────────────────────┘
```

**When quota is exhausted:**

```
┌──────────────────────────────────────────┐
│  😢                                      │
│  Kuota Tanya Gaspol kamu sudah habis.   │
│  Selamat belajar ya!                    │
│  (with sad gaspol character)            │
└──────────────────────────────────────────┘
```

**Key behaviors:**

- **Token quota:** Each user starts with 100 tokens. Each question costs 5 tokens. Universal across all skills.
- **Chat persistence:** Chat messages are stored per user + per level-5 skill. When user revisits the material card for the same skill, previous messages are shown.
- **AI model:** Uses the model configured in `ai_settings` table (admin-configurable via `/admin/ai-runs`).
- **Preset questions:** 3-5 template questions displayed as tappable chips. Tapping fills the input and sends.
- **Gaspol character:** Opening greeting is randomly selected from a template pool (e.g., "Halo! Ada yang mau kamu tanyakan tentang [skill_name]?", "Yuk belajar [skill_name] bareng aku!", etc.)

#### Data Model Impact

**New tables required:**

```sql
-- Chat messages for Tanya Gaspol
tanya_gaspol_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES taxonomy_nodes(id) ON DELETE CASCADE,

  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  message TEXT NOT NULL,

  tokens_used INTEGER DEFAULT 0,  -- tokens consumed by this exchange

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tanya_gaspol_user_skill ON tanya_gaspol_chats(user_id, skill_id);

-- Token quota tracking
tanya_gaspol_quota (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_tokens INTEGER NOT NULL DEFAULT 100,
  used_tokens INTEGER NOT NULL DEFAULT 0,
  remaining_tokens INTEGER GENERATED ALWAYS AS (total_tokens - used_tokens) STORED,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**RLS policies:**

- Users can only read/write their own chat messages
- Users can only read their own quota
- Service role can update quota on chat submission

**Migration needed:** Yes — new migration for `tanya_gaspol_chats` and `tanya_gaspol_quota` tables.

#### Backend/API Impact

**New API endpoint:** `POST /api/tanya-gaspol`

```typescript
// Request
{
  skill_id: string,       // Level-5 taxonomy node ID
  message: string,        // User's question
  skill_name: string,     // For context in prompt
  material_context: {     // Material card content for AI context
    core_idea: string,
    key_facts: string[],
    common_mistakes: string[],
  }
}

// Response
{
  reply: string,          // AI response
  tokens_used: number,    // Tokens deducted
  remaining_tokens: number
}
```

**Or new Edge Function:** `tanya_gaspol`

**AI Prompt Design (for Tanya Gaspol):**

```
System prompt:
"Kamu adalah Gaspol, asisten belajar yang ramah dan suportif untuk siswa SMA
Indonesia yang mempersiapkan UTBK. Kamu menjelaskan konsep dengan bahasa
sederhana, memberikan contoh yang relevan, dan selalu menyemangati siswa.

Konteks materi yang sedang dipelajari:
- Skill: {skill_name}
- Ide Utama: {core_idea}
- Fakta Kunci: {key_facts}
- Kesalahan Umum: {common_mistakes}

Aturan:
1. Jawab dalam Bahasa Indonesia
2. Gunakan bahasa yang mudah dipahami siswa SMA
3. Berikan contoh konkret jika diminta
4. Jangan menjawab di luar konteks materi ini
5. Jika siswa bertanya di luar topik, arahkan kembali dengan sopan
6. Gunakan emoji secukupnya untuk ramah tapi tidak berlebihan
7. Respons maksimal 300 kata"
```

#### Admin Impact

- **AI Settings page** (`/admin/ai-runs`) already configures the active model. Tanya Gaspol uses this configuration.
- Future: Admin may want to configure default token quota per user, preset questions, or system prompt. Not required for initial implementation.

#### Analytics / Telemetry

- `tanya_gaspol.chat_opened` — `{ skill_id }`
- `tanya_gaspol.question_sent` — `{ skill_id, is_preset: boolean, tokens_used }`
- `tanya_gaspol.quota_exhausted` — `{ user_id }`

#### Acceptance Criteria

1. "Tanya Gaspol" button appears on Material Card detail page
2. Chat modal opens with greeting and preset questions
3. Token quota is displayed and decremented correctly (5 tokens per question)
4. User can send preset or custom questions
5. AI responds using configured model from `ai_settings`
6. Chat history is persisted per user + per skill
7. Previous messages load when revisiting same skill
8. Quota exhaustion shows the sad message with disabled input
9. Responses are in Bahasa Indonesia and scoped to the material

#### Test Plan

- **Unit:** Token quota calculation, message persistence logic
- **Integration:** AI API call with context, quota deduction
- **E2E:** Open material card → ask question → get response → revisit → see history → exhaust quota
- **Manual:** Verify AI response quality, language, and scope adherence

#### Risks + Rollout Notes

- **Cost risk:** AI API costs per user question. Mitigated by 100-token quota (max 20 questions per user).
- **Latency:** AI responses may take 2-5 seconds. Show typing indicator.
- **Abuse:** Rate limit by user. Preset questions reduce abuse surface.
- **Rollout:** Can be gated behind feature flag initially.

### 5.9 Flashcard Spaced Repetition System (Revamped in v3)

**NEW in v3** — Replaces the existing basic flashcard UI with a full Anki-like spaced repetition system.

#### Summary / User Value

An Anki-like flashcard system tied to micro-skills (level-5). Each card has a spaced-repetition schedule. The Review page organizes cards into mastery stacks (Forgot / Hard / Good / Easy) for targeted review sessions.

#### User Story / JTBD

- As a student, I want to review flashcards using spaced repetition so I retain concepts long-term.
- As a student, I want to see which concepts I'm struggling with (Forgot stack) so I can focus on them.
- As a student, I want scheduled review sessions so I study at optimal intervals.

#### Gating / Unlocking Rule

- Flashcards are **locked** until the user completes the **Baseline Assessment**.
- **Locked UI:**
  - Title: "Flashcards unlock after Baseline"
  - Subtitle: "We need your baseline to prioritize which micro-skills you should review first."
  - Primary CTA: "Start Baseline Assessment" (→ navigates to Plan page)

#### Review Page UI (Mastery Stacks)

**Route:** `/review/flashcards`

**Layout:** 4 stacks in a 2×2 grid:

```
┌────────────────────────────────────────┐
│  FLASHCARDS                             │
├────────────────────────────────────────┤
│                                        │
│  ┌───────────────┐ ┌───────────────┐  │
│  │   FORGOT      │ │    HARD       │  │
│  │     8 due     │ │    3 due      │  │
│  │   48 total    │ │   22 total    │  │
│  │   Due now     │ │   Due today   │  │
│  │  ╔══╗╔══╗╔══╗ │ │  ╔══╗╔══╗╔══╗│  │
│  │  ║  ║║  ║║  ║ │ │  ║  ║║  ║║  ║│  │
│  │  ╚══╝╚══╝╚══╝ │ │  ╚══╝╚══╝╚══╝│  │
│  └───────────────┘ └───────────────┘  │
│                                        │
│  ┌───────────────┐ ┌───────────────┐  │
│  │    GOOD       │ │    EASY       │  │
│  │     0 due     │ │    0 due      │  │
│  │   15 total    │ │   10 total    │  │
│  │  All caught up│ │  Not due yet  │  │
│  │  (empty deck) │ │  ╔══╗╔══╗╔══╗│  │
│  └───────────────┘ └───────────────┘  │
│                                        │
│  [ Review All Due (11) ]               │
│                                        │
└────────────────────────────────────────┘
```

**Stack card details:**

- Stack label (Forgot / Hard / Good / Easy)
- Primary number: **Due count** (cards due for review now)
- Secondary text: Total count (e.g., "48 total")
- Status text: "Due now" / "Due today" / "All caught up" / "Not due yet"

**Stack thickness visual rules:**

- 0 cards → Empty deck state/illustration
- 1–9 cards → 3-layer card stack visual
- 10+ cards → 5-layer card stack visual (thicker)

**Tap behavior:**

- Tap a stack → Start review session filtered to that mastery bucket
- "Review All Due" CTA → Review session with all due cards across all buckets

#### Flashcard Review Session UX

**Card Flow:**

1. Show **Front** (prompt / question)
2. User taps **"Show Answer"**
3. Show **Back** (answer)
4. User selects mastery response (fixed bottom buttons):

```
┌─────────────────────────────────────────┐
│  Card 3 / 11                            │
├─────────────────────────────────────────┤
│                                         │
│  [Front of card showing concept/question]│
│                                         │
│  [ Show Answer ]                        │
│                                         │
├─────────────────────────────────────────┤
│  Forgot  |  Hard  |  Good  |  Easy      │
└─────────────────────────────────────────┘
```

**Micro-interaction:** After selecting mastery, animate the card **flying into that stack lane** (reinforces the mental model of sorting into stacks).

**Button layout fix:** The forgot/hard/good/easy buttons must be properly constrained within the page width. Use equal-width flex layout with appropriate padding. (Fixes B-005.)

#### Spaced Repetition Logic (SM-2 Inspired)

Each card stores:

| Field            | Default  | Description                                |
| ---------------- | -------- | ------------------------------------------ |
| `ease_factor`    | 2.5      | Multiplier for interval growth             |
| `interval_days`  | 0        | Current interval between reviews           |
| `reps`           | 0        | Consecutive successful recalls             |
| `due_at`         | NOW      | Next review timestamp                      |
| `mastery_bucket` | 'forgot' | Current stack: forgot / hard / good / easy |

**Scheduling by button:**

**Forgot:**

- `reps = 0`
- `interval_days = 0` (short in-session delay, e.g., 5-10 minutes)
- `ease_factor = max(1.3, ease_factor - 0.2)`
- `due_at = now + short_delay`
- `mastery_bucket = 'forgot'`

**Hard:**

- `reps += 1`
- `interval_days = max(1, round(interval_days * 1.2))`
- `ease_factor = max(1.3, ease_factor - 0.15)`
- `due_at = now + interval_days`
- `mastery_bucket = 'hard'`

**Good:**

- `reps += 1`
- Interval rule:
  - if `reps == 1` → `interval_days = 1`
  - if `reps == 2` → `interval_days = 3`
  - else → `interval_days = round(interval_days * ease_factor)`
- `ease_factor += 0.0` (or +0.05 optional)
- `due_at = now + interval_days`
- `mastery_bucket = 'good'`

**Easy:**

- `reps += 1`
- `interval_days = round(interval_days * (ease_factor + 0.3))`
- `ease_factor += 0.15`
- `due_at = now + interval_days`
- `mastery_bucket = 'easy'`

#### Data Model Impact

**New table required:**

```sql
-- Flashcard user state (spaced repetition)
flashcard_user_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES taxonomy_nodes(id) ON DELETE CASCADE,

  -- SM-2 fields
  ease_factor DECIMAL(4,2) NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  due_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Mastery classification
  mastery_bucket TEXT NOT NULL DEFAULT 'forgot'
    CHECK (mastery_bucket IN ('forgot', 'hard', 'good', 'easy')),

  -- Stats
  total_reviews INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, skill_id)
);

CREATE INDEX idx_flashcard_user_state_due ON flashcard_user_state(user_id, due_at);
CREATE INDEX idx_flashcard_user_state_bucket ON flashcard_user_state(user_id, mastery_bucket);
```

**RLS policies:**

- Users can only read/write their own flashcard state
- Service role used for batch initialization after baseline

**Migration needed:** Yes — new migration for `flashcard_user_state` table.

**Initialization:** After baseline completion, create `flashcard_user_state` records for ALL level-5 skills with default values (forgot bucket, due now). This ensures all cards are available for review immediately.

#### Backend/API Impact

- **Flashcard data fetch:** Query `flashcard_user_state` joined with `taxonomy_nodes` for card content.
- **Update state:** `POST /api/flashcard-review` to update SM-2 fields after user selects mastery button.
- Existing `generate_flashcards` Edge Function may need adjustment to work with the new state model, or flashcard content can be sourced from `material_cards` table directly (front = skill name/question, back = core idea + key facts from material card).

#### Admin Impact

- Admin flashcard page (`/admin/flashcards`) exists. It should align with the new mastery stack model.
- Flashcard content can be auto-generated from Material Cards (one flashcard per material card / micro-skill).

#### Analytics / Telemetry

- `flashcard.session_started` — `{ bucket_filter, due_count }`
- `flashcard.card_reviewed` — `{ skill_id, mastery_bucket, ease_factor, interval_days }`
- `flashcard.session_completed` — `{ cards_reviewed, duration_sec }`

#### Acceptance Criteria

1. Flashcards are locked until baseline is complete
2. Review page shows 4 mastery stacks in 2×2 grid with due counts
3. Stack thickness reflects card count (empty / 3-layer / 5-layer)
4. Tapping a stack starts a filtered review session
5. "Review All Due" button starts session with all due cards
6. Card shows front, user taps "Show Answer", sees back
7. 4 mastery buttons (Forgot/Hard/Good/Easy) update SM-2 schedule correctly
8. Card animation flies into selected stack
9. All text labels are hardcoded strings (not i18n keys that can fail) — Fixes B-004
10. Buttons fit within page width — Fixes B-005
11. Chat history and state persist across sessions

#### Test Plan

- **Unit:** SM-2 scheduling calculation, due date computation
- **Integration:** State update API, baseline unlock gating
- **E2E:** Complete baseline → flashcards unlock → review session → cards reschedule
- **Manual:** Visual stack thickness, card animation, button layout

---

## 6. Data Architecture

### 6.1 Entity Relationship Overview

```
                    ┌─────────────┐
                    │    exams    │
                    └──────┬──────┘
                           │
       ┌───────────────────┼───────────────────┐
       │           │               │           │
       ▼           ▼               ▼           ▼
┌──────────┐ ┌──────────────┐ ┌────────┐ ┌──────────────┐
│exam_const│ │taxonomy_nodes│ │  tags  │ │campus_scores │
└──────────┘ └──────┬───────┘ └────────┘ └──────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐
  │questions │ │materials │ │ flashcard_user_state │
  └────┬─────┘ └──────────┘ └──────────────────────┘
       │
       ▼
  ┌──────────┐
  │ modules  │
  └────┬─────┘
       │
  ┌────┴────┐
  │         │
  ▼         ▼
baseline  drill
modules   modules

NEW TABLES (v3):
  ┌─────────────────────────┐
  │ tanya_gaspol_chats      │
  │ tanya_gaspol_quota      │
  │ flashcard_user_state    │
  └─────────────────────────┘
```

### 6.2 Core Tables

#### User & State Tables

```sql
-- User profiles (extends auth.users)
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'student',    -- 'student' | 'admin'

  -- Onboarding data
  exam_date DATE,                 -- User-selected exam date
  package_days INTEGER,           -- AUTO-CALCULATED from exam_date (legacy: CHECK IN (7,14,21,30))
  time_budget_min INTEGER,
  target_university TEXT,
  target_major TEXT,

  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- State machine tracking
user_state (
  user_id UUID PRIMARY KEY REFERENCES profiles,
  current_phase TEXT,  -- ONBOARDING | BASELINE_ASSESSMENT_IN_PROGRESS |
                       -- BASELINE_COMPLETE | PLAN_ACTIVE |
                       -- RECYCLE_UNLOCKED | RECYCLE_ASSESSMENT_IN_PROGRESS
  current_exam_id UUID,
  current_cycle_id UUID,
  current_checkpoint_id UUID,
  updated_at TIMESTAMPTZ
);

-- Per-skill performance tracking (POINT-BASED COVERAGE)
user_skill_state (
  user_id UUID REFERENCES profiles,
  taxonomy_node_id UUID REFERENCES taxonomy_nodes,  -- Level 5 micro-skill

  -- Point-based coverage
  total_points INTEGER DEFAULT 0,
  is_covered BOOLEAN GENERATED ALWAYS AS (total_points >= 20) STORED,

  -- Legacy metrics (still tracked for analytics)
  accuracy FLOAT,
  speed_avg FLOAT,
  attempts_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,

  -- Breakdown by difficulty
  l1_correct INTEGER DEFAULT 0,
  l2_correct INTEGER DEFAULT 0,
  l3_correct INTEGER DEFAULT 0,

  last_seen_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, taxonomy_node_id)
);

-- Cognitive construct scores
user_construct_state (
  user_id UUID PRIMARY KEY REFERENCES profiles,
  constructs JSONB,     -- {C.ATTENTION: 72, C.SPEED: 65, ...}
  updated_at TIMESTAMPTZ
);
```

#### Content Tables

```sql
-- Exam definitions
exams (
  id UUID PRIMARY KEY,
  name TEXT,
  code TEXT UNIQUE,
  year INTEGER,
  description TEXT,

  -- Research data
  structure_metadata JSONB,
  construct_profile JSONB,
  error_patterns JSONB,

  -- Exam date (from research, admin confirmed)
  default_exam_date DATE,
  exam_date_source TEXT,

  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ
);

-- 5-level taxonomy hierarchy
taxonomy_nodes (
  id UUID PRIMARY KEY,
  parent_id UUID REFERENCES taxonomy_nodes,
  level INTEGER,                   -- 1=Subject, 2=Subtest, 3=Topic, 4=Subtopic, 5=Micro-skill
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Material Cards — linked to micro-skills (level 5)
material_cards (
  id UUID PRIMARY KEY,
  skill_id UUID NOT NULL REFERENCES taxonomy_nodes UNIQUE,

  title TEXT NOT NULL,
  core_idea TEXT NOT NULL,
  key_facts JSONB NOT NULL DEFAULT '[]',
  common_mistakes JSONB NOT NULL DEFAULT '[]',
  examples JSONB NOT NULL DEFAULT '[]',

  status TEXT NOT NULL DEFAULT 'draft',  -- draft | review | published
  created_by UUID REFERENCES profiles,
  reviewed_by UUID REFERENCES profiles,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Question bank
questions (
  id UUID PRIMARY KEY,
  micro_skill_id UUID NOT NULL REFERENCES taxonomy_nodes,
  difficulty TEXT NOT NULL,            -- easy | medium | hard
  cognitive_level TEXT NOT NULL,       -- L1 | L2 | L3
  question_format TEXT NOT NULL,       -- MCQ5 | MCQ4 | MCK | TF | FILL

  -- Difficulty & Points
  difficulty_level TEXT,               -- L1 | L2 | L3 (for point system)
  point_value INTEGER GENERATED ALWAYS AS (
    CASE difficulty_level
      WHEN 'L1' THEN 1
      WHEN 'L2' THEN 2
      WHEN 'L3' THEN 5
      ELSE 0
    END
  ) STORED,

  -- Content
  stem TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT NOT NULL,
  explanation TEXT,                    -- REQUIRED for Pembahasan page

  -- Metadata
  construct_weights JSONB,
  time_estimate_seconds INTEGER,
  status TEXT DEFAULT 'draft',
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Modules (reusable question collections)
modules (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  module_type TEXT NOT NULL,           -- baseline | drill_focus | drill_mixed | mock | flashcard | swipe
  target_node_id UUID REFERENCES taxonomy_nodes,

  question_count INTEGER NOT NULL,
  time_limit_min INTEGER,
  passing_threshold DECIMAL(3,2) DEFAULT 0.70,
  question_ids JSONB NOT NULL DEFAULT '[]',

  status TEXT DEFAULT 'draft',
  created_by UUID REFERENCES profiles,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Baseline modules
baseline_modules (
  id UUID PRIMARY KEY,
  module_id UUID REFERENCES modules,
  checkpoint_order INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT true,
  title TEXT NOT NULL,
  subtitle TEXT,
  estimated_duration_min INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ
);

-- Campus/University Score Database
campus_scores (
  id UUID PRIMARY KEY,
  university_name TEXT NOT NULL,
  major TEXT,
  min_score DECIMAL(6,2) NOT NULL,
  year INTEGER NOT NULL,
  source_url TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ,
  UNIQUE(university_name, major, year)
);
```

#### Assessment & Analytics Tables

```sql
-- Individual question attempts
attempts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles,
  question_id UUID REFERENCES questions,
  module_id UUID REFERENCES modules,

  -- Context
  context_type TEXT,               -- baseline | drill | mock | recycle | flashcard | swipe
  context_id TEXT,

  -- Response data
  user_answer JSONB,
  is_correct BOOLEAN,
  time_spent_sec INTEGER,

  -- Points
  points_awarded INTEGER,

  created_at TIMESTAMPTZ
);

-- Error tags applied to attempts
attempt_error_tags (
  attempt_id UUID REFERENCES attempts,
  tag_id TEXT,
  source TEXT,                     -- 'rule' | 'ai' | 'manual'
  PRIMARY KEY (attempt_id, tag_id)
);

-- Module completion records
module_completions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles,
  module_id UUID REFERENCES modules,
  module_type TEXT,

  score FLOAT,
  passed BOOLEAN,
  attempts_count INTEGER DEFAULT 1,
  weak_skills JSONB,

  completed_at TIMESTAMPTZ
);

-- Point-in-time analytics
analytics_snapshots (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles,
  scope TEXT,                      -- partial_baseline | full_baseline | cycle_end | checkpoint

  readiness FLOAT,
  target_campus_score FLOAT,
  readiness_vs_target FLOAT,

  constructs JSONB,
  coverage JSONB,
  weak_skills JSONB,
  error_patterns JSONB,

  created_at TIMESTAMPTZ
);
```

#### Plan & Progress Tables

```sql
-- Study plan cycles
plan_cycles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles,
  cycle_index INTEGER,
  status TEXT DEFAULT 'active',
  task_count INTEGER DEFAULT 5,
  completed_task_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ
);

-- Tasks within a cycle
plan_tasks (
  id UUID PRIMARY KEY,
  cycle_id UUID REFERENCES plan_cycles,
  module_id UUID REFERENCES modules,

  status TEXT DEFAULT 'todo',      -- todo | in_progress | passed | failed
  is_required BOOLEAN DEFAULT TRUE,
  order_index INTEGER,
  score FLOAT,
  attempts INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Recycle checkpoints
recycle_checkpoints (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles,
  cycle_id UUID REFERENCES plan_cycles,
  status TEXT DEFAULT 'locked',

  module_ids JSONB,
  completed_module_ids JSONB,

  created_at TIMESTAMPTZ
);
```

#### Tanya Gaspol Tables (NEW in v3)

```sql
-- Chat messages for Tanya Gaspol AI assistant
tanya_gaspol_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES taxonomy_nodes(id) ON DELETE CASCADE,

  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  message TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tanya_gaspol_user_skill ON tanya_gaspol_chats(user_id, skill_id);

-- Token quota tracking for Tanya Gaspol
tanya_gaspol_quota (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_tokens INTEGER NOT NULL DEFAULT 100,
  used_tokens INTEGER NOT NULL DEFAULT 0,
  remaining_tokens INTEGER GENERATED ALWAYS AS (total_tokens - used_tokens) STORED,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**RLS policies for Tanya Gaspol:**

- `SELECT/INSERT` on `tanya_gaspol_chats` where `user_id = auth.uid()`
- `SELECT` on `tanya_gaspol_quota` where `user_id = auth.uid()`
- `UPDATE` on `tanya_gaspol_quota` via service role only (from API)

#### Flashcard Spaced Repetition Tables (NEW in v3)

```sql
-- Flashcard user state for spaced repetition (SM-2 inspired)
flashcard_user_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES taxonomy_nodes(id) ON DELETE CASCADE,

  -- SM-2 scheduling fields
  ease_factor DECIMAL(4,2) NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  due_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Mastery classification
  mastery_bucket TEXT NOT NULL DEFAULT 'forgot'
    CHECK (mastery_bucket IN ('forgot', 'hard', 'good', 'easy')),

  -- Stats
  total_reviews INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, skill_id)
);

CREATE INDEX idx_flashcard_state_due ON flashcard_user_state(user_id, due_at);
CREATE INDEX idx_flashcard_state_bucket ON flashcard_user_state(user_id, mastery_bucket);
```

**RLS policies for flashcard_user_state:**

- `SELECT/INSERT/UPDATE` where `user_id = auth.uid()`

#### Admin & AI Tables

```sql
-- AI operation logs
ai_runs (
  id UUID PRIMARY KEY,
  job_type TEXT,
  model TEXT,
  prompt_version TEXT,

  input_json JSONB,
  output_json JSONB,

  tokens_in INTEGER,
  tokens_out INTEGER,
  cost_estimate NUMERIC,

  requires_confirmation BOOLEAN DEFAULT FALSE,
  confirmed_by UUID REFERENCES profiles,
  confirmed_at TIMESTAMPTZ,

  status TEXT,
  error_message TEXT,

  created_by UUID REFERENCES profiles,
  created_at TIMESTAMPTZ
);

-- AI settings (provider/model config)
ai_settings (
  id UUID PRIMARY KEY,
  provider TEXT NOT NULL,          -- anthropic | openai | gemini
  api_key TEXT,
  model TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

---

## 7. Business Logic & Algorithms

### 7.1 Package Days Calculation

```typescript
function calculatePackageDays(examDate: Date): number {
  const today = new Date()
  const diffTime = examDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(1, diffDays)
}
```

### 7.2 Point System & Coverage Logic

```typescript
const DIFFICULTY_POINTS = {
  L1: 1, // Easy
  L2: 2, // Medium
  L3: 5, // Hard/HOTS
} as const

const COVERAGE_THRESHOLD = 20

function calculatePointsAwarded(
  isCorrect: boolean,
  difficultyLevel: "L1" | "L2" | "L3",
): number {
  if (!isCorrect) return 0
  return DIFFICULTY_POINTS[difficultyLevel]
}

function isSkillCovered(skillState: UserSkillState): boolean {
  return skillState.total_points >= COVERAGE_THRESHOLD
}

function isSubtopicCovered(
  subtopicId: string,
  allSkillStates: UserSkillState[],
  taxonomyNodes: TaxonomyNode[],
): boolean {
  const childSkills = taxonomyNodes.filter(
    (n) => n.parent_id === subtopicId && n.level === 5,
  )
  return childSkills.every((skill) => {
    const state = allSkillStates.find((s) => s.taxonomy_node_id === skill.id)
    return state && state.total_points >= COVERAGE_THRESHOLD
  })
}
```

### 7.3 Module Pass/Fail Logic

```typescript
function evaluateModuleCompletion(
  attempts: Attempt[],
  passThreshold: number = 0.7,
): ModuleResult {
  const totalQuestions = attempts.length
  const correctAnswers = attempts.filter((a) => a.is_correct).length
  const score = correctAnswers / totalQuestions
  const passed = score >= passThreshold

  const weakSkills = passed
    ? []
    : attempts
        .filter((a) => !a.is_correct)
        .map((a) => a.question.micro_skill_id)
        .filter((v, i, a) => a.indexOf(v) === i)

  return {
    score: score * 100,
    passed,
    weakSkills,
    materialCardsToReview: weakSkills,
  }
}
```

### 7.4 Readiness Score Calculation

```typescript
function calculateReadinessScore(
  skillStates: UserSkillState[],
  targetCampusScore: number | null,
  constructs: ConstructScores,
): ReadinessResult {
  const totalSkills = skillStates.length
  const coveredSkills = skillStates.filter((s) => s.total_points >= 20).length
  const coveragePercent = (coveredSkills / totalSkills) * 100

  const totalPossiblePoints = totalSkills * 20
  const totalEarnedPoints = skillStates.reduce(
    (sum, s) => sum + s.total_points,
    0,
  )
  const progressPercent = (totalEarnedPoints / totalPossiblePoints) * 100

  const readiness = coveragePercent * 0.7 + progressPercent * 0.3
  const vsTarget = targetCampusScore
    ? (readiness / targetCampusScore) * 100
    : null

  return {
    readiness: Math.round(readiness),
    coveredSkills,
    totalSkills,
    totalPoints: totalEarnedPoints,
    targetCampusScore,
    vsTarget,
    constructs,
    status:
      vsTarget !== null
        ? vsTarget >= 100
          ? "on_track"
          : "needs_improvement"
        : "no_target",
  }
}
```

### 7.5 Plan Generation Algorithm

```typescript
function generatePlanCycle(
  analytics: AnalyticsSnapshot,
  profile: Profile,
  cycleIndex: number,
): PlanCycle {
  const TASK_COUNT = 5
  const uncoveredSkills = analytics.weak_skills
    .filter((s) => s.current_points < 20)
    .sort((a, b) => a.current_points - b.current_points)
    .slice(0, 15)

  const weakTopics = groupByTopic(uncoveredSkills)
  const taskModules = weakTopics
    .slice(0, TASK_COUNT)
    .map((topic) => findOrCreateDrillModule(topic))

  const tasks = taskModules.map((module, index) => ({
    type: "drill",
    module_id: module.id,
    title: module.title,
    is_required: true,
    order_index: index,
    status: "todo",
    target_skills: module.micro_skill_ids,
  }))

  return { cycle_index: cycleIndex, tasks, status: "active" }
}
```

### 7.6 Recycle Module Generation

```typescript
function generateRecycleModules(
  analytics: AnalyticsSnapshot,
  previousCycleId: string,
): RecycleModule[] {
  const stillUncovered = analytics.weak_skills
    .filter((s) => s.current_points < 20)
    .sort((a, b) => a.current_points - b.current_points)

  const weakTopics = groupByTopic(stillUncovered)
  return weakTopics.slice(0, 3).map((topic) => ({
    type: "recycle",
    topic_id: topic.id,
    micro_skill_ids: topic.weakSkills.map((s) => s.id),
    question_count: Math.min(10, topic.weakSkills.length * 2),
    includeControlItems: true,
  }))
}
```

### 7.7 Error Tag Derivation (Rule-Based)

```typescript
function deriveErrorTags(attempt: Attempt, question: Question): string[] {
  const tags: string[] = []
  const expectedTime = question.expected_time_sec
  const actualTime = attempt.time_spent_sec

  if (actualTime > expectedTime * 1.5) tags.push("ERR.SLOW")
  if (actualTime < expectedTime * 0.3) tags.push("ERR.RUSHED")
  if (!attempt.is_correct && actualTime < expectedTime * 0.6)
    tags.push("ERR.CARELESS")
  if (!attempt.is_correct && actualTime > expectedTime * 1.3)
    tags.push("ERR.CONCEPT_GAP")

  return tags
}
```

### 7.8 Skill State Update (Per Answer)

```typescript
function updateSkillState(
  currentState: UserSkillState | null,
  attempt: Attempt,
  question: Question,
): UserSkillState {
  const pointsAwarded = attempt.is_correct
    ? DIFFICULTY_POINTS[question.difficulty_level]
    : 0

  const base = currentState || {
    user_id: attempt.user_id,
    taxonomy_node_id: question.micro_skill_id,
    total_points: 0,
    accuracy: 0,
    speed_avg: 0,
    attempts_count: 0,
    correct_count: 0,
    l1_correct: 0,
    l2_correct: 0,
    l3_correct: 0,
  }

  const newAttemptsCount = base.attempts_count + 1
  const newCorrectCount = base.correct_count + (attempt.is_correct ? 1 : 0)
  const newAccuracy = newCorrectCount / newAttemptsCount
  const newSpeedAvg =
    base.speed_avg === 0
      ? attempt.time_spent_sec
      : (base.speed_avg * base.attempts_count + attempt.time_spent_sec) /
        newAttemptsCount

  return {
    ...base,
    total_points: base.total_points + pointsAwarded,
    accuracy: newAccuracy,
    speed_avg: newSpeedAvg,
    attempts_count: newAttemptsCount,
    correct_count: newCorrectCount,
    [`l${question.difficulty_level.slice(1)}_correct`]:
      (base[`l${question.difficulty_level.slice(1)}_correct`] as number) +
      (attempt.is_correct ? 1 : 0),
    last_seen_at: new Date().toISOString(),
  }
}
```

### 7.9 Flashcard SM-2 Scheduling (NEW in v3)

```typescript
interface FlashcardState {
  ease_factor: number
  interval_days: number
  reps: number
  due_at: Date
  mastery_bucket: "forgot" | "hard" | "good" | "easy"
}

function updateFlashcardState(
  current: FlashcardState,
  response: "forgot" | "hard" | "good" | "easy",
): FlashcardState {
  const state = { ...current }
  const now = new Date()

  switch (response) {
    case "forgot":
      state.reps = 0
      state.interval_days = 0
      state.ease_factor = Math.max(1.3, state.ease_factor - 0.2)
      state.due_at = new Date(now.getTime() + 10 * 60 * 1000) // 10 min delay
      state.mastery_bucket = "forgot"
      break

    case "hard":
      state.reps += 1
      state.interval_days = Math.max(1, Math.round(state.interval_days * 1.2))
      state.ease_factor = Math.max(1.3, state.ease_factor - 0.15)
      state.due_at = addDays(now, state.interval_days)
      state.mastery_bucket = "hard"
      break

    case "good":
      state.reps += 1
      if (state.reps === 1) state.interval_days = 1
      else if (state.reps === 2) state.interval_days = 3
      else
        state.interval_days = Math.round(
          state.interval_days * state.ease_factor,
        )
      state.due_at = addDays(now, state.interval_days)
      state.mastery_bucket = "good"
      break

    case "easy":
      state.reps += 1
      state.interval_days = Math.round(
        state.interval_days * (state.ease_factor + 0.3),
      )
      state.ease_factor += 0.15
      state.due_at = addDays(now, state.interval_days)
      state.mastery_bucket = "easy"
      break
  }

  return state
}
```

---

## 8. Technical Architecture

### 8.1 Technology Stack

| Layer                  | Technology                   | Rationale                            |
| ---------------------- | ---------------------------- | ------------------------------------ |
| **Frontend Framework** | Next.js 14 (App Router)      | SSR, RSC, API routes, great DX       |
| **Language**           | TypeScript                   | Type safety, better tooling          |
| **Styling**            | Tailwind CSS                 | Utility-first, rapid development     |
| **UI Components**      | shadcn/ui                    | Customizable, accessible components  |
| **State (Client)**     | Zustand                      | Simple, performant local state       |
| **State (Server)**     | TanStack React Query         | Caching, optimistic updates          |
| **Database**           | Supabase (PostgreSQL)        | Auth + DB + Storage + Edge Functions |
| **Auth**               | Supabase Auth                | Built-in, JWT-based                  |
| **Edge Functions**     | Deno (TypeScript)            | Secure server-side logic             |
| **Charts**             | Recharts                     | Flexible, React-native charting      |
| **AI Provider**        | Configurable via ai_settings | Anthropic Claude / OpenAI / Gemini   |
| **i18n**               | Custom (lib/i18n)            | Indonesian + English                 |

### 8.2 System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Next.js App (SSR/CSR)                     │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │ │
│  │  │ Student App  │  │ Admin Console│  │ Auth Pages   │      │ │
│  │  │  Plan/Drill  │  │   Content    │  │   Login      │      │ │
│  │  │  Review/Anly │  │   Pipeline   │  │   Signup     │      │ │
│  │  │  Pembahasan  │  │              │  │              │      │ │
│  │  │  TanyaGaspol │  │              │  │              │      │ │
│  │  │  Flashcards  │  │              │  │              │      │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │ │
│  └─────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────┬──────────────────────────────┘
                                    │ HTTPS
                                    ▼
┌──────────────────────────────────────────────────────────────────┐
│                        SUPABASE                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    PostgreSQL Database                      │  │
│  │   Profiles, Taxonomy, Questions, Material Cards,           │  │
│  │   Modules, Campus Scores, Attempts, Analytics,             │  │
│  │   Tanya Gaspol Chats/Quota, Flashcard User State          │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                     Edge Functions                          │  │
│  │   • submit_attempt      • generate_plan                    │  │
│  │   • finalize_checkpoint • research_exam (AI)               │  │
│  │   • generate_snapshot   • generate_questions (AI)          │  │
│  │   • generate_material_cards (AI)                           │  │
│  │   • generate_flashcards (AI)                               │  │
│  │   • create_recycle_checkpoint                              │  │
│  │   • suggest_metadata    • suggest_taxonomy_node            │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 8.3 API Routes

| Route                                | Method | Purpose                                     | Auth  |
| ------------------------------------ | ------ | ------------------------------------------- | ----- |
| `/api/submit-attempt`                | POST   | Submit question answer + update skill state | User  |
| `/api/finalize-baseline-module`      | POST   | Complete baseline module, check pass        | User  |
| `/api/generate-plan`                 | POST   | Generate 5-task study cycle                 | User  |
| `/api/generate-snapshot`             | POST   | Create analytics snapshot                   | User  |
| `/api/create-recycle-checkpoint`     | POST   | Create recycle checkpoint                   | User  |
| `/api/tanya-gaspol`                  | POST   | Send question to AI, get response (NEW)     | User  |
| `/api/flashcard-review`              | POST   | Update flashcard SM-2 state (NEW)           | User  |
| `/api/admin/research-exam`           | POST   | Trigger AI research                         | Admin |
| `/api/admin/generate-questions`      | POST   | Generate questions (AI)                     | Admin |
| `/api/admin/generate-material-cards` | POST   | Generate Material Cards (AI)                | Admin |
| `/api/admin/generate-flashcards`     | POST   | Generate flashcard content (AI)             | Admin |
| `/api/admin/suggest-metadata`        | POST   | AI metadata suggestions                     | Admin |
| `/api/admin/suggest-taxonomy-node`   | POST   | AI taxonomy suggestions                     | Admin |
| `/api/admin/generate-taxonomy-tree`  | POST   | Generate full taxonomy tree (AI)            | Admin |

### 8.4 Edge Functions

| Function                    | Trigger      | AI       | Purpose                                 |
| --------------------------- | ------------ | -------- | --------------------------------------- |
| `submit_attempt`            | API Route    | No       | Process answer, update skill state      |
| `finalize_checkpoint`       | API Route    | No       | Calculate pass/fail, return weak skills |
| `generate_plan`             | API Route    | No       | Create 5-task cycle from weak skills    |
| `generate_snapshot`         | API Route    | No       | Create analytics snapshot               |
| `create_recycle_checkpoint` | API Route    | No       | Create recycle assessment               |
| `research_exam`             | Admin Action | Yes (5x) | Full exam research (incl. exam date)    |
| `generate_questions`        | Admin Action | Yes      | AI question generation                  |
| `generate_material_cards`   | Admin Action | Yes      | AI Material Card generation             |
| `generate_flashcards`       | Admin Action | Yes      | AI flashcard content generation         |
| `suggest_metadata`          | Admin Action | Yes      | AI metadata suggestions                 |
| `suggest_taxonomy_node`     | Admin Action | Yes      | AI taxonomy node suggestions            |

### 8.5 File Structure

```
gaspol/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (student)/
│   │   ├── plan/                  # Timeline view (baseline + tasks + recycle)
│   │   ├── drill/                 # Two-tab module listing (restructured in v3)
│   │   │   ├── page.tsx           # Main drill page (Topic-Based + Mixed tabs)
│   │   │   ├── drill/[taskId]/    # QuestionRunner for a specific module
│   │   │   └── pembahasan/        # Pembahasan (answer review) page (NEW)
│   │   ├── review/                # Material Cards + Flashcards
│   │   │   ├── page.tsx           # Skill tree with material card links
│   │   │   ├── [skillId]/         # Material Card detail + Tanya Gaspol
│   │   │   └── flashcards/        # Flashcard SR mastery stacks (restructured)
│   │   ├── analytics/             # Deep analytics
│   │   ├── onboarding/
│   │   ├── baseline/
│   │   ├── recycle/
│   │   └── settings/
│   ├── admin/
│   │   ├── exams/
│   │   ├── taxonomy/
│   │   ├── questions/
│   │   ├── materials/             # Material Card management
│   │   ├── modules/               # Module composition (drill_focus + drill_mixed)
│   │   ├── campus/                # Campus scores
│   │   ├── flashcards/            # Flashcard content management
│   │   ├── ai-runs/               # AI operations + settings
│   │   ├── baseline/
│   │   ├── metadata/
│   │   ├── debug/
│   │   └── diagnostics/
│   └── api/
│       ├── submit-attempt/
│       ├── finalize-baseline-module/
│       ├── generate-plan/
│       ├── generate-snapshot/
│       ├── create-recycle-checkpoint/
│       ├── tanya-gaspol/           # NEW — AI chat endpoint
│       ├── flashcard-review/       # NEW — SM-2 state update
│       └── admin/
│           ├── research-exam/
│           ├── generate-questions/
│           ├── generate-material-cards/
│           ├── generate-flashcards/
│           ├── suggest-metadata/
│           ├── suggest-taxonomy-node/
│           └── generate-taxonomy-tree/
├── components/
│   ├── assessment/                # QuestionRunner, answer components
│   ├── analytics/                 # Charts, scores
│   ├── plan/                      # Timeline components
│   ├── review/                    # MaterialCard, FlashcardStack, TanyaGaspol
│   ├── navigation/                # TopNav, BottomNav
│   ├── admin/                     # Admin-specific components
│   ├── providers/                 # React context providers
│   └── ui/                        # shadcn/ui
├── lib/
│   ├── supabase/
│   ├── analytics/
│   ├── i18n/
│   ├── state-machine/
│   ├── hooks/
│   └── utils/
├── hooks/
├── supabase/
│   ├── migrations/
│   └── functions/
├── prompts/
├── docs/
└── tests/
```

---

## 9. Forking for Other Content Types

### 9.1 Platform Adaptability

The Gaspol architecture is designed to be **exam-agnostic**. The same codebase can be forked and configured for any standardized test by:

1. Creating a new exam record
2. Running the AI research pipeline (5 batches)
3. Generating content (questions + Material Cards)
4. Setting up campus/institution score database (if applicable)

### 9.2 Supported Use Cases

| Content Type                    | Examples                      | Notes                           |
| ------------------------------- | ----------------------------- | ------------------------------- |
| **Entrance Exams**              | UTBK, SAT, ACT, GRE, GMAT     | Full campus score comparison    |
| **Professional Certifications** | PMP, AWS, CFA, Bar Exam       | Pass/fail threshold instead     |
| **Language Tests**              | TOEFL, IELTS, JLPT            | Score bands instead of campuses |
| **School Curriculum**           | Math, Science, History        | Grade-based targets             |
| **Corporate Training**          | Compliance, Product Knowledge | Competency-based                |

### 9.3 What Stays the Same

- User authentication flow
- Timeline-based journey (baseline → plan → tasks → recycle)
- Assessment engine (QuestionRunner)
- Material Card system + Tanya Gaspol
- Flashcard spaced repetition
- Analytics pipeline
- Plan generation algorithm
- Admin console structure
- Design system

### 9.4 What Changes Per Exam

| Component          | Customization                         |
| ------------------ | ------------------------------------- |
| **Taxonomy**       | 5-level hierarchy specific to exam    |
| **Constructs**     | Cognitive dimensions relevant to exam |
| **Material Cards** | Content specific to each micro-skill  |
| **Campus Scores**  | Replace with relevant target metrics  |
| **Question Types** | May need new formats                  |
| **Time Config**    | Per-question timing varies            |
| **Branding**       | Logo, colors, messaging               |
| **AI Prompts**     | Tanya Gaspol system prompt adjusted   |

---

## 10. AI Code Generation Prompt

Use the following prompt to generate the complete Gaspol codebase using an AI coding assistant:

---

```markdown
# AI Code Generation Prompt: Adaptive Learning Platform v3

You are a senior full-stack development team building a mobile-first adaptive learning platform.

## Project Overview

Build an adaptive learning platform with:

- Timeline-based journey: Baseline → Plan → Tasks → Recycle (loop)
- Complete micro-skill coverage testing
- Point-based coverage system (L1=1pt, L2=2pt, L3=5pt; 20pts = covered)
- Material Cards for learning content + Tanya Gaspol AI chat
- Flashcard spaced repetition (Anki-like SM-2)
- Campus/target score comparison
- 70% pass threshold for modules
- Real-time profile updates on every answer submission

## Tech Stack

| Layer    | Technology                     |
| -------- | ------------------------------ |
| Frontend | Next.js 14 (App Router) + TS   |
| Styling  | Tailwind CSS + shadcn/ui       |
| Theme    | Soft Neubrutalism              |
| State    | Zustand + TanStack React Query |
| Backend  | Supabase (PostgreSQL + Auth)   |
| AI       | Configurable (ai_settings)     |

## Student Navigation (4 tabs)

1. **Plan** (`/plan`) - Timeline: baseline → tasks → recycle
2. **Drill** (`/drill`) - Two tabs: Topic-Based Modules + Mixed Drills
   - Mandatory tasks pinned at top
   - Module result + Pembahasan page
3. **Review** (`/review`) - Material Cards + Tanya Gaspol + Flashcards
4. **Analytics** (`/analytics`) - Readiness, constructs, coverage, weak skills

## Key Additional Features (v3)

- Pembahasan page: post-module answer review with explanations + material card links
- Tanya Gaspol: AI chat per material card, 100 token quota, preset questions
- Flashcard SR: Anki-like with mastery stacks (Forgot/Hard/Good/Easy), SM-2 scheduling
- Drill restructure: accordion grouping by taxonomy, advanced filtering

## Database (new tables in v3)

- tanya_gaspol_chats (user_id, skill_id, role, message, tokens_used)
- tanya_gaspol_quota (user_id, total_tokens=100, used_tokens)
- flashcard_user_state (user_id, skill_id, ease_factor, interval_days, reps, due_at, mastery_bucket)
```

---

## 11. Appendix

### A. Glossary

| Term                   | Definition                                                   |
| ---------------------- | ------------------------------------------------------------ |
| **Baseline**           | Initial assessment testing ALL micro-skills                  |
| **Package Days**       | Auto-calculated days from exam date to today                 |
| **Material Card**      | Learning content: core idea, facts, common mistakes, example |
| **Micro-skill**        | Level 5 taxonomy node, smallest learnable unit               |
| **Pass Threshold**     | 70% correct required to pass a module                        |
| **Recycle**            | Targeted re-assessment after completing plan tasks           |
| **Delta Analytics**    | Before/after comparison of analytics snapshots               |
| **Campus Score**       | Target university/program minimum passing score              |
| **Difficulty Level**   | L1 (Easy), L2 (Medium), L3 (Hard/HOTS) — determines points   |
| **Point Value**        | Points awarded on correct answer: L1=1, L2=2, L3=5           |
| **Coverage Threshold** | 20 points required to "cover" a micro-skill                  |
| **Covered Skill**      | Micro-skill with ≥20 accumulated correct-answer points       |
| **Covered Subtopic**   | Level-4 node where ALL child micro-skills are covered        |
| **Real-time Profile**  | User skill state updated immediately on every answer         |
| **Pembahasan**         | Answer review page showing explanations per question         |
| **Tanya Gaspol**       | AI chat assistant scoped to material cards                   |
| **Mastery Bucket**     | Flashcard classification: forgot / hard / good / easy        |
| **SM-2**               | Spaced repetition algorithm (SuperMemo 2 inspired)           |
| **Ease Factor**        | SM-2 multiplier for interval growth (default 2.5)            |
| **Due Date**           | Next scheduled review date for a flashcard                   |

---

## 12. Version History

| Version | Date       | Changes                                                                                                                                                                                                    |
| ------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | 2026-03-03 | Initial blueprint creation                                                                                                                                                                                 |
| 2.0     | 2026-03-03 | Major restructure: timeline view, Material Cards, nav change (Plan/Drill/Review/Analytics), exam date input, campus scores, 70% threshold                                                                  |
| 2.1     | 2026-03-03 | Point-based coverage system (L1=1pt, L2=2pt, L3=5pt; 20pts = covered), real-time profile updates on every answer, subtopic coverage logic                                                                  |
| 3.0     | 2026-03-05 | Drill page restructure (two-tab layout, accordion grouping), Pembahasan page, Tanya Gaspol AI chat, Flashcard spaced repetition revamp (SM-2), bug tracking section, Material Card navigation improvements |

---

## 13. Known Issues (as of v3)

### B-001: Drill Route Redundancy

- **Severity:** P2
- **Description:** The app currently has both `/drill` and `/drill/drills` routes. With the new two-tab drill page design, `/drill/drills` (and `/drill/modules`, `/drill/mock`, `/drill/review`) are redundant sub-routes.
- **Repro steps:**
  1. Navigate to the Drill tab
  2. Observe that `/drill` is the main page
  3. Note that `/drill/drills`, `/drill/modules`, `/drill/mock`, `/drill/review` also exist as separate pages
- **Expected:** Single `/drill` page with all content organized into two tabs (Topic-Based + Mixed Drills)
- **Actual:** Multiple sub-routes exist, creating navigation confusion and redundant code
- **Likely cause:** Incremental feature additions created separate pages for different drill views
- **Proposed fix:**
  1. Consolidate all drill listing logic into `/drill/page.tsx`
  2. Remove `/drill/drills/`, `/drill/modules/`, `/drill/mock/`, `/drill/review/` pages
  3. Keep `/drill/drill/[taskId]/` for the QuestionRunner
  4. Add `/drill/pembahasan/` for the answer review page
  5. Update navigation references
- **Files/areas:**
  - `app/(student)/drill/drills/page.tsx` — remove
  - `app/(student)/drill/drills/practice/page.tsx` — remove
  - `app/(student)/drill/modules/page.tsx` — remove
  - `app/(student)/drill/mock/page.tsx` — remove (or integrate as tab filter)
  - `app/(student)/drill/review/page.tsx` — remove
  - `app/(student)/drill/page.tsx` — restructure
- **Regression test:** After cleanup, verify that all module types are accessible from the unified drill page and no dead links exist
- **Workaround:** Currently functional — users can access modules from either route

---

### B-002: Filter Labels Show i18n Keys

- **Severity:** P1
- **Description:** On the Drill page, the filter tab labels display raw i18n keys ("filter.all", "filter.required", "filter.completed") instead of human-readable text. The `tc()` helper does have fallback values but they may not be rendering correctly.
- **Repro steps:**
  1. Navigate to `/drill`
  2. Look at the filter chips/tabs
  3. See "filter.all", "filter.required", "filter.completed" instead of "All", "Required Tasks", "Completed"
- **Expected:** Tabs show "All", "Required Tasks", "Completed"
- **Actual:** Tabs show "filter.all", "filter.required", "filter.completed"
- **Likely cause:** The `tc()` i18n function is not resolving the keys. Fallback values exist in the code (`{ fallback: "All" }`) but the translation helper may not be using them.
- **Proposed fix:** Either fix the i18n resolution logic in `lib/i18n/` to correctly use fallbacks, or hardcode the labels as strings since they don't need translation (the app is Indonesian-first).
- **Files/areas:**
  - `app/(student)/drill/page.tsx` — line ~227-234 where `tc("filter.all", ...)` is called
  - `lib/i18n/` — translation resolution logic
- **Regression test:** Verify all filter labels display correctly in both languages
- **Workaround:** None — labels are currently unreadable

---

### B-003: Answer Check Always Returns Wrong (0 Points)

- **Severity:** P0 (Critical)
- **Description:** When users submit answers during drill modules, all answers are scored as incorrect (0 points). The error message "Failed to save attempt" appears. This completely breaks the learning flow.
- **Repro steps:**
  1. Start any drill module
  2. Answer a question (select correct answer)
  3. Submit the answer
  4. Observe error: `attempt failed: {"error":"Failed to save attempt"}`
  5. All questions show 0 points regardless of correctness
- **Expected:** Correct answers award points (L1=1, L2=2, L3=5), incorrect answers award 0
- **Actual:** All answers return 0 points with "Failed to save attempt" error
- **Likely cause:** Based on code inspection of `app/api/submit-attempt/route.ts`:
  - The attempt insert may be failing due to a constraint violation (e.g., duplicate `context_id`, missing required fields, or data type mismatch)
  - The `context_id` normalization logic creates a fallback ID like `baseline-<timestamp>` which may conflict with UUID constraints
  - Possible: `question_id` is being sent as a different type than what the DB expects
  - The `is_active` check on questions may be filtering out valid questions
  - RLS policies may be blocking the service role insert (unlikely since service role bypasses RLS)
- **Proposed fix:**
  1. Add detailed error logging in the catch block to surface the exact Supabase error
  2. Verify the `attempts` table constraints match the data being inserted
  3. Check that `context_id` type/format matches what the table expects
  4. Verify questions have `is_active = true` and valid `difficulty_level`
  5. Test with direct Supabase insert to isolate client vs. server issue
- **Files/areas:**
  - `app/api/submit-attempt/route.ts` — main suspect (lines ~196-230, attempt insert)
  - `app/(student)/drill/drill/[taskId]/page.tsx` — sends the attempt
  - `app/(student)/drill/drills/practice/page.tsx` — also sends attempts
  - `app/(student)/baseline/[moduleId]/page.tsx` — baseline attempt submission
  - `supabase/migrations/001_initial_schema.sql` — attempts table definition
- **Regression test:** After fix, verify:
  - Correct answers award proper points (1/2/5 based on difficulty)
  - Incorrect answers award 0 points
  - `user_skill_state.total_points` increments correctly
  - `is_covered` flips to true at 20 points
- **Workaround:** None — this blocks all drill/practice functionality

---

### B-004: Flashcard Labels Show i18n Keys

- **Severity:** P1
- **Description:** The flashcard review component (`FlashcardStack.tsx`) displays raw i18n keys instead of translated text. Affected keys: "flashcards.cardOf", "flashcards.tapToFlip", "flashcards.tapToFlipBack", "flashcards.howWell", "flashcards.forgot", "flashcards.hard", "flashcards.good", "flashcards.easy".
- **Repro steps:**
  1. Navigate to `/review/flashcards` or `/review/swipe`
  2. Start a flashcard review session
  3. See raw i18n keys instead of text labels
- **Expected:** Proper labels (e.g., "Card 1 of 10", "Tap to flip", "How well did you know this?", "Forgot", "Hard", "Good", "Easy")
- **Actual:** Shows "flashcards.cardOf", "flashcards.tapToFlip", etc.
- **Likely cause:** Same i18n resolution issue as B-002. The `t()` function cannot resolve the flashcard keys.
- **Proposed fix:** Hardcode the Indonesian labels directly in the component, since the app targets Indonesian users. Or fix the i18n system to properly resolve these keys.
- **Files/areas:**
  - `components/review/FlashcardStack.tsx` — all `t('flashcards.*')` calls
  - `lib/i18n/` — translation resolution logic
- **Regression test:** Verify all flashcard text displays correctly
- **Workaround:** None — labels are unreadable

---

### B-005: Flashcard Status Buttons Overflow

- **Severity:** P2
- **Description:** The 4 mastery response buttons (Forgot, Hard, Good, Easy) in the flashcard review overflow outside the page boundaries on mobile screens.
- **Repro steps:**
  1. Open flashcard review on a mobile device or narrow viewport
  2. Flip a card to see the answer
  3. Observe the 4 buttons at the bottom
  4. Buttons extend beyond the right edge of the screen
- **Expected:** All 4 buttons fit within the page width, equally distributed
- **Actual:** Buttons overflow horizontally, creating a horizontal scroll or being cut off
- **Likely cause:** The button container likely uses `flex` without `flex-wrap` or has fixed widths that exceed the viewport. The button labels may also be too long without truncation.
- **Proposed fix:**
  1. Use `flex flex-row gap-2 w-full` on the button container
  2. Each button should use `flex-1` for equal distribution
  3. Reduce padding or font size on mobile if needed
  4. Test with narrowest supported viewport (320px)
- **Files/areas:**
  - `components/review/FlashcardStack.tsx` — button container styling (around line 128-145)
- **Regression test:** Verify buttons fit on 320px, 375px, and 414px viewports
- **Workaround:** View on desktop or wider screen

---

**Document End**
