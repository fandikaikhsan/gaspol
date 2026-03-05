# 00 — Current State (V3 Baseline Audit)

**Branch:** `baseline/v2-complete` (commit `df7a056`)  
**Audit date:** 2026-03-05  
**Source:** Codebase inspection + v2 planning docs + build/test verification

---

## 1. Stack Summary

| Layer | Technology | Version / Notes |
|-------|-----------|-----------------|
| Framework | Next.js 14 (App Router) | SSR/CSR hybrid |
| Language | TypeScript | Strict mode ON |
| Styling | Tailwind CSS 3.4 + shadcn/ui | Soft neubrutalism theme |
| State (client) | Zustand 5.x | Used in a few places |
| State (server) | TanStack React Query | Added in Milestone C; not adopted everywhere |
| Database | Supabase (PostgreSQL) | 32 migrations applied |
| Auth | Supabase Auth | JWT (ES256 workaround) |
| Edge Functions | Deno (TypeScript) | 9 functions deployed |
| Charts | Recharts 3.x | Radar, bar, ring |
| AI Provider | Anthropic Claude (configurable) | Via `ai_settings` table |
| i18n | Custom `lib/i18n/` | Indonesian + English; has bugs (keys leak) |
| Icons | Lucide React | Consistent usage |
| Math | KaTeX | Equation rendering in questions |
| Tests | Vitest | 1 test file, 59 tests (submit-attempt scoring) |
| CI/CD | None | Manual deploys |

---

## 2. Repository Map

```
gaspol/
├── app/
│   ├── (auth)/              # Login + Signup pages
│   │   ├── login/
│   │   └── signup/
│   ├── (student)/           # Student portal (mobile-first)
│   │   ├── layout.tsx       # Server layout (auth check)
│   │   ├── layout-client.tsx # Client layout (nav, toast, providers)
│   │   ├── analytics/       # Analytics dashboard
│   │   ├── baseline/        # Baseline assessment
│   │   │   ├── [moduleId]/  # QuestionRunner for baseline
│   │   │   └── [moduleId]/result/ # Pass/fail result
│   │   ├── drill/           # Drill hub
│   │   │   ├── page.tsx     # Main listing (356 lines, has bugs)
│   │   │   ├── drill/[taskId]/ # QuestionRunner for drill tasks
│   │   │   ├── drills/      # Redundant listing (B-001)
│   │   │   ├── drills/practice/ # Redundant practice (B-001)
│   │   │   ├── modules/     # Redundant module browser (B-001)
│   │   │   ├── mock/        # Mock exam stub (B-001)
│   │   │   └── review/      # Review from mistakes (B-001)
│   │   ├── onboarding/      # Exam date + time budget + campus
│   │   ├── plan/            # Timeline: baseline → tasks → recycle
│   │   ├── recycle/         # Recycle assessment
│   │   ├── review/          # Material cards + flashcards
│   │   │   ├── page.tsx     # Topic tree with skill coverage
│   │   │   ├── [skillId]/   # Material card detail
│   │   │   ├── flashcards/  # Basic flashcard viewer
│   │   │   └── swipe/       # Swipe-based review
│   │   └── settings/        # User settings
│   ├── admin/               # Admin console (desktop)
│   │   ├── ai-runs/         # AI operations + settings
│   │   ├── baseline/        # Baseline module builder
│   │   ├── campus/          # Campus score database
│   │   ├── debug/           # Debug tools
│   │   ├── diagnostics/     # System health checks
│   │   ├── exams/           # Exam research pipeline
│   │   ├── flashcards/      # Flashcard content management
│   │   ├── materials/       # Material card CRUD + AI gen
│   │   ├── metadata/        # Construct weight config
│   │   ├── modules/         # Module composition
│   │   ├── questions/       # Question bank + AI gen
│   │   └── taxonomy/        # 5-level taxonomy CRUD
│   ├── api/                 # API routes
│   │   ├── submit-attempt/  # Answer submission (579 lines)
│   │   ├── finalize-baseline-module/
│   │   ├── generate-plan/
│   │   ├── generate-snapshot/
│   │   ├── create-recycle-checkpoint/
│   │   ├── test-auth/
│   │   └── admin/           # 7 admin AI routes
│   └── auth/callback/       # Supabase OAuth callback
├── components/
│   ├── assessment/          # QuestionRunner, AnswerOptions, MathRenderer
│   ├── analytics/           # ReadinessRing, ConstructRadar, CoverageMap, etc.
│   ├── plan/                # Timeline components
│   ├── review/              # (FlashcardStack only)
│   ├── navigation/          # TopNav, BottomNav, SideNav
│   ├── onboarding/          # Onboarding form components
│   ├── admin/               # ConstructWeightsEditor
│   ├── providers/           # SupabaseProvider, I18nProvider
│   └── ui/                  # shadcn/ui primitives
├── lib/
│   ├── supabase/            # Client + server helpers
│   ├── analytics/           # Scoring + readiness functions
│   ├── assessment/          # Answer checking, point calculation
│   ├── state-machine/       # Phase transitions
│   ├── i18n/                # Translation system
│   ├── hooks/               # Custom hooks
│   ├── utils/               # Shared utilities
│   └── design-tokens.ts     # Design token constants
├── hooks/                   # Top-level hooks (toast, language, phase)
├── supabase/
│   ├── migrations/          # 32 SQL migrations (001–032)
│   ├── functions/           # Edge functions
│   ├── seed.sql             # Base seed data
│   └── seed_with_exam.sql   # Full exam seed
├── tests/                   # Vitest tests
│   └── submit-attempt.test.ts # 59 unit tests
├── scripts/                 # Data import/backfill scripts
├── prompts/                 # AI prompt templates
└── docs/                    # Documentation
    ├── planning/            # V2 planning (00–06)
    └── planning_v3/         # V3 planning (this folder)
```

---

## 3. Important Modules & Current Implementation Status

### Student Flows — Implemented

| Flow | Route | Status | Notes |
|------|-------|--------|-------|
| Onboarding | `/onboarding` | ✅ Complete | Exam date picker, time budget, campus select |
| Baseline assessment | `/baseline/[moduleId]` | ✅ Complete | QuestionRunner with pass/fail |
| Plan timeline | `/plan` | ✅ Complete | Baseline → tasks → recycle sections |
| Drill listing | `/drill` | 🟡 Partial | Flat listing, filter tabs broken (B-002) |
| Drill execution | `/drill/drill/[taskId]` | ✅ Complete | QuestionRunner with scoring |
| Review / topic tree | `/review` | ✅ Complete | Topic tree, coverage X/20, material card links |
| Material card detail | `/review/[skillId]` | 🟡 Partial | Content renders, missing drill/chat buttons |
| Flashcards | `/review/flashcards` | 🟡 Partial | Basic swipe UI, no SR, i18n broken |
| Analytics | `/analytics` | ✅ Complete | Readiness, radar, coverage, weak skills |
| Recycle | `/recycle` | ✅ Complete | Targeted assessment |
| Settings | `/settings` | ✅ Complete | User preferences |

### Admin Flows — Implemented

| Flow | Route | Status |
|------|-------|--------|
| Exam research | `/admin/exams` | ✅ Complete |
| Taxonomy CRUD | `/admin/taxonomy` | ✅ Complete |
| Question bank + AI gen | `/admin/questions` | ✅ Complete |
| Material card CRUD + AI gen | `/admin/materials` | ✅ Complete |
| Module composition | `/admin/modules` | ✅ Complete |
| Baseline builder | `/admin/baseline` | ✅ Complete |
| Campus scores | `/admin/campus` | ✅ Complete |
| AI operations + settings | `/admin/ai-runs` | ✅ Complete |
| Diagnostics | `/admin/diagnostics` | ✅ Complete |

### API Routes — Implemented

| Route | Status | Notes |
|-------|--------|-------|
| `POST /api/submit-attempt` | ✅ Complete | 579 lines; scoring, points, skill state, constructs, error tags |
| `POST /api/finalize-baseline-module` | ✅ Complete | Pass/fail, weak skills |
| `POST /api/generate-plan` | ✅ Complete | 5-task plan generation |
| `POST /api/generate-snapshot` | ✅ Complete | Analytics snapshot |
| `POST /api/create-recycle-checkpoint` | ✅ Complete | Recycle creation |
| Admin AI routes (7) | ✅ Complete | All with admin auth guard |

---

## 4. Current Flows

### Scoring Pipeline (submit-attempt)
```
User answers question
  → POST /api/submit-attempt
    1. Auth check (Supabase session)
    2. Rate limit (60 req/min per user)
    3. Fetch question (validate exists, is_active)
    4. Check correctness
    5. Calculate points_awarded (L1=1, L2=2, L3=5 on correct)
    6. Insert attempt record
    7. Upsert user_skill_state (total_points, accuracy, l1/l2/l3_correct)
    8. Recalculate user_construct_state (EMA weighted)
    9. Derive attempt_error_tags (rule-based: SLOW, RUSHED, CARELESS, CONCEPT_GAP)
    10. Return result to client
```

### Baseline → Plan → Drill Loop
```
1. User completes all baseline modules
2. "Generate Plan" unlocks → POST /api/generate-plan
3. 5 drill tasks created (weak skill modules)
4. User completes tasks via /drill/drill/[taskId]
5. 70% threshold to pass; fail → material cards, retry
6. All tasks done → "Recycle" unlocks
7. POST /api/create-recycle-checkpoint → targeted reassessment
8. Loop back to plan generation
```

---

## 5. Known Technical Risks

| # | Risk | Severity | Status |
|---|------|----------|--------|
| 1 | **B-003: Submit-attempt may fail in production** | P0 | Open — works in tests, but "Failed to save attempt" error reported in prod context |
| 2 | **B-002: Filter labels show i18n keys** | P1 | Open — `tc("filter.all")` not resolving |
| 3 | **B-004: Flashcard i18n keys visible** | P1 | Open — `t("flashcards.cardOf")` etc. |
| 4 | **B-005: Flashcard buttons overflow** | P2 | Open — flex layout issue on mobile |
| 5 | **B-001: Drill route redundancy** | P2 | Open — 5 sub-routes under /drill |
| 6 | **i18n system fragility** | P1 | Systemic — keys leak across multiple pages |
| 7 | **React Query adoption incomplete** | P2 | Added in M-C but not used everywhere |
| 8 | **No CI/CD** | P2 | Manual deploys only |
| 9 | **`as any` type casts** | P2 | Reduced in M-A/B but still present |
| 10 | **Client-side student layout** | P2 | Entire layout is `"use client"` |

---

## 6. Supabase Status

### Migrations (32 applied, all in sync)

| Range | Description | Status |
|-------|-------------|--------|
| 001–004 | Initial schema, RLS, indexes, signup trigger | ✅ Applied |
| 005–006 | Admin extensions, admin RLS | ✅ Applied |
| 007–010 | Question options, schema updates, triggers, versioning | ✅ Applied |
| 011–013 | Question taxonomy, module composer, analysis schema | ✅ Applied |
| 014–016 | Construct weights, mastery engine, analytics snapshots | ✅ Applied |
| 017–019 | Question metadata, construct research, metadata suggestions | ✅ Applied |
| 021–025 | Error patterns, adaptive constructs, analytics fixes, AI runs | ✅ Applied |
| 026–029 | AI settings, analytics pipeline, language, snapshot fix | ✅ Applied |
| 030 | Point-based coverage (difficulty_level, point_value, total_points, is_covered) | ✅ Applied |
| 031 | Material cards + campus scores tables | ✅ Applied |
| 032 | RLS for material cards + campus scores | ✅ Applied |

**Migration drift:** Fixed twice during v2 (documented in progress log). Currently in sync (`supabase migration list --linked` shows all 32 applied).

### Edge Functions (in repo under supabase/functions/)

| Function | Purpose |
|----------|---------|
| submit_attempt | Process answer |
| finalize_checkpoint | Module completion |
| generate_plan | Plan creation |
| generate_snapshot | Analytics |
| create_recycle_checkpoint | Recycle |
| research_exam | AI research (5 batches) |
| generate_questions | AI question gen |
| generate_material_cards | AI material card gen |
| generate_flashcards | AI flashcard gen |

### RLS Policies
- Core tables (profiles, user_state, user_skill_state): Users read/write own data
- Content tables (questions, modules, taxonomy_nodes): Public read
- Admin tables (ai_runs, ai_settings): Admin-only
- Material cards / campus scores: Student read, admin write (migration 032)

---

## 7. Build/Test/Lint Verification (2026-03-05)

| Check | Result |
|-------|--------|
| `pnpm run build` | ✅ Pass — all pages compile |
| `pnpm run test` | ✅ Pass — 59/59 tests (submit-attempt scoring) |
| `pnpm run lint` | ⚠️ Warnings only — 7 React Hook dependency warnings (no errors) |
| `supabase migration list --linked` | ✅ All 32 migrations in sync |

---

## 8. V2 Milestone Completion Summary

| Milestone | Branch | Tasks | Status |
|-----------|--------|-------|--------|
| A: Stabilize & Align Foundations | `exec/milestone-a` | 18/18 | ✅ Complete |
| B: Close P0 Feature Gaps | `exec/milestone-b` | 19/19 | ✅ Complete |
| C: UX & DX Polish | `exec/milestone-c` | ~15 tasks | ✅ Complete |

**Total v2 tasks completed:** ~52  
**Commit count (main → baseline):** ~25 meaningful feature commits
