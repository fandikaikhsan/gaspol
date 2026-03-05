# 01 — Source of Truth Extraction

> Structured extraction from `PROJECT_BLUEPRINT_v2.md` + `DESIGN.v2.md`

---

## 1. Product Goals

| #   | Goal                                                                                  | Priority |
| --- | ------------------------------------------------------------------------------------- | -------- |
| G1  | Maximize exam readiness through personalized, data-driven preparation in limited time | Core     |
| G2  | Complete micro-skill coverage — test ALL level-5 skills via baseline                  | Core     |
| G3  | Point-based mastery system (L1=1pt, L2=2pt, L3=5pt; 20pts = covered)                  | Core     |
| G4  | Real-time profile updates on every answer submission                                  | Core     |
| G5  | Campus-targeted readiness — compare user score vs target university                   | Core     |
| G6  | Timeline-based journey: Baseline → Plan → Tasks → Recycle → Loop                      | Core     |
| G7  | Material Cards for structured learning content per micro-skill                        | Core     |
| G8  | AI-powered content pipeline (questions + Material Cards)                              | Core     |
| G9  | Mobile-first responsive design (80%+ mobile traffic)                                  | Core     |
| G10 | Exam-agnostic architecture (replicable to any standardized test)                      | Future   |

---

## 2. User Journeys

### 2.1 Student Journey Phases

| Phase | Name                                   | Entry                      | Exit Condition                                             |
| ----- | -------------------------------------- | -------------------------- | ---------------------------------------------------------- |
| 1     | ONBOARDING                             | `/onboarding`              | Exam date + time budget set → phase = BASELINE_IN_PROGRESS |
| 2     | BASELINE_ASSESSMENT_IN_PROGRESS        | `/plan` (baseline section) | All baseline modules completed → unlock "Generate Plan"    |
| 3     | PLAN_GENERATION                        | `/plan`                    | User taps "Generate My Plan" → 5 tasks created             |
| 4     | PLAN_ACTIVE                            | `/plan` (tasks section)    | All 5 required tasks completed → unlock Recycle            |
| 5     | RECYCLE_UNLOCKED → RECYCLE_IN_PROGRESS | `/plan` (recycle section)  | All recycle modules done → delta analytics shown           |
| 6     | Loop                                   | Back to PLAN_ACTIVE        | Generate next plan cycle                                   |

### 2.2 Student Navigation (4 Tabs)

| Tab           | Route        | Purpose                                    |
| ------------- | ------------ | ------------------------------------------ |
| **Plan**      | `/plan`      | Timeline hub: baseline → tasks → recycle   |
| **Drill**     | `/drill`     | All modules; required tasks highlighted    |
| **Review**    | `/review`    | Topic tree → micro-skills → Material Cards |
| **Analytics** | `/analytics` | Deep analytics dashboard                   |

### 2.3 Admin Journey

```
Create Exam → Research (5 AI batches) → Build Taxonomy →
Generate Questions → Generate Material Cards →
Configure Metadata → Compose Modules →
Setup Baseline → Manage Campus Scores → Publish
```

---

## 3. Feature Requirements

### 3.1 MVP / Core Features

#### F1 — Onboarding

- Exam date input via **calendar picker** (required)
- Auto-calculate `package_days = exam_date - today`
- Daily time budget in minutes (required)
- Target university (optional, searchable dropdown)
- Target major (optional)
- Admin-provided default exam date

#### F2 — Baseline Assessment

- Test ALL level-5 micro-skills through topic-level modules (10-15 questions each)
- Each answer immediately updates user profile (points, constructs, error tags)
- Point-based coverage: L1=1pt, L2=2pt, L3=5pt on correct answers
- "Generate Plan" button LOCKED until all baseline modules complete
- Show partial analytics after each module

#### F3 — QuestionRunner

- Support 5 question formats: MCQ5, MCQ4, MCK-Table, TF, Fill-in
- Timer per question
- Navigation (prev/next/review later)
- 70% pass threshold for drill modules
- On failure: show weak Material Cards + retry option
- On pass: celebration + skill points summary

#### F4 — Plan System

- Generate 5 tasks (drill modules) targeting uncovered skills (points < 20)
- Timeline view showing: baseline → current cycle tasks → recycle
- Day counter + exam countdown
- Readiness ring vs target campus
- Clear locked/unlocked states

#### F5 — Drill System

- List all available modules
- Required task modules pinned/highlighted at top
- Filter: All / Required Tasks / Completed
- Module cards: title, topic, question count, estimated time, status
- Pass (≥70%) or fail with Material Card review + retry

#### F6 — Material Card System

- One Material Card per micro-skill (level 5)
- Content: Core Idea, Key Facts, Common Mistakes, Example(s)
- Accessible from: Review page, after failed module, analytics weak skills
- Admin: AI batch generation, manual edit, publish workflow

#### F7 — Review Page

- Display level-4 (subtopic) list, expandable
- Inside each: level-5 micro-skills with coverage status (✅ ≥20pts / ❌ <20pts)
- Uncovered skills at top, showing current points (X/20)
- Click to open Material Card
- Progress indicator per subtopic (X/Y skills covered)

#### F8 — Analytics Dashboard

- Readiness Score (0-100) vs target campus
- Construct Radar Chart (5 dimensions)
- Coverage Map by subtopic (level 4)
- Weak Skills List (micro-skills below 20 points) with Material Card links
- Error Pattern Analysis (by construct)
- Historical progress chart

#### F9 — Recycle Phase

- Targeted modules for weak micro-skills (points < 20)
- Same behavior as baseline (complete modules)
- Delta analytics (before/after comparison)
- "Generate Next Plan" button after completion

#### F10 — Real-Time Profile Updates

- Every answer submission immediately updates:
  - `user_skill_state` (total_points, accuracy, speed, l1/l2/l3 correct)
  - `user_construct_state` (5 constructs)
  - `attempt_error_tags` (rule-based)
- Coverage checked on every update (total_points ≥ 20)
- Analytics always reflect current knowledge state

#### F11 — Campus Score Database

- Admin-managed university/program passing scores
- AI-assisted research with human-in-loop confirmation
- Data: university name, major, min_score, year, source URL
- Student readiness compared to target campus score

### 3.2 Admin Features

#### F12 — Exam Research Pipeline

- 5-batch AI research: Structure, Taxonomy, Constructs, Error Patterns, Exam Date
- Exam date prediction requires human confirmation
- AI operation logging with token/cost tracking

#### F13 — Taxonomy Management

- 5-level hierarchy CRUD (Subject → Micro-skill)
- AI suggestions for gaps
- Micro-skill coverage tracking (has questions? has Material Card?)

#### F14 — Question Management

- AI generation per micro-skill with difficulty level (L1/L2/L3)
- Support all 5 formats: MCQ5, MCQ4, MCK, TF, Fill-in
- QC review queue + publish workflow
- Coverage dashboard: which micro-skills have questions

#### F15 — Material Card Management (NEW)

- AI batch generation per micro-skill
- Manual edit/refine
- Coverage dashboard
- Publish workflow

#### F16 — Module Composition

- Create modules from question collections
- Types: baseline, drill, recycle
- 10-15 questions per module
- Pass threshold configuration (default 70%)

#### F17 — Campus Score Management (NEW)

- CRUD for university passing scores
- AI-assisted research
- Human-in-loop verification required

#### F18 — Baseline Builder

- Link published modules as ordered baseline checkpoints
- Validate all micro-skills are covered
- Set module sequence

---

## 4. Non-Goals & Constraints

| #   | Constraint                                                                 |
| --- | -------------------------------------------------------------------------- |
| C1  | No per-question AI diagnosis — cost-efficient AI only for content ops      |
| C2  | No dark mode required (listed as "Optional" in DESIGN.v2)                  |
| C3  | No gamification beyond natural progress (honest progress, no fake streaks) |
| C4  | Streaks are listed as "Future"                                             |
| C5  | Offline mode is mentioned in error handling but not a core requirement     |
| C6  | No payment/subscription system in current scope                            |
| C7  | Mobile-first but desktop support required (responsive, not native)         |

---

## 5. Design System Rules

### 5.1 Theme: Soft Neubrutalism

| Element          | Specification                                                       |
| ---------------- | ------------------------------------------------------------------- |
| **Cards**        | 2px charcoal border (#2D3748), 4px offset shadow, 16px radius       |
| **Colors**       | Pastel surfaces (yellow, lavender, sky, mint, peach, cream)         |
| **Typography**   | Plus Jakarta Sans (primary), JetBrains Mono (code)                  |
| **Interactions** | Subtle lift on hover, quick press feedback (100ms)                  |
| **Mobile**       | Bottom nav (64px + safe area), 44px min touch targets               |
| **Shadows**      | Offset style: soft (3px), card (4px), elevated (6px), pressed (2px) |

### 5.2 Color Palette

- **Background:** `#FAFAF9` (primary), `#F5F5F4` (secondary), `#FFFFFF` (elevated)
- **Ink:** `#1A1A1A` (primary text), `#4A5568` (secondary), `#718096` (tertiary)
- **Border:** `#2D3748` (default), `#E2E8F0` (subtle), `#4A90D9` (focus)
- **Surfaces:** Yellow `#FEF3C7`, Lavender `#E9D5FF`, Sky `#DBEAFE`, Mint `#D1FAE5`, Peach `#FECACA`, Cream `#FEF9EF`
- **Primary CTA:** `#F97316` (coral/orange)
- **Semantic:** Success `#22C55E`, Warning `#F59E0B`, Error `#EF4444`, Info `#3B82F6`

### 5.3 Surface Color Context

| Context          | Background       |
| ---------------- | ---------------- |
| Baseline modules | surface.yellow   |
| Plan/tasks       | surface.sky      |
| Analytics        | surface.lavender |
| Material cards   | surface.cream    |
| Success/covered  | success.soft     |
| Needs attention  | warning.soft     |

### 5.4 Typography

- **Font:** Plus Jakarta Sans, Inter fallback, system-ui
- **Scale:** display-lg (48px) → overline (11px)
- **Body:** 16px, line-height 1.6, weight 400
- **Headings:** Bold (700-800), tight tracking
- **Button text:** 15px, weight 600

### 5.5 Spacing & Sizing

- **8px base unit** scale: 4, 8, 12, 16, 24, 32, 48, 64
- **Border radius:** sm 8px, md 12px, lg 16px, xl 24px, 2xl 32px, full 9999px
- **Touch targets:** 44×44px minimum
- **Bottom nav:** 64px + safe-area-bottom

### 5.6 Component Rules

- **Buttons:** primary (coral), secondary (white+border), ghost (transparent); sizes sm 36px, md 44px, lg 52px
- **Cards:** Always 2px border + offset shadow; interactive cards lift on hover
- **Progress:** 8px height bars, gradient fill approaching coverage
- **Readiness Ring:** Circular progress, 8px stroke
- **Toast:** Bottom-center above nav, 3-4s duration, semantic left border
- **Empty states:** Always include illustration, title, description, action button
- **Loading:** Skeleton shimmer, never blank screens

### 5.7 Animation Rules

- **Purpose > Decoration** — every animation aids comprehension
- **Fast > Slow** — button press 100ms, card hover 150ms, page transition 200ms
- **Celebration:** Confetti for module pass (50 particles)
- **Points:** Number flies up +fades on correct answer (600ms)
- **Progress fill:** 800ms ease-out with 200ms delay

### 5.8 Navigation

- **Student Mobile:** Bottom nav with 4 tabs (Plan, Drill, Review, Analytics)
- **Student Desktop:** Side rail
- **Admin:** Desktop sidebar (72px collapsed, 240px expanded)
- **Top Header:** 56px, back button on detail pages

### 5.9 Responsive Breakpoints

| Breakpoint | Width   | Navigation  |
| ---------- | ------- | ----------- |
| sm         | 640px   | Bottom tabs |
| md         | 768px   | Bottom tabs |
| lg         | 1024px  | Side rail   |
| xl+        | 1280px+ | Side rail   |

### 5.10 Accessibility

- WCAG 2.1 AA compliance
- 4.5:1 contrast for body text, 3:1 for large text
- 2px solid focus indicators with 2px offset
- Never use color alone to convey info
- All interactive elements focusable with logical tab order
- ARIA labels for icons, live regions for dynamic content

### 5.11 Content Formatting

- Math: KaTeX for equations (inline + block)
- Indonesian language: proper diacritic support
- Copy tone: Encouraging, not judgmental ("Hampir!" not "Gagal!")
- Sentence case for most text; Title Case for nav only
- Max line length: 65 characters for body text

---

## 6. Technical / Architecture Expectations

### 6.1 Stated Stack

| Layer        | Technology                                    |
| ------------ | --------------------------------------------- |
| Frontend     | Next.js 14 (App Router) + TypeScript          |
| Styling      | Tailwind CSS + shadcn/ui                      |
| Client State | Zustand                                       |
| Server State | TanStack React Query                          |
| Database     | Supabase (PostgreSQL + Auth + Edge Functions) |
| AI           | Anthropic Claude (server-only)                |
| Charts       | Recharts                                      |

### 6.2 Architecture Expectations

- **Two-portal architecture:** Student Portal (mobile-first) + Admin Console (desktop-optimized)
- **API routes as thin proxies** to Supabase Edge Functions
- **Edge Functions** for all business logic (submit, finalize, plan, snapshot, AI)
- **Row Level Security** on all tables
- **Real-time subscriptions** for state changes
- **Optimistic updates** for user actions

### 6.3 File Structure (Expected)

Key differences from current:

- `/drill` route (not `/locked-in`)
- `/review` route with `/review/[skillId]` for Material Card detail
- `components/review/MaterialCard.tsx`
- `components/drill/` directory
- `app/admin/materials/` (Material Card management)
- `app/admin/campus/` (Campus score management)

### 6.4 Data Model Expectations

- `taxonomy_nodes.id` should be TEXT (code-based like `UTBK26.TPS.PU.001`), currently UUID
- `questions.difficulty_level` should be `L1/L2/L3`, currently `easy/medium/hard`
- `questions.point_value` should be a generated column
- `user_skill_state` needs `total_points`, `is_covered`, `l1_correct`, `l2_correct`, `l3_correct`
- `material_cards` table required
- `campus_scores` table required
- `profiles.exam_date` column required
- `modules.pass_threshold` column required
- `attempts.points_awarded` column required

### 6.5 Business Logic Locations

| Logic             | Expected Location                                     |
| ----------------- | ----------------------------------------------------- |
| Point calculation | `submit-attempt` API / Edge Function                  |
| Coverage check    | `user_skill_state.is_covered` (generated column)      |
| Pass/fail         | `finalize-module` with 70% threshold                  |
| Readiness score   | Coverage% × 0.7 + Progress% × 0.3                     |
| Plan generation   | Edge Function → 5 drill modules from uncovered skills |
| Recycle           | Targeted modules for skills still < 20 points         |
| Error tags        | Rule-based derivation per attempt                     |
