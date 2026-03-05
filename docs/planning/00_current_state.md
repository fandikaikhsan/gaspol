# 00 — Current State Assessment

> Generated: 2026-03-03
> Scope: Full repo audit of `/Users/fandikaikhsan/Projects/gaspol`

---

## 1. Stack Summary

| Layer               | Technology                   | Version / Notes                                                                  |
| ------------------- | ---------------------------- | -------------------------------------------------------------------------------- |
| **Framework**       | Next.js 14 (App Router)      | `^14.2.0`, TypeScript                                                            |
| **Styling**         | Tailwind CSS 3.4 + shadcn/ui | Custom "Soft Neubrutalism" theme                                                 |
| **UI Primitives**   | Radix UI                     | accordion, dialog, dropdown, label, progress, radio, select, switch, tabs, toast |
| **State (Client)**  | Zustand 5.x                  | Persisted phase store                                                            |
| **Server State**    | TanStack React Query 5.x     | Installed but **not used** — all pages use manual `useEffect` fetch              |
| **Database**        | Supabase (PostgreSQL + Auth) | `@supabase/ssr ^0.8`, `supabase-js ^2.97`                                        |
| **Charts**          | Recharts 3.x                 | Used in analytics components                                                     |
| **Icons**           | Lucide React                 | `^0.575.0`                                                                       |
| **i18n**            | Custom Zustand-based         | EN + ID locales, 10 namespaces                                                   |
| **AI Provider**     | Anthropic Claude             | Via Edge Functions (server-side only)                                            |
| **Linting**         | ESLint (next config)         | `next lint` script                                                               |
| **Testing**         | **None**                     | No test framework, no test files                                                 |
| **CI/CD**           | **None**                     | No GitHub Actions, no Vercel config found                                        |
| **Package Manager** | npm (inferred)               | `package-lock.json` likely present                                               |

---

## 2. Repo Map

```
gaspol/
├── app/
│   ├── (auth)/              # Login + Signup pages
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (student)/           # Student portal (all client-rendered)
│   │   ├── layout.tsx       # Client layout with BottomNav/SideNav
│   │   ├── layout-client.tsx # Language sync wrapper
│   │   ├── onboarding/      # 3-step onboarding wizard
│   │   ├── plan/            # Plan dashboard (timeline hub)
│   │   ├── baseline/        # Baseline assessment hub + runner
│   │   │   └── [moduleId]/  # QuestionRunner for baseline
│   │   ├── locked-in/       # "Drill" hub with sub-pages
│   │   │   ├── drill/[taskId]/ # Drill runner
│   │   │   ├── drills/      # Drill list + practice
│   │   │   ├── mock/        # Mock exam (stub)
│   │   │   ├── modules/     # Module browser
│   │   │   └── review/      # Review from mistakes
│   │   ├── recycle/         # Recycle assessment hub
│   │   ├── analytics/       # Analytics dashboard
│   │   ├── settings/        # User settings
│   │   └── taktis/          # Flashcards (swipe + stack)
│   ├── admin/               # Admin console (11 pages)
│   │   ├── exams/           # Exam CRUD + research trigger
│   │   ├── taxonomy/        # 5-level taxonomy tree CRUD + AI
│   │   ├── questions/       # Question bank CRUD + AI gen
│   │   ├── modules/         # Module composer
│   │   ├── baseline/        # Baseline checkpoint config
│   │   ├── metadata/        # Construct weights + metadata
│   │   ├── flashcards/      # Flashcard CRUD + AI gen
│   │   ├── ai-runs/         # AI operation logs + settings
│   │   ├── diagnostics/     # System health checks
│   │   └── debug/           # Debug page
│   └── api/                 # Next.js API routes (thin proxies)
│       ├── submit-attempt/
│       ├── finalize-baseline-module/
│       ├── generate-plan/
│       ├── generate-snapshot/
│       ├── create-recycle-checkpoint/
│       └── admin/           # 6 admin AI proxy routes
├── components/
│   ├── assessment/          # QuestionRunner + format renderers
│   ├── analytics/           # 10 chart/score components
│   ├── plan/                # ProgressHeader, TaskCard, GatedCTA
│   ├── navigation/          # BottomNav, SideNav, TopNav
│   ├── taktis/              # FlashcardStack
│   └── ui/                  # 17 shadcn/ui base components
├── lib/
│   ├── analytics/           # Readiness score, construct scoring, exam config
│   ├── assessment/          # Type definitions
│   ├── i18n/                # Translation system + locale files
│   ├── state-machine/       # UserPhase Zustand store
│   ├── supabase/            # Client, server, middleware, DB types
│   └── utils/               # Error messages
├── hooks/                   # useUserPhase, useLanguageSync, useToast
├── supabase/
│   ├── migrations/          # 29 SQL migration files (5,459 lines total)
│   ├── functions/           # 9 Edge Functions (Deno/TypeScript)
│   └── seed.sql / seed_with_exam.sql
├── scripts/                 # Bootstrap SQL, backfill, seed helpers
├── prompts/                 # AI prompt templates
└── docs/                    # Architecture + troubleshooting docs
```

---

## 3. Current User Flows

### 3.1 Authentication

- Supabase Auth with email/password
- `handle_new_user()` trigger creates `profiles` + `user_state` on signup
- Middleware refreshes session + enforces route guards
- JWT ES256 workaround documented (known issue)

### 3.2 Onboarding (`/onboarding`)

- **Step 1:** Select package duration (7/14/21/30 days) — **NOT exam date as blueprint requires**
- **Step 2:** Set daily time budget (30/60/90/120 min)
- **Step 3:** Target university + major (text inputs)
- Updates `profiles` → transitions `user_state` to `BASELINE_ASSESSMENT_IN_PROGRESS`
- Redirects to `/baseline`

### 3.3 Baseline Assessment (`/baseline`)

- Hub lists all `baseline_modules` with completion badges
- Each module launches `QuestionRunner` (MCQ5, MCK-Table, Fill-in)
- On completion: submits attempts individually → finalizes module
- After all complete: CTA to view analytics
- **No pass/fail threshold** — any score is accepted

### 3.4 Plan Dashboard (`/plan`)

- Shows `ProgressHeader` (day countdown)
- Lists baseline completion status
- "Generate Plan" CTA (calls Edge Function)
- Lists current cycle tasks with `TaskCard`
- `GatedCTAButton` for recycle unlock

### 3.5 Locked-In / Drill (`/locked-in/*`)

- Hub with 3 modes: Practice Drills, Modules, Review
- Drill runner at `/locked-in/drill/[taskId]`
- Practice drills at `/locked-in/drills/practice`
- Module browser at `/locked-in/modules`
- Review (from mistakes) at `/locked-in/review`

### 3.6 Recycle (`/recycle`)

- Phase-gated hub
- Creates checkpoint via Edge Function
- Displays past checkpoints

### 3.7 Analytics (`/analytics`)

- Readiness score (simple average of 5 constructs)
- Construct radar chart
- Coverage map by subtopic
- Weak skills list
- Error pattern analysis

### 3.8 Taktis / Flashcards (`/taktis/*`)

- Flashcard stack with flip animation
- Swipe mode
- Not part of the SoT blueprint — appears to be a separate feature

### 3.9 Admin Console (`/admin/*`)

- Exam CRUD + 5-batch AI research pipeline
- Taxonomy tree CRUD + AI suggestions
- Question bank CRUD + AI generation
- Module composer
- Baseline checkpoint manager
- Metadata/construct weights editor
- Flashcard CRUD + AI generation
- AI run logs + settings
- Diagnostics

---

## 4. Tech Risks & Tech Debt Hotspots

### 4.1 Critical — Type Safety

- `lib/supabase/database.types.ts` only defines 2 of ~25 tables
- Pervasive `as any` casting throughout all pages
- No auto-generated types (`npx supabase gen types` never run)
- **Risk:** Silent runtime errors, impossible refactoring

### 4.2 Critical — Phase Enforcement

- `canTransitionTo()` defined but never called
- `updateUserState()` writes any phase without validation
- Middleware only guards 2 of 6 phases
- Users in `BASELINE_COMPLETE` can access `/recycle` or any route
- **Risk:** Users can skip the learning journey entirely

### 4.3 Critical — Admin Auth

- No admin role check on admin API routes
- Admin layout has no server-side role verification
- Middleware checks role for `/admin` routes but admin API routes are under `/api/admin` — **not covered by the admin route guard**
- **Risk:** Any authenticated user can trigger AI operations, modify content

### 4.4 High — Data Pipeline Gaps

- `submit-attempt` does NOT update `user_skill_state` or `user_construct_state`
- Profile updates happen only via DB trigger (`process_attempt_analytics`) — but the trigger's v2 function may not match blueprint logic
- No point-based coverage system implemented anywhere
- **Risk:** Core adaptive learning loop is broken — analytics don't reflect reality

### 4.5 High — Design System Fragmentation

- **Three sources of truth:** `design-tokens.ts`, CSS custom properties in `globals.css`, hardcoded hex utilities
- `design-tokens.ts` is largely unused (not wired into Tailwind config)
- Tailwind config uses CSS variables but doesn't expose pastel surface colors or construct colors
- **Risk:** Inconsistent UI, hard to maintain, design drift

### 4.6 High — No Tests

- Zero test files (unit, integration, or e2e)
- No test framework installed
- No CI/CD pipeline
- **Risk:** Regressions on every change, no confidence in deployments

### 4.7 Medium — Performance

- Entire `(student)` layout is `"use client"` — negates SSR benefits
- N+1 query patterns in baseline and plan pages
- No React Query usage despite being installed — all manual `useEffect` fetch
- Two Supabase queries per middleware invocation (every request)
- **Risk:** Slow page loads, unnecessary re-renders

### 4.8 Medium — Supabase Governance

- 29 migration files exist but no evidence of `supabase db pull` to verify against remote
- Schema drift suspected: remote may have manual Dashboard edits
- Edge Functions exist but deployment state unknown
- No staging environment evident
- **Risk:** Schema drift, unreproducible environments, failed deployments

### 4.9 Medium — Answer Persistence

- QuestionRunner stores answers in React state only
- Browser crash / navigation = all progress lost
- No localStorage backup, no draft-saving API
- **Risk:** Users lose 15+ minutes of work if browser crashes

### 4.10 Low — Navigation Mismatch

- Blueprint specifies 4 tabs: **Plan, Drill, Review, Analytics**
- Current BottomNav has: **Plan, Locked-In, Taktis, Analytics**
- No "Review" tab (Material Cards page)
- "Taktis" (flashcards) is not in the blueprint
- **Risk:** UX confusion, feature mismatch with product vision

### 4.11 Low — i18n Coverage

- Good i18n infrastructure with EN + ID
- But `window.confirm` in QuestionRunner is not i18n-friendly
- Some strings hardcoded (e.g., "TBD" in admin dashboard)

---

## 5. Supabase Schema Objects Summary

### Tables (26)

`profiles`, `user_state`, `taxonomy_nodes`, `questions`, `question_options`, `question_option_metadata`, `question_tags`, `question_taxonomy`, `question_versions`, `modules`, `module_questions`, `baseline_modules`, `attempts`, `attempt_error_tags`, `module_completions`, `analytics_snapshots`, `user_skill_state`, `user_construct_state`, `plan_cycles`, `plan_tasks`, `recycle_checkpoints`, `tags`, `exams`, `constructs`, `ai_runs`, `ai_settings`, `flashcards`, `flashcard_reviews`, `content_review_queue`, `admin_settings`, `exam_constructs`

### Missing Tables (vs Blueprint)

- `material_cards` — Material Card content per micro-skill
- `campus_scores` — University/program passing scores

### Missing Columns (vs Blueprint)

- `profiles.exam_date` — User exam date input
- `questions.difficulty_level` — Currently `difficulty` with values `easy/medium/hard` instead of `L1/L2/L3`
- `questions.point_value` — Generated column based on difficulty
- `user_skill_state.total_points` — Point accumulation per skill
- `user_skill_state.is_covered` — Generated boolean (≥20 points)
- `user_skill_state.l1_correct`, `l2_correct`, `l3_correct` — Per-difficulty counters
- `modules.pass_threshold` — 70% threshold
- `attempts.points_awarded` — Points given per answer
- `exams.default_exam_date` — Admin-set exam date

### Edge Functions (9)

`create_recycle_checkpoint`, `generate_flashcards`, `generate_plan`, `generate_questions`, `generate_snapshot`, `generate_taxonomy_tree`, `research_exam`, `suggest_metadata`, `suggest_taxonomy_node`

### Missing Edge Functions (vs Blueprint)

- `generate_material_cards` — AI Material Card generation
- `research_campus_scores` — AI campus score research
- `submit_attempt` (enhanced) — Real-time skill state updates (currently just Next.js API route)
- `finalize_module` (enhanced) — Pass/fail with weak skills (currently just Next.js API route)

### SQL Functions (35+)

Key ones: `handle_new_user`, `process_attempt_analytics`, `update_user_skill_state_v2`, `update_user_constructs_v2`, `generate_analytics_snapshot`, `calculate_coverage_map`, `calculate_radar_data`, `get_latest_snapshot`, `get_exam_constructs`, `propagate_mastery_to_parents_v2`

### Views (7)

`question_metadata_completeness`, `question_metadata_status`, `exam_research_status`, `exam_configuration_status`, `exam_error_pattern_status`, `taxonomy_research_status`, `error_tags_by_exam`, `unlinked_questions`
