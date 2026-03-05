# Gaspol Project Blueprint v2

**Comprehensive Documentation for Project Recreation**

> ⚠️ **SOURCE OF TRUTH**: This document is the authoritative reference for all Gaspol product decisions, data models, and business logic. When in doubt, defer to this document.

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

---

## 1. Executive Summary

### 1.1 What is Gaspol?

Gaspol is a **mobile-first adaptive learning platform** designed for last-minute exam preparation. The platform combines **deep cognitive analytics**, **personalized study plans**, and an **AI-powered content pipeline** to maximize learning efficiency within constrained timeframes (calculated from exam date).

### 1.2 Core Value Proposition

**"Maximize exam readiness through personalized, data-driven preparation in limited time."**

The platform differentiates itself through:

1. **Cognitive Profiling** - Measures 5 cognitive constructs (Attention, Speed, Reasoning, Computation, Reading)
2. **Adaptive Learning** - Dynamically adjusts content based on real-time performance
3. **Complete Micro-skill Coverage** - Baseline tests ALL level-5 skills through topic-based modules
4. **Point-Based Mastery System** - Questions weighted by difficulty (Easy=1pt, Medium=2pt, Hard=5pt); 20 points = skill covered
5. **Material Cards** - Structured learning content (core idea, facts, common mistakes, examples) for every micro-skill
6. **Campus-Targeted Readiness** - Score comparison against target university requirements
7. **Timeline-Based Journey** - Clear progression from baseline → plan → tasks → recycle → repeat
8. **Real-Time Profile Updates** - Every module completion updates user skill state and analytics
9. **Cost-Efficient AI** - Strategic AI usage for content ops, not per-question diagnosis

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

1. **Difficulty-Weighted Learning** - Hard questions prove deeper understanding, so they're worth more
2. **Multiple Paths to Coverage** - 20 easy, 10 medium, 4 hard, or any combination totaling ≥20
3. **Real Progress Tracking** - Partial progress (e.g., 15/20 pts) is visible and meaningful
4. **Fair Assessment** - Users can cover skills through their preferred difficulty level

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
- Mobile-first for learning anywhere
- Timeline visibility from baseline to exam day

**Pains Relieved:**

- Information overload → curated, prioritized content
- Time anxiety → clear daily plan with countdown
- Uncertainty about progress → quantified readiness vs target campus
- Generic feedback → specific error pattern analysis + Material Cards
- "Am I ready?" anxiety → campus-specific readiness score

### 2.3 Business Model

| Revenue Stream        | Description                                         |
| --------------------- | --------------------------------------------------- |
| **Package Tiers**     | Time-based access calculated from exam date         |
| **Freemium**          | Free baseline + limited content, paid for full plan |
| **B2B**               | School/bimbel partnerships                          |
| **Content Licensing** | White-label platform for other exams                |

### 2.4 Competitive Advantages

1. **Campus-Targeted Analytics** - Know if you can reach your target university
2. **Complete Micro-skill Coverage** - Every skill tested and tracked
3. **Material Cards** - Structured learning content for each micro-skill
4. **Adaptive Engine** - Plan adjusts based on performance
5. **Timeline Journey** - Clear progression visualization
6. **AI-Powered Content** - Scalable content generation
7. **Exam-Agnostic Architecture** - Replicable to any standardized test

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
│  • Review (Material Cards)  │    • Question Generation     │
│  • Analytics                │    • Material Card Gen (AI)  │
│                             │    • Module Composition      │
│                             │    • Campus Score Database   │
│                             │    • AI Operations Log       │
│                             │    • Diagnostics             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Two-Portal Architecture

**Student Portal** - Public-facing learning application

- Mobile-first responsive design
- Bottom navigation: **Plan, Drill, Review, Analytics**
- Timeline-based journey visualization
- Campus-targeted readiness tracking

**Admin Console** - Content management and operations

- Desktop-optimized sidebar navigation
- AI-assisted content pipeline (questions + Material Cards)
- Campus score database management (human-in-loop)
- Quality control and publishing workflows

### 3.3 Design System: Soft Neubrutalism

| Element          | Specification                                       |
| ---------------- | --------------------------------------------------- |
| **Cards**        | 2px charcoal border, 4px offset shadow, 16px radius |
| **Colors**       | Pastel surfaces (pink, lavender, mint, peach, sky)  |
| **Typography**   | Bold headers, high contrast, rounded sans-serif     |
| **Interactions** | Subtle lift on hover, quick press feedback          |
| **Mobile**       | Bottom nav, horizontal scrolling carousels          |

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

**Key Change:** User does NOT manually select package duration. The system auto-calculates `package_days = exam_date - current_date`.

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

**Example:**
If exam has 50 micro-skills across 5 topics:

- Module 1 (Topic A): 15 questions covering 10 micro-skills
- Module 2 (Topic B): 12 questions covering 8 micro-skills
- Module 3 (Topic C): 15 questions covering 12 micro-skills
- Module 4 (Topic D): 10 questions covering 8 micro-skills
- Module 5 (Topic E): 15 questions covering 12 micro-skills

**User Flow (Plan Page - Baseline View):**

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
5. Update `user_skill_state` (per micro-skill) - accumulate points, check coverage (20pt threshold)
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
   - Coverage Map (by level 4 - subtopic) - shows covered vs uncovered
   - Weak Skills List (level 5 - micro-skills below 20 points)
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

> **Example:** To cover a micro-skill (20 points), user could answer correctly:
>
> - 20 easy questions (20 × 1pt), or
> - 10 medium questions (10 × 2pt), or
> - 4 hard questions (4 × 5pt), or
> - Any combination totaling ≥20 points

**Readiness Score Formula:**

```typescript
// Readiness is based on coverage percentage + weighted progress
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

**Plan Task Generation:**

All 5 tasks are **drill modules** targeting weak micro-skills (points < 20):

- Select bottom 5 weak skill clusters (by topic) - ordered by total points
- Create/assign drill modules for each
- Each task = complete a specific drill module

---

#### Phase 4: PLAN_ACTIVE

**Entry Point:** `/plan` (same unified page, now showing tasks)

**Timeline View:**

```
┌─────────────────────────────────────────────────┐
│  PLAN PAGE - TIMELINE VIEW                       │
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
   - If failed: Show list of weak Material Cards, allow retry
7. Return to Plan page, see updated progress
8. All tasks complete → Unlock Recycle Assessment

> **IMPORTANT: Continuous Profile Updates**
> Unlike traditional learning apps that only assess at checkpoints, Gaspol updates the user's cognitive profile after EVERY question answered. This means:
>
> - Drill modules contribute points to micro-skills
> - User may reach 20pt coverage threshold during a drill module
> - Analytics reflect real-time knowledge state, not outdated snapshots

**Module Retry Flow (on failure):**

```
Complete Module → Score < 70%
      │
      ▼
┌─────────────────────────────────────────────┐
│  MODULE RESULT: Not Passed                  │
│  Score: 65% (need 70%)                      │
│                                             │
│  Review these concepts before retry:        │
│  ├── 📖 SPLDV - Linear Equations            │
│  ├── 📖 Quadratic Formula                   │
│  └── 📖 Factoring Polynomials               │
│                                             │
│  [View Material Cards] [Retry Module]       │
└─────────────────────────────────────────────┘
```

**Navigation Note:**

All tasks are drill modules. When user goes to **Drill** page, they see:

- All available modules
- Required task modules highlighted/pinned to top
- Completion status for each

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
3. On each question answer: **Update user profile immediately** (points, constructs, errors)
4. On each module completion: Update analytics, check new coverage
5. On all complete: Generate delta `analytics_snapshots`
6. Enable next plan generation

**Loop:** After generating next plan → return to PLAN_ACTIVE with new 5 tasks

---

### 4.3 Navigation Structure (Student Portal)

**Bottom Navigation (4 tabs):**

| Tab           | Route        | Purpose                                    |
| ------------- | ------------ | ------------------------------------------ |
| **Plan**      | `/plan`      | Timeline view: baseline → tasks → recycle  |
| **Drill**     | `/drill`     | List of all modules; complete task modules |
| **Review**    | `/review`    | Weak skills by topic + Material Cards      |
| **Analytics** | `/analytics` | Deep analytics dashboard                   |

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

- **Purpose:** Access all drill modules
- **Content:**
  - List of all available modules
  - Required task modules pinned/highlighted
  - Module cards with: title, topic, question count, estimated time, completion status
  - Filter: All / Required Tasks / Completed
  - Each module launches QuestionRunner

@@ FEATURE: The drill page should show a drill that act as an mandatory task in the plan page in the top, and two tabs: the topics based modules and the mixed drills modules.

When user click on the topics-based modules tab, it shows the list of modules that generated from admin that based on the level-5 (actually is not a topic, topic just for tab name. no need to confuse about this). This level-5 modules, is covered into accordion level-3 and all of accordion is grouped based on the level-2. The level-5 module card has this content: Level-5 name, level-4 tags, module number (if there is more then 1 module for the same level-5 skill), question count, estimated time, completion status.

When user click on the mixed drills modules tab, it shows the list of modules that generated from admin. It's on the level-3 module that covered in the group based on the level-2. The level-3 module contains of mixed level-5 skills question that already defined by admin. Check is the admin is already able to create this kind of module or not. If, not, please create this functionality in module admin page.

User can do filtering based on status (All, Required Tasks, and Completed). The required tasks is the module that already assigned in the plan page as a task. The completed is the module that user already completed. Can filter by level-3, level-4, and level-5. And user can search the module by name. User see the tick mark in the module card if the module is already completed. User see the warn mark in the module card if the module is assigned as a task in the plan page. User see nothing if the module is not assigned as a task in the plan page and also not completed yet.

When user click on the module card, there will be 2 cases:

If user has not completed the module, it will navigate to the question runner page with the question that already assigned to that module. The question in the module is not random, but it is the question that already assigned by admin in the admin console. So when user click on the module card, it will fetch the question that already assigned to that module and then render it in the question runner page.

If user has already completed the module, it will show the result page (we talk about result page below). When user click on "retry" button in the result page, it will navigate to the question runner page with the question that already assigned to that module. And make the status is not completed, so user can do the drill again.

@@ BUG: Currently we have /drill and /drill/drills. I think it will be redundant if we already implement the new approach. So we can just have /drill page.

@@ BUG: There are some bugs in naming which still has the "variable" instead of the name, such as "filter.all", "flter.required", "filter.completed". Please fix those to "All", "Required Tasks", "Completed" respectively.

@@ BUG: The answer check is not worked. User always has 0 points (all wrong answers). With this error msg: attempt failed: {"error":"Failed to save attempt"}.

@@ FEATURE: After user finished the module / open the completed module, they will see the result page which shows the completion status based on defined treshold (we already did this), the score percentage (we already did this), the button to see "pembahasan" that will redirect to the pembahasan page. Also there are two buttons: retry and back to drill page. The retry button will redirect to the question runner page with the same question that already assigned to that module. The back to drill page will redirect to the drill page.

@@ FEATURE: The pembahasan page will show the question and the answers that user already answered, and also the correct answer with the explanation on each question (i think we already have this, but please recheck -- If we don't have this, please add into the question generation pipeline). The pembahasan page will show the explanation for each question that already defined by admin in the admin console.

On each question, which should be related to level-5, it should has the button to open the material card that already defined by admin in the admin console (dont show the button if the level-5 does not have material card). So user can redirected to the material card in the material page. The content in the material card is already defined by admin in the admin console, and it should has this content: core idea, key facts, common mistakes, and example(s). (see material part below for more details about the content in the material card).

#### Review Page (`/review`)

- **Purpose:** Review weak areas with Material Cards
- **Content:**
  - **Level 4 (Subtopic) List** - expandable
    - Shows uncovered subtopics first (not all level-5 children covered)
    - Progress indicator per subtopic (X/Y skills covered)
  - **Level 5 (Micro-skill) List** - inside each subtopic
    - Checkmark for covered skills (✅ = ≥20 points)
    - Uncovered skills at top (no checkmark, shows current points)
    - Clicking opens Material Card
  - **Material Card Viewer**
    - Core Idea
    - Key Facts
    - Common Mistakes
    - Example(s)

**Review Page Structure:**

@@ FEATURE: Material card feature. User can open the material card from the review page or from the result page. Currently we have core idea, key facts, common mistakes, and example(s) in the material card. Now, we need to have 2 buttons. 1 button in the top to drill this material card, which when user click on it, it redirects to drill page with the filter in the level-5 that related to this material card. So user will see the module that related to this material card. This button will change to "back to pembahasan" if user open the material card from the pembahasan page. The second button is "tanya gaspol" that will open the chat modal which an ask to AI.

@@ FEATURE: The tanya gaspol feature. When user click on the "tanya gaspol" button, it will open the chat modal. In the chat modal, user can see the "gaspol" character that ask the user (probably has several template that can randomly generated), then user can see the template common question that user can click on (we can generate the preset question such as "saya kurang paham dengan konsep ini, bisa jelaskan dengan bahasa yang lebih sederhana?" or "bisa jelaskan dengan contoh soal lain?") so when user click on it, it will send to the chat box. User can also input their own question in the input field. When user submit the question, it will send the question to the AI and then get the response from AI and then show it in the chat modal. The AI model should use based on what we defined in "AI Runs" page in the admin.

User also see the token quota to show how many remaining question that user can ask to gaspol. Each user has 100 token, which each of question will cost 5 token. The chat will be stored, so when user revisit the specific level-5 material card, they can see their previous question and the response from gaspol. The token is universal, no matter which level-5 material card that user ask, the token will be deducted from the same quota. You will help me to define the prompt for the Tanya Gaspol feature. When user has run out of token, the user cannot ask any question to gaspol, and they will see the message "kuota tanya gaspol kamu sudah habis, selamat belajar ya!" with a sad gaspol character.

@@ BUG: In the flashcard, the naming still "flashcards.cardOf" and "flashcards.tapToFlip". When the card clicked, there are lots of naming error such as "flashcards.tabToFlipBack", "flashcards.howWell", "flashcards.forgot", etc.

@@ BUG: The button of status like forgot, hard, good, easy are overflowing outside the page.

@@ FEATURE: Does currently the flashcards status which contains: forgot, hard, good, easy will be used for anything? Read below for full flashcard feature

@@ FEATURE: The Flashcard Feature Revamp (Spaced Repetition + Mastery Stacks). Explanation starts here.

This spec defines an Anki-like flashcard system for GASPOL UTBK that is **mobile-first**, **micro-skill (level-5) based**, and **last-minute exam aware**.

1. Product Mental Model

- **Flashcard = smallest learning unit** tied to exactly **1 micro-skill (level-5)**.
- Each user has a **per-card state**: mastery bucket + spaced repetition scheduling.
- The **Review page** is organized by **mastery stacks** (Forgot / Hard / Good / Easy).
- A review session is simply cards filtered by a selected mastery stack (or all due).

2. Unlocking / Gating (Baseline Required)

Rule

- Flashcards are **locked** until the user completes the **Baseline Assessment**.

Locked UI

- Title: **"Flashcards unlock after Baseline"**
- Subtitle: **"We need your baseline to prioritize which micro-skills you should review first."**
- Primary CTA: **"Start Baseline Assessment"**

3. Review Page UI (Mastery Stacks)

Layout
Show **4 stacks** (2x2 grid):

- Forgot
- Hard
- Good
- Easy

Each stack card includes:

- Stack label
- Big number: **Due count**
- Optional small text: **Total count** (e.g., `12 due · 48 total`)
- Status text: `Due now / Due today / All caught up / Not due yet`

Stack Thickness (Visual Rules)

- If `0` cards → show **empty deck** state/illustration.
- If `1–9` cards → show **3-layer stack** (3 visible cards).
- If `10+` cards → show **5-layer stack** (thicker stack).

Count Meaning (Important)

- Primary number should represent **Due cards**, not total cards.
- If you show total, display it as a smaller secondary label.

Tap Behavior

- Tap a stack → starts a **review session filtered to that mastery bucket**.
- Provide a primary CTA: **"Review All Due"** to avoid forcing a bucket choice.

4. Flashcard Review UX (Anki-like)

Card Flow

1. Show **Front** (prompt / question / cloze)
2. User taps **"Show answer"**
3. Show **Back** (answer)
4. User selects a mastery response:

Buttons (fixed bottom):

- Forgot
- Hard
- Good
- Easy

Micro-interaction

- After selecting mastery, animate the card **flying into that stack lane** (reinforces mental model).

Spaced Repetition Logic (SM-2 Inspired)

Each card stores:

- `ease_factor` (default `2.5`)
- `interval_days` (default `0`)
- `reps` (consecutive successful recalls)
- `due_at`

Button → Scheduling Updates

Forgot

- `reps = 0`
- `interval_days = 0` (or short in-session delay, e.g., 5–10 minutes)
- `ease_factor = max(1.3, ease_factor - 0.2)`
- `due_at = now + short_delay`

Hard

- `reps += 1` (or keep reps but reduce interval growth)
- `interval_days = max(1, round(interval_days * 1.2))`
- `ease_factor = max(1.3, ease_factor - 0.15)`
- `due_at = now + interval_days`

Good

- `reps += 1`
- Interval rule:
  - if `reps == 1` → `interval_days = 1`
  - if `reps == 2` → `interval_days = 3`
  - else → `interval_days = round(interval_days * ease_factor)`
- `ease_factor += 0.0` (or `+0.05` optional)
- `due_at = now + interval_days`

Easy

- `reps += 1`
- `interval_days = round(interval_days * (ease_factor + 0.3))`
- `ease_factor += 0.15`
- `due_at = now + interval_days`

@@ FEATURE: The flashcard explanation ends here

```
┌─────────────────────────────────────────────────┐
│  REVIEW                                          │
├─────────────────────────────────────────────────┤
│                                                  │
│  📚 Topics to Review                             │
│                                                  │
│  ▼ Aljabar (3/8 covered)                        │
│    ├── ❌ SPLDV (12/20 pts)           [weak]     │
│    ├── ❌ Persamaan Kuadrat (8/20 pts) [weak]     │
│    ├── ✅ Fungsi Linear (23/20 pts)              │
│    ├── ❌ Pertidaksamaan (15/20 pts)  [weak]     │
│    ├── ✅ Barisan Aritmatika (21/20 pts)         │
│    └── ...                                       │
│                                                  │
│  ▶ Geometri (5/6 covered)                       │
│  ▶ Statistika (2/5 covered)                     │
│  ▼ Penalaran Verbal (1/7 covered)               │
│    ├── ❌ Silogisme (5/20 pts)        [weak]     │
│    └── ...                                       │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Material Card View (on click):**

```
┌─────────────────────────────────────────────────┐
│  ← Back                                          │
│                                                  │
│  SPLDV (Sistem Persamaan Linear Dua Variabel)   │
│  ─────────────────────────────────────────      │
│                                                  │
│  💡 CORE IDEA                                    │
│  SPLDV adalah sistem yang terdiri dari dua      │
│  persamaan linear dengan dua variabel (x,y).    │
│  Solusinya adalah nilai x dan y yang memenuhi   │
│  kedua persamaan secara bersamaan.              │
│                                                  │
│  📋 KEY FACTS                                    │
│  • Metode: Substitusi, Eliminasi, Grafik        │
│  • Solusi bisa: satu titik, tidak ada, atau     │
│    tak hingga banyak                            │
│  • Bentuk umum: ax + by = c                     │
│                                                  │
│  ⚠️ COMMON MISTAKES                             │
│  • Salah tanda saat eliminasi                   │
│  • Lupa substitusi balik untuk variabel kedua   │
│  • Keliru menentukan variabel yang dieliminasi  │
│                                                  │
│  📝 EXAMPLE                                      │
│  Persamaan: 2x + y = 7 dan x - y = 2           │
│  Eliminasi y: 2x + y + x - y = 7 + 2           │
│  → 3x = 9 → x = 3                              │
│  Substitusi: 3 - y = 2 → y = 1                 │
│  Solusi: (3, 1)                                 │
│                                                  │
└─────────────────────────────────────────────────┘
```

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
Setup Baseline → Manage Campus Scores → Publish
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
- **Coverage dashboard**: See which micro-skills have questions, which need more
- **Difficulty distribution**: Ensure each micro-skill has mix of L1, L2, L3 questions

> **IMPORTANT: Difficulty Levels for Point System**
> Every question MUST have a difficulty level assigned:
>
> - **L1 (Easy)**: Recall, basic application → Awards 1 point
> - **L2 (Medium)**: Analysis, multi-step → Awards 2 points
> - **L3 (Hard/HOTS)**: Synthesis, evaluation, complex reasoning → Awards 5 points
>
> These points accumulate per micro-skill. User "covers" a skill at 20 points.

**Step 5: Material Card Generation** (`/admin/materials`) **[NEW]**

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
- Set module type: `baseline` | `drill` | `recycle`
- **Baseline modules**: Topic-level, 10-15 questions, cover all micro-skills under topic
- **Drill modules**: Focused on weak skill clusters
- Order questions within modules

**Step 8: Campus Score Database** (`/admin/campus`) **[NEW]**

- Manage university/campus passing scores
- AI assists with internet research for score data
- **Human-in-loop required**: Admin must confirm/edit scores
- Data structure:
  - University name
  - Major/program
  - Minimum score (by exam section if needed)
  - Year/batch
  - Source URL

**Step 9: Baseline Builder** (`/admin/baseline`)

- Create baseline checkpoint from modules
- Ensure all micro-skills are covered
- Set module sequence
- Configure targeting rules

**Step 10: Operations Monitoring** (`/admin/ai-runs`, `/admin/diagnostics`)

- View AI operation logs (tokens, cost, status)
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
- **On failure: Display weak Material Cards**

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
6. If passed (≥70%): Show success, mark complete
7. If failed (<70%): Show weak Material Cards list, offer retry

### 5.2 Material Card System [NEW]

**Data Structure:**

```typescript
interface MaterialCard {
  id: string
  micro_skill_id: string // references taxonomy_nodes level 5
  exam_id: string

  // Content
  core_idea: string // 1-2 paragraphs explaining the concept
  facts: string[] // Key facts as bullet points
  common_mistakes: string[] // Common errors students make
  examples: Example[] // Worked examples

  // Metadata
  status: "draft" | "published"
  created_at: string
  updated_at: string
}

interface Example {
  problem: string
  solution: string
  explanation?: string
}
```

**Component:** `components/review/MaterialCard.tsx`

**Usage:**

1. **Review Page**: Browse all Material Cards by topic/subtopic
2. **After Failed Module**: Show relevant Material Cards before retry
3. **Analytics Weak Skills**: Link to Material Card from weak skill list

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

  // Weakness identification (skills with points < 20)
  weak_skills: WeakSkill[] // Micro-skills needing work
  error_patterns: ErrorPattern[] // Most frequent error types

  created_at: string
}

interface WeakSkill {
  skill_id: string
  skill_name: string
  current_points: number // 0-19 (not yet covered)
  points_needed: number // 20 - current_points
  subtopic_id: string
  topic_id: string
}
```

**Readiness Score Formula:**

```typescript
function calculateReadinessScore(
  userPredictedScore: number,
  targetCampusScore: number | null,
): { readiness: number; vsTarget: number | null } {
  // Base readiness from user's mastery
  const readiness = userPredictedScore

  // VS target if university selected
  const vsTarget = targetCampusScore
    ? (userPredictedScore / targetCampusScore) * 100
    : null

  return { readiness, vsTarget }
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

### 5.5 Drill System

**Drill Page Structure:**

```typescript
interface DrillPageData {
  // Filter state
  filter: "all" | "required" | "completed"

  // Module list
  modules: DrillModule[]

  // Required tasks pinned
  requiredTasks: DrillModule[] // From current plan cycle
}

interface DrillModule {
  id: string
  title: string
  topic: string
  questionCount: number
  estimatedMinutes: number

  // Status
  status: "not_started" | "in_progress" | "passed" | "failed"
  isRequired: boolean // Is this a current plan task?
  score?: number // Last attempt score
  attempts: number // How many times attempted

  // Related skills
  microSkills: string[]
}
```

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
    exam_date?: ExamDatePrediction // Batch 5 [NEW]
  }
  requires_human_confirmation: boolean
  tokens_used: number
  cost_estimate: number
}
```

**Material Card Generation:**

```typescript
interface MaterialCardGenerationJob {
  micro_skill_ids: string[] // Which skills to generate for
  exam_id: string
  batch_size: number // How many to generate per AI call
  status: "pending" | "running" | "completed" | "failed"

  results: {
    generated: number
    failed: number
    material_card_ids: string[]
  }
}
```

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
  ┌──────────┐ ┌──────────┐ ┌──────────────┐
  │questions │ │materials │ │  flashcards  │
  └────┬─────┘ └──────────┘ └──────────────┘
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
```

### 6.2 Core Tables

#### User & State Tables

```sql
-- User profiles (extends auth.users)
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  display_name TEXT,
  role TEXT DEFAULT 'student',  -- 'student' | 'admin'

  -- Onboarding data
  exam_date DATE,               -- User-selected exam date
  package_days INTEGER,         -- AUTO-CALCULATED from exam_date
  time_budget_min INTEGER,
  target_university TEXT,
  target_major TEXT,

  created_at TIMESTAMPTZ
);

-- State machine tracking
user_state (
  user_id UUID PRIMARY KEY REFERENCES profiles,
  current_phase TEXT,  -- ONBOARDING | BASELINE_IN_PROGRESS | PLAN_ACTIVE | RECYCLE_IN_PROGRESS
  current_exam_id UUID,
  current_cycle_id UUID,
  current_checkpoint_id UUID,
  updated_at TIMESTAMPTZ
);

-- Per-skill performance tracking (POINT-BASED COVERAGE)
user_skill_state (
  user_id UUID REFERENCES profiles,
  taxonomy_node_id TEXT REFERENCES taxonomy_nodes,  -- Level 5 micro-skill

  -- Point-based coverage (NEW)
  total_points INTEGER DEFAULT 0,     -- Sum of difficulty points from correct answers
  is_covered BOOLEAN GENERATED ALWAYS AS (total_points >= 20) STORED,

  -- Legacy metrics (still tracked for analytics)
  accuracy FLOAT,                     -- historical accuracy rate
  speed_avg FLOAT,                    -- average time in seconds
  attempts_count INTEGER DEFAULT 0,   -- total questions attempted
  correct_count INTEGER DEFAULT 0,    -- total correct answers

  -- Breakdown by difficulty
  l1_correct INTEGER DEFAULT 0,       -- Easy questions correct
  l2_correct INTEGER DEFAULT 0,       -- Medium questions correct
  l3_correct INTEGER DEFAULT 0,       -- Hard questions correct

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
  structure_metadata JSONB,    -- From research batch 1
  construct_profile JSONB,     -- From research batch 3
  error_patterns JSONB,        -- From research batch 4

  -- Exam date (from research, admin confirmed)
  default_exam_date DATE,
  exam_date_source TEXT,       -- Where this date came from

  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ
);

-- 5-level taxonomy hierarchy
taxonomy_nodes (
  id TEXT PRIMARY KEY,         -- e.g., 'UTBK26.TPS.PU.001'
  exam_id UUID REFERENCES exams,
  parent_id TEXT REFERENCES taxonomy_nodes,
  level INTEGER,               -- 1=Subject, 2=Subtest, 3=Topic, 4=Subtopic, 5=Micro-skill
  name TEXT,
  description TEXT,
  cognitive_level TEXT,        -- L1, L2, L3
  construct_weights JSONB,     -- Inherited if null
  expected_time_sec INTEGER,

  -- For level 5 only: has material card?
  has_material_card BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ
);

-- Material Cards (NEW) - linked to micro-skills (level 5)
material_cards (
  id UUID PRIMARY KEY,
  exam_id UUID REFERENCES exams,
  micro_skill_id TEXT REFERENCES taxonomy_nodes,  -- Level 5 only

  -- Content
  core_idea TEXT NOT NULL,
  facts JSONB,                 -- Array of fact strings
  common_mistakes JSONB,       -- Array of mistake strings
  examples JSONB,              -- Array of {problem, solution, explanation}

  -- Metadata
  status TEXT DEFAULT 'draft', -- draft, published
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,

  UNIQUE(micro_skill_id)       -- One material card per micro-skill
);

-- Question bank
questions (
  id TEXT PRIMARY KEY,
  exam_id UUID REFERENCES exams,
  micro_skill_id TEXT REFERENCES taxonomy_nodes,  -- Level 5
  format TEXT,                 -- MCQ5, MCQ4, MCK, TF, FILL
  status TEXT DEFAULT 'draft',

  -- Difficulty & Points (REQUIRED)
  difficulty_level TEXT NOT NULL,     -- L1, L2, L3 (REQUIRED)
  point_value INTEGER GENERATED ALWAYS AS (
    CASE difficulty_level
      WHEN 'L1' THEN 1
      WHEN 'L2' THEN 2
      WHEN 'L3' THEN 5
    END
  ) STORED,

  -- Content
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer JSONB,
  explanation JSONB,

  -- Metadata
  construct_weights JSONB,
  expected_time_sec INTEGER,
  cognitive_level TEXT,        -- Bloom's taxonomy level (optional, different from difficulty)

  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Modules (question collections)
modules (
  id TEXT PRIMARY KEY,
  exam_id UUID REFERENCES exams,
  title TEXT,
  description TEXT,
  topic_id TEXT REFERENCES taxonomy_nodes,  -- Level 3 topic reference
  type TEXT,                   -- baseline, drill, recycle
  question_count INTEGER,
  estimated_time_min INTEGER,
  pass_threshold FLOAT DEFAULT 0.7,  -- 70% to pass
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ
);

-- Module ↔ Question junction
module_questions (
  module_id TEXT REFERENCES modules,
  question_id TEXT REFERENCES questions,
  order_index INTEGER,
  PRIMARY KEY (module_id, question_id)
);

-- Campus/University Score Database (NEW)
campus_scores (
  id UUID PRIMARY KEY,
  university_name TEXT NOT NULL,
  major_name TEXT,

  -- Score requirements
  min_score FLOAT,             -- Minimum passing score
  score_breakdown JSONB,       -- Optional: per-section scores

  -- Source
  year INTEGER,
  source_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,  -- Admin verified

  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### Assessment & Analytics Tables

```sql
-- Individual question attempts
attempts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles,
  question_id TEXT REFERENCES questions,
  module_id TEXT REFERENCES modules,
  module_type TEXT,            -- baseline, drill, recycle

  -- Response data
  user_answer JSONB,
  is_correct BOOLEAN,
  time_spent_sec INTEGER,

  -- Points (for auditing)
  difficulty_level TEXT,       -- L1, L2, L3 (copied from question)
  points_awarded INTEGER,      -- 0 if wrong, 1/2/5 if correct based on difficulty

  created_at TIMESTAMPTZ
);

-- Error tags applied to attempts
attempt_error_tags (
  attempt_id UUID REFERENCES attempts,
  tag_id TEXT REFERENCES tags,
  source TEXT,                 -- 'rule', 'ai', 'manual'
  PRIMARY KEY (attempt_id, tag_id)
);

-- Module completion records
module_completions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles,
  module_id TEXT REFERENCES modules,
  module_type TEXT,            -- baseline, drill, recycle

  -- Results
  score FLOAT,                 -- 0-100
  passed BOOLEAN,              -- score >= threshold
  attempts_count INTEGER DEFAULT 1,

  -- Related data
  weak_skills JSONB,           -- Micro-skills to review

  completed_at TIMESTAMPTZ
);

-- Point-in-time analytics
analytics_snapshots (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles,
  scope TEXT,                  -- partial_baseline, full_baseline, cycle_end, checkpoint

  -- Core metrics
  readiness FLOAT,
  target_campus_score FLOAT,   -- From campus_scores table
  readiness_vs_target FLOAT,   -- Percentage

  -- Detailed data
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
  cycle_index INTEGER,         -- 1, 2, 3...
  status TEXT DEFAULT 'active', -- active, completed

  -- Tasks generated
  task_count INTEGER DEFAULT 5,
  completed_task_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ
);

-- Tasks within a cycle (all are drill modules)
plan_tasks (
  id UUID PRIMARY KEY,
  cycle_id UUID REFERENCES plan_cycles,
  module_id TEXT REFERENCES modules,  -- Always a drill module

  -- Status
  status TEXT DEFAULT 'todo',  -- todo, in_progress, passed, failed
  is_required BOOLEAN DEFAULT TRUE,
  order_index INTEGER,

  -- Completion data
  score FLOAT,
  attempts INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Recycle checkpoints
recycle_checkpoints (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles,
  cycle_id UUID REFERENCES plan_cycles,  -- Which cycle this follows
  status TEXT DEFAULT 'locked',  -- locked, unlocked, in_progress, completed

  -- Modules to complete
  module_ids JSONB,            -- Array of module IDs
  completed_module_ids JSONB,  -- Array of completed module IDs

  created_at TIMESTAMPTZ
);
```

#### Admin & AI Tables

```sql
-- AI operation logs
ai_runs (
  id UUID PRIMARY KEY,
  job_type TEXT,               -- research, generate_questions, generate_materials, auto_tag
  model TEXT,
  prompt_version TEXT,

  -- Input/Output
  input_json JSONB,
  output_json JSONB,

  -- Token tracking
  tokens_in INTEGER,
  tokens_out INTEGER,
  cost_estimate NUMERIC,

  -- Human in loop
  requires_confirmation BOOLEAN DEFAULT FALSE,
  confirmed_by UUID REFERENCES profiles,
  confirmed_at TIMESTAMPTZ,

  status TEXT,                 -- pending, success, failed, awaiting_confirmation
  error_message TEXT,

  created_by UUID REFERENCES profiles,
  created_at TIMESTAMPTZ
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
  return Math.max(1, diffDays) // Minimum 1 day
}
```

### 7.2 Point System & Coverage Logic

**Point Values by Difficulty:**

```typescript
const DIFFICULTY_POINTS = {
  L1: 1, // Easy
  L2: 2, // Medium
  L3: 5, // Hard/HOTS
} as const

const COVERAGE_THRESHOLD = 20 // Points needed to "cover" a skill
```

**Calculate Points Awarded:**

```typescript
function calculatePointsAwarded(
  isCorrect: boolean,
  difficultyLevel: "L1" | "L2" | "L3",
): number {
  if (!isCorrect) return 0
  return DIFFICULTY_POINTS[difficultyLevel]
}
```

**Check Skill Coverage:**

```typescript
function isSkillCovered(skillState: UserSkillState): boolean {
  return skillState.total_points >= COVERAGE_THRESHOLD
}

function getPointsNeeded(skillState: UserSkillState): number {
  return Math.max(0, COVERAGE_THRESHOLD - skillState.total_points)
}
```

**Check Subtopic Coverage (Level 4):**

```typescript
function isSubtopicCovered(
  subtopicId: string,
  allSkillStates: UserSkillState[],
  taxonomyNodes: TaxonomyNode[],
): boolean {
  // Get all level-5 children of this subtopic
  const childSkills = taxonomyNodes.filter(
    (n) => n.parent_id === subtopicId && n.level === 5,
  )

  // Check if ALL children are covered
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

  // Identify weak skills for failed modules
  const weakSkills = passed
    ? []
    : attempts
        .filter((a) => !a.is_correct)
        .map((a) => a.question.micro_skill_id)
        .filter((v, i, a) => a.indexOf(v) === i) // Unique

  return {
    score: score * 100,
    passed,
    weakSkills,
    materialCardsToReview: weakSkills, // Same as weak skills
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
  // Calculate coverage percentage
  const totalSkills = skillStates.length
  const coveredSkills = skillStates.filter((s) => s.total_points >= 20).length
  const coveragePercent = (coveredSkills / totalSkills) * 100

  // Calculate weighted readiness (also factor in partial progress)
  const totalPossiblePoints = totalSkills * 20 // 20 points each
  const totalEarnedPoints = skillStates.reduce(
    (sum, s) => sum + s.total_points,
    0,
  )
  const progressPercent = (totalEarnedPoints / totalPossiblePoints) * 100

  // Readiness = weighted average of coverage + progress
  const readiness = coveragePercent * 0.7 + progressPercent * 0.3

  // Compare to target if available
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
  const TASK_COUNT = 5 // Always 5 tasks per cycle

  // Get uncovered micro-skills (points < 20), sorted by points ascending
  const uncoveredSkills = analytics.weak_skills
    .filter((s) => s.current_points < 20)
    .sort((a, b) => a.current_points - b.current_points)
    .slice(0, 15) // Consider top 15 weakest

  // Group uncovered skills by topic (level 3)
  const weakTopics = groupByTopic(uncoveredSkills)

  // Find or create drill modules for top 5 weak topics
  const taskModules = weakTopics
    .slice(0, TASK_COUNT)
    .map((topic) => findOrCreateDrillModule(topic))

  // Create tasks
  const tasks = taskModules.map((module, index) => ({
    type: "drill",
    module_id: module.id,
    title: module.title,
    is_required: true,
    order_index: index,
    status: "todo",
    target_skills: module.micro_skill_ids,
  }))

  return {
    cycle_index: cycleIndex,
    tasks,
    status: "active",
  }
}
```

### 7.6 Recycle Module Generation

```typescript
function generateRecycleModules(
  analytics: AnalyticsSnapshot,
  previousCycleId: string,
): RecycleModule[] {
  // Get skills that are still uncovered (points < 20)
  const stillUncovered = analytics.weak_skills
    .filter((s) => s.current_points < 20)
    .sort((a, b) => a.current_points - b.current_points) // Weakest first

  // Group by topic and create targeted modules
  const weakTopics = groupByTopic(stillUncovered)

  // Create recycle modules (smaller, more focused)
  const recycleModules = weakTopics.slice(0, 3).map((topic) => ({
    type: "recycle",
    topic_id: topic.id,
    micro_skill_ids: topic.weakSkills.map((s) => s.id),
    question_count: Math.min(10, topic.weakSkills.length * 2),
    // Include some "control" items from covered skills
    includeControlItems: true,
  }))

  return recycleModules
}
```

### 7.7 Error Tag Derivation (Rule-Based)

```typescript
function deriveErrorTags(attempt: Attempt, question: Question): string[] {
  const tags: string[] = []
  const expectedTime = question.expected_time_sec
  const actualTime = attempt.time_spent_sec
  const isCorrect = attempt.is_correct

  // Time-based tags
  if (actualTime > expectedTime * 1.5) {
    tags.push("ERR.SLOW")
    if (!isCorrect) tags.push("ERR.STRUGGLE")
  }

  if (actualTime < expectedTime * 0.3) {
    tags.push("ERR.RUSHED")
  }

  // Correctness + time combination
  if (!isCorrect && actualTime < expectedTime * 0.6) {
    tags.push("ERR.CARELESS")
  }

  if (!isCorrect && actualTime > expectedTime * 1.3) {
    tags.push("ERR.CONCEPT_GAP")
  }

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
  const isNew = !currentState
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

  // Update speed average
  const newSpeedAvg =
    base.speed_avg === 0
      ? attempt.time_spent_sec
      : (base.speed_avg * base.attempts_count + attempt.time_spent_sec) /
        newAttemptsCount

  // Update difficulty-specific counts
  const difficultyKey =
    `l${question.difficulty_level.slice(1)}_correct` as keyof UserSkillState

  return {
    ...base,
    total_points: base.total_points + pointsAwarded,
    accuracy: newAccuracy,
    speed_avg: newSpeedAvg,
    attempts_count: newAttemptsCount,
    correct_count: newCorrectCount,
    [difficultyKey]:
      (base[difficultyKey] as number) + (attempt.is_correct ? 1 : 0),
    last_seen_at: new Date().toISOString(),
  }
}
```

> **IMPORTANT: Real-Time Updates**
> This function is called IMMEDIATELY after each answer submission, not just at module completion. This ensures the user profile always reflects their current knowledge state.

---

## 8. Technical Architecture

### 8.1 Technology Stack

| Layer                  | Technology              | Rationale                              |
| ---------------------- | ----------------------- | -------------------------------------- |
| **Frontend Framework** | Next.js 14 (App Router) | SSR, RSC, API routes, great DX         |
| **Language**           | TypeScript              | Type safety, better tooling            |
| **Styling**            | Tailwind CSS            | Utility-first, rapid development       |
| **UI Components**      | shadcn/ui               | Customizable, accessible components    |
| **State (Client)**     | Zustand                 | Simple, performant local state         |
| **State (Server)**     | TanStack React Query    | Caching, optimistic updates            |
| **Database**           | Supabase (PostgreSQL)   | Auth + DB + Storage + Edge Functions   |
| **Auth**               | Supabase Auth           | Built-in, JWT-based                    |
| **Edge Functions**     | Deno (TypeScript)       | Secure server-side logic               |
| **Charts**             | Recharts                | Flexible, React-native charting        |
| **AI Provider**        | Anthropic Claude        | Best for structured content generation |

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
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │ │
│  └─────────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬──────────────────────────────────┘
                                │ HTTPS
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                        SUPABASE                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    PostgreSQL Database                      │  │
│  │   Profiles, Taxonomy, Questions, Material Cards,           │  │
│  │   Modules, Campus Scores, Attempts, Analytics              │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                     Edge Functions                          │  │
│  │   • submit_attempt    • generate_plan                      │  │
│  │   • finalize_module   • research_exam (AI)                 │  │
│  │   • generate_snapshot • generate_questions (AI)            │  │
│  │   • generate_material_cards (AI) [NEW]                     │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 8.3 API Routes

| Route                           | Method | Purpose                      | Auth  |
| ------------------------------- | ------ | ---------------------------- | ----- |
| `/api/submit-attempt`           | POST   | Submit question answer       | User  |
| `/api/finalize-module`          | POST   | Complete module, check pass  | User  |
| `/api/generate-plan`            | POST   | Generate 5-task study cycle  | User  |
| `/api/generate-snapshot`        | POST   | Create analytics snapshot    | User  |
| `/api/unlock-recycle`           | POST   | Unlock recycle assessment    | User  |
| `/api/admin/research-exam`      | POST   | Trigger AI research          | Admin |
| `/api/admin/generate-materials` | POST   | Generate Material Cards (AI) | Admin |
| `/api/admin/campus-scores`      | CRUD   | Manage campus score database | Admin |

### 8.4 Edge Functions

| Function                  | Trigger      | AI       | Purpose                                 |
| ------------------------- | ------------ | -------- | --------------------------------------- |
| `submit_attempt`          | API Route    | No       | Process answer, update skill state      |
| `finalize_module`         | API Route    | No       | Calculate pass/fail, return weak skills |
| `generate_plan`           | API Route    | No       | Create 5-task cycle from weak skills    |
| `generate_snapshot`       | API Route    | No       | Create analytics snapshot               |
| `research_exam`           | Admin Action | Yes (5x) | Full exam research (incl. exam date)    |
| `generate_questions`      | Admin Action | Yes      | AI question generation                  |
| `generate_material_cards` | Admin Action | Yes      | AI Material Card generation             |
| `research_campus_scores`  | Admin Action | Yes      | AI research for campus passing scores   |

### 8.5 File Structure (Updated)

```
gaspol/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (student)/
│   │   ├── plan/                 # Timeline view (baseline + tasks + recycle)
│   │   ├── drill/                # All drill modules
│   │   │   └── [moduleId]/       # QuestionRunner
│   │   ├── review/               # Topic list + Material Cards
│   │   │   └── [skillId]/        # Material Card detail
│   │   ├── analytics/            # Deep analytics
│   │   ├── onboarding/
│   │   └── settings/
│   ├── admin/
│   │   ├── exams/
│   │   ├── taxonomy/
│   │   ├── questions/
│   │   ├── materials/            # Material Card management [NEW]
│   │   ├── modules/
│   │   ├── campus/               # Campus scores [NEW]
│   │   ├── ai-runs/
│   │   └── diagnostics/
│   └── api/
├── components/
│   ├── assessment/               # QuestionRunner
│   ├── analytics/                # Charts, scores
│   ├── plan/                     # Timeline components
│   ├── drill/                    # Module list, cards
│   ├── review/                   # MaterialCard component [NEW]
│   ├── navigation/               # TopNav, BottomNav
│   └── ui/                       # shadcn/ui
├── lib/
│   ├── supabase/
│   ├── analytics/
│   └── utils/
├── hooks/
├── supabase/
│   ├── migrations/
│   └── functions/
└── prompts/
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
- Material Card system
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

---

## 10. AI Code Generation Prompt

Use the following prompt to generate the complete Gaspol codebase using an AI coding assistant:

---

```markdown
# AI Code Generation Prompt: Adaptive Learning Platform v2

You are a senior full-stack development team building a mobile-first adaptive learning platform.

## Project Overview

Build an adaptive learning platform with:

- Timeline-based journey: Baseline → Plan → Tasks → Recycle (loop)
- Complete micro-skill coverage testing
- **Point-based coverage system** (L1=1pt, L2=2pt, L3=5pt; 20pts = covered)
- Material Cards for learning content
- Campus/target score comparison
- 70% pass threshold for modules
- **Real-time profile updates** on every answer submission

## Tech Stack

| Layer    | Technology                     |
| -------- | ------------------------------ |
| Frontend | Next.js 14 (App Router) + TS   |
| Styling  | Tailwind CSS + shadcn/ui       |
| Theme    | Soft Neubrutalism              |
| State    | Zustand + TanStack React Query |
| Backend  | Supabase (PostgreSQL + Auth)   |
| AI       | Anthropic Claude (server-only) |

## Student Navigation (4 tabs)

1. **Plan** (`/plan`) - Timeline view showing:
   - Baseline modules (complete to unlock plan)
   - Generated tasks (5 drill modules)
   - Recycle assessment (locked until tasks done)

2. **Drill** (`/drill`) - Module list showing:
   - All available modules
   - Required task modules highlighted
   - Pass (≥70%) or fail with retry

3. **Review** (`/review`) - Learning content:
   - Topics (level 4) expandable to micro-skills (level 5)
   - Covered skills marked ✅ (≥20 points)
   - Uncovered skills show current points (X/20) + Material Cards

4. **Analytics** (`/analytics`) - Dashboard:
   - Readiness score vs target campus
   - 5-construct radar chart
   - Coverage by subtopic (all child skills covered = subtopic covered)
   - Skills with points progress (X/20 pts)

## Key Flows

### Onboarding

- User inputs: exam date (calendar), time budget, target university (optional)
- System calculates: package_days = exam_date - today
- Admin provides: default exam date from research

### Baseline Phase

- Test ALL micro-skills through topic-level modules (10-15 questions each)
- **Every answer immediately updates user profile** (points, constructs, errors)
- Award points on correct answers: L1=1pt, L2=2pt, L3=5pt
- Enable plan generation when all baseline done

### Plan Active Phase

- Generate 5 tasks (drill modules) targeting uncovered skills (points < 20)
- User completes from Drill page
- **Every answer updates profile in real-time**
- 70% threshold: pass or show Material Cards + retry
- Unlock recycle when all required tasks done

### Recycle Phase

- Targeted modules for still-weak skills
- Same behavior as baseline
- Show delta analytics
- Generate next plan cycle (loop)

## Database Tables

Core:

- profiles (with exam_date, package_days auto-calc)
- taxonomy_nodes (5 levels, Subject→Micro-skill)
- questions (linked to micro-skills)
- material_cards (one per micro-skill: core_idea, facts, mistakes, example)
- modules (type: baseline/drill/recycle)
- campus_scores (university passing scores, admin-maintained)

User State:

- user_state (current_phase, current_cycle_id)
- user_skill_state (per micro-skill: total_points, is_covered, l1/l2/l3_correct)
- user_construct_state (5 constructs)

Assessment:

- attempts
- module_completions (score, passed, weak_skills)
- analytics_snapshots

Plan:

- plan_cycles (5 tasks each)
- plan_tasks (status: todo/passed/failed)
- recycle_checkpoints

## Admin Pipeline

1. Exam Setup + Research (5 batches AI)
2. Taxonomy Management
3. Question Generation (AI)
4. Material Card Generation (AI) ← NEW
5. Metadata Configuration
6. Module Composition
7. Campus Score Database ← NEW (human-in-loop)
8. Baseline Builder

## Key Logic

- Package days: exam_date - current_date
- Module pass: score >= 70%
- **Point system: L1=1pt, L2=2pt, L3=5pt (on correct answer)**
- **Skill covered: total_points >= 20**
- **Subtopic covered: ALL child micro-skills covered**
- Readiness: coverage percentage vs target_campus_score
- Plan tasks: 5 drill modules from uncovered skill topics
- Material Card: shown on module fail or in Review page
- **Real-time updates: Every answer submission updates user_skill_state**

## Components

- QuestionRunner (all types, timer, 70% threshold, awards points)
- MaterialCard (core idea, facts, mistakes, example)
- TimelineView (baseline → tasks → recycle)
- ModuleList (with required highlighting)
- SkillTree (topics → skills → checkmarks for ≥20pts)
- PointsProgress (X/20 pts progress bar)
- ReadinessScore (vs target campus)
- ConstructRadar (5 dimensions)

## Deliverables

1. Next.js app (student 4-tab + admin)
2. Supabase migrations (schema + RLS)
3. Edge Functions (submit, finalize, plan, materials)
4. Seed data
5. README
```

---

## Appendix

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
| **Difficulty Level**   | L1 (Easy), L2 (Medium), L3 (Hard/HOTS) - determines points   |
| **Point Value**        | Points awarded on correct answer: L1=1, L2=2, L3=5           |
| **Coverage Threshold** | 20 points required to "cover" a micro-skill                  |
| **Covered Skill**      | Micro-skill with ≥20 accumulated correct-answer points       |
| **Covered Subtopic**   | Level-4 node where ALL child micro-skills are covered        |
| **Real-time Profile**  | User skill state updated immediately on every answer         |

### B. Version History

| Version | Date       | Changes                                           |
| ------- | ---------- | ------------------------------------------------- |
| 1.0     | 2026-03-03 | Initial blueprint creation                        |
| 2.0     | 2026-03-03 | Major restructure: timeline view, Material Cards, |
|         |            | nav change (Plan/Drill/Review/Analytics),         |
|         |            | exam date input, campus scores, 70% threshold     |
| 2.1     | 2026-03-03 | Point-based coverage system (L1=1pt, L2=2pt,      |
|         |            | L3=5pt; 20pts = covered), real-time profile       |
|         |            | updates on every answer, subtopic coverage logic  |

---

**Document End**

```

```
