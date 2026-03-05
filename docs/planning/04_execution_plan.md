# 04 — Execution Plan

> Four milestones with sequencing rationale, timeline ranges, and release readiness criteria.

---

## Milestone Overview

```
┌──────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
│  A: Stabilize &      │────▶│  B: Close P0         │────▶│  C: UX/Design        │────▶│  D: Hardening +      │
│     Align Foundations │     │     Feature Gaps      │     │     Convergence      │     │     Release Ready    │
│                      │     │                      │     │                      │     │                      │
│  ~1.5-2 weeks        │     │  ~3-4 weeks          │     │  ~2-3 weeks          │     │  ~1-2 weeks          │
└──────────────────────┘     └──────────────────────┘     └──────────────────────┘     └──────────────────────┘
```

**Total estimated timeline: 7.5–11 weeks** (1 full-time developer)

---

## Milestone A: Stabilize & Align Foundations (Week 1–2)

> **Goal:** Get the data model, auth, and routes correct before building features.

### Why First?
Everything downstream depends on the schema. Building features on the wrong schema means rework. Route renaming is easier without new pages depending on old routes.

### Tasks (in order)

| Order | Task ID | Title | Priority | Effort | Blocker? |
|---|---|---|---|---|---|
| 1 | T-001 | Add `difficulty_level` (L1/L2/L3) to questions | P0 | S | — |
| 2 | T-002 | Add `point_value` generated column to questions | P0 | S | — |
| 3 | T-003 | Add `total_points`, `l1_correct`, `l2_correct`, `l3_correct` to `user_skill_state` | P0 | M | — |
| 4 | T-004 | Add `is_covered` generated column | P0 | S | — |
| 5 | T-005 | Add `points_awarded` to attempts | P0 | S | — |
| 6 | T-006 | Add `pass_threshold` to modules | P0 | S | — |
| 7 | T-007 | Add `exam_date` to profiles | P0 | S | — |
| 8 | T-009 | Create `material_cards` table | P0 | M | — |
| 9 | T-010 | Create `campus_scores` table | P1 | M | — |
| 10 | T-008 | Write backfill script for existing data | P0 | M | T-003 |
| 11 | T-011 | Regenerate `database.types.ts` | P0 | S | All migrations |
| 12 | T-012 | Audit RLS policies for new tables | P0 | M | T-009, T-010 |
| 13 | T-022 | Rename `/locked-in` → `/drill` | P0 | M | — |
| 14 | T-023 | Rename `/taktis` → `/review` | P0 | M | — |
| 15 | T-024 | Update BottomNav/SideNav tab labels | P0 | S | T-022, T-023 |
| 16 | T-071 | Add admin role check to admin API routes | P0 | M | — |
| 17 | T-072 | Add admin middleware guard for `/admin/*` | P0 | M | — |
| 18 | T-073 | Extend middleware to guard all 6 phases | P0 | M | — |

### Exit Criteria — Milestone A

- [ ] All new columns/tables exist in Supabase with RLS
- [ ] `database.types.ts` reflects full schema
- [ ] Existing data backfilled without loss
- [ ] Routes renamed: `/drill` and `/review` active, old URLs redirect
- [ ] Bottom/side nav shows correct 4 tabs (Plan, Drill, Review, Analytics)
- [ ] Admin routes require authenticated admin role
- [ ] Middleware enforces all 6 user phases
- [ ] App builds without errors (`next build` passes)

---

## Milestone B: Close P0 Feature Gaps (Week 3–6)

> **Goal:** Implement the core adaptive learning loop and missing feature systems.

### Why Second?
With the schema stable, we can build the submit → score → update → coverage pipeline. Material Cards and Review page open up the learning content dimension.

### Phase B.1 — Core Adaptive Loop (Week 3–4)

| Order | Task ID | Title | Priority | Effort |
|---|---|---|---|---|
| 1 | T-014 | Submit-attempt: calculate `points_awarded` | P0 | M |
| 2 | T-015 | Submit-attempt: upsert `user_skill_state` (points, l1/l2/l3) | P0 | L |
| 3 | T-016 | Submit-attempt: recalculate `user_construct_state` | P0 | M |
| 4 | T-017 | Submit-attempt: derive `attempt_error_tags` | P0 | M |
| 5 | T-019 | Finalize-module: 70% pass threshold | P0 | M |
| 6 | T-020 | Finalize-module: return weak Material Cards on fail | P0 | M |
| 7 | T-021 | QuestionRunner: pass/fail UI | P0 | M |
| 8 | T-018 | Unit tests for point calculation | P0 | M |

### Phase B.2 — Material Cards + Review Page (Week 4–5)

| Order | Task ID | Title | Priority | Effort |
|---|---|---|---|---|
| 1 | T-037 | Admin `/materials` page (CRUD) | P0 | L |
| 2 | T-038 | AI batch generation for Material Cards | P0 | L |
| 3 | T-039 | Publish workflow (draft → review → published) | P0 | M |
| 4 | T-041 | Student `/review` page with topic tree | P0 | L |
| 5 | T-042 | Coverage status per micro-skill (X/20) | P0 | M |
| 6 | T-043 | `/review/[skillId]` Material Card detail | P0 | M |

### Phase B.3 — Question Types + Onboarding (Week 5–6)

| Order | Task ID | Title | Priority | Effort |
|---|---|---|---|---|
| 1 | T-030 | MCQ4 question type | P0 | M |
| 2 | T-031 | True/False question type | P0 | M |
| 3 | T-032 | Fill-in question type | P0 | M |
| 4 | T-025 | Onboarding: exam date picker | P0 | M |
| 5 | T-026 | Onboarding: daily time budget | P0 | S |

### Exit Criteria — Milestone B

- [ ] Answering a question updates `user_skill_state.total_points` in real-time
- [ ] Construct state recalculated on each submission
- [ ] Error tags derived rule-based on incorrect answers
- [ ] Module finalize checks 70% threshold, returns pass/fail
- [ ] Failed modules show Material Cards for weak skills
- [ ] Admin can create, AI-generate, and publish Material Cards
- [ ] Student `/review` page shows topic tree with coverage status
- [ ] Material Card detail page renders (Core Idea, Key Facts, Mistakes, Examples)
- [ ] MCQ4, TF, Fill-in question types work end-to-end
- [ ] Onboarding collects exam_date via calendar picker
- [ ] All point calculation paths have unit tests
- [ ] App builds without errors

---

## Milestone C: UX/Design Convergence (Week 7–9)

> **Goal:** Align visual design, add polish, and close P1 gaps.

### Phase C.1 — Design System + Data Fetching (Week 7)

| Order | Task ID | Title | Priority | Effort |
|---|---|---|---|---|
| 1 | T-063 | Connect design-tokens.ts to tailwind.config.ts | P1 | M |
| 2 | T-065 | Apply surface color context rules | P1 | M |
| 3 | T-064 | Audit & fix touch targets (44px) | P1 | M |
| 4 | T-074 | Set up React Query provider | P1 | S |
| 5 | T-060 | Decompose `plan/page.tsx` (726 lines) | P1 | L |
| 6 | T-075 | Migrate plan page to React Query | P1 | L |

### Phase C.2 — Drill + Plan + Analytics Polish (Week 8)

| Order | Task ID | Title | Priority | Effort |
|---|---|---|---|---|
| 1 | T-045 | Rebuild `/drill` page with module listing | P1 | M |
| 2 | T-046 | Required task pinning in drill | P1 | M |
| 3 | T-047 | Filter tabs (All/Required/Completed) | P1 | M |
| 4 | T-048 | Post-fail: Material Card review + retry | P1 | M |
| 5 | T-054 | Wire readiness-score formula | P1 | M |
| 6 | T-055 | CoverageMap: point-based | P1 | M |
| 7 | T-057 | Weak skills → Material Card links | P1 | S |
| 8 | T-059 | Exam countdown on plan page | P1 | S |
| 9 | T-061 | Plan generation targets uncovered skills | P1 | M |
| 10 | T-062 | "Generate Next Plan" in recycle | P1 | M |

### Phase C.3 — Campus + Loading + Animations (Week 9)

| Order | Task ID | Title | Priority | Effort |
|---|---|---|---|---|
| 1 | T-027 | Onboarding: target university | P1 | M |
| 2 | T-049 | Admin `/campus` page | P1 | L |
| 3 | T-052 | Campus target in Readiness Ring | P1 | M |
| 4 | T-066 | Skeleton loading for all pages | P1 | M |
| 5 | T-067 | Empty state components | P1 | M |
| 6 | T-068 | Confetti animation on pass | P1 | M |
| 7 | T-069 | Points fly-up animation | P1 | M |
| 8 | T-033 | Per-question timer | P1 | M |
| 9 | T-034 | Prev/next/review-later navigation | P1 | M |
| 10 | T-035 | Answer persistence | P1 | M |
| 11 | T-036 | KaTeX math rendering | P1 | M |

### Exit Criteria — Milestone C

- [ ] Design tokens connected to Tailwind; consistent visual language
- [ ] Surface colors match context rules (yellow=baseline, sky=plan, etc.)
- [ ] All touch targets ≥ 44px on mobile
- [ ] `plan/page.tsx` decomposed to < 300 lines per file
- [ ] React Query used for all data fetching in student portal
- [ ] `/drill` page shows all modules with filters
- [ ] Campus comparison in analytics
- [ ] Skeleton loading on all pages; no blank screens
- [ ] Confetti + point animations in QuestionRunner
- [ ] Timer, navigation, and persistence in QuestionRunner
- [ ] Math equations render via KaTeX

---

## Milestone D: Hardening + Release Readiness (Week 10–11)

> **Goal:** Testing, CI/CD, performance, and final quality pass.

### Tasks

| Order | Task ID | Title | Priority | Effort |
|---|---|---|---|---|
| 1 | T-080 | Set up Vitest + Testing Library | P2 | M |
| 2 | T-081 | Tests: point calculation | P0 | M |
| 3 | T-082 | Tests: readiness score formula | P1 | M |
| 4 | T-083 | Tests: phase transitions | P1 | M |
| 5 | T-084 | GitHub Actions CI pipeline | P2 | M |
| 6 | T-013 | Migration rollback scripts | P1 | M |
| 7 | T-076 | Migrate analytics to React Query | P1 | M |
| 8 | T-077 | Migrate baseline to React Query | P1 | M |
| 9 | T-078 | Audit & extract hardcoded strings to i18n | P2 | L |
| 10 | T-079 | Complete Indonesian translations | P2 | M |
| 11 | T-040 | Material Card coverage dashboard (admin) | P1 | M |
| 12 | T-044 | Subtopic progress indicator | P1 | S |
| 13 | T-050 | AI campus research | P1 | L |
| 14 | T-051 | Campus verification workflow | P1 | M |
| 15 | T-053 | Campus comparison in analytics | P1 | M |
| 16 | T-056 | Historical progress chart | P1 | L |
| 17 | T-058 | Verify delta analytics | P1 | M |
| 18 | T-070 | Progress bar animation | P2 | S |
| 19 | T-085 | Staging deployment | P2 | L |
| 20 | T-029 | Pre-fill exam date from admin | P1 | S |
| 21 | T-028 | Target major input | P1 | S |

### Exit Criteria — Milestone D

- [ ] Test suite passes (≥ 80% coverage on critical paths)
- [ ] CI pipeline: lint + type-check + test on every PR
- [ ] All P0 + P1 tasks complete
- [ ] No TypeScript errors (`tsc --noEmit` passes)
- [ ] `next build` succeeds with no warnings
- [ ] All admin API routes auth-guarded
- [ ] All user phases enforced in middleware
- [ ] Performance: Lighthouse mobile score ≥ 80
- [ ] i18n: all user-facing strings translated (EN + ID)
- [ ] Migration rollback scripts documented and tested

---

## Sequencing Rationale

```
A ───────────────────────────────────────────▶
  Schema + Auth + Routes = Foundation
  
  B ─────────────────────────────────────────▶
    Core loop + Material Cards + Question types
    Can't build without stable schema (A)
    
    C ───────────────────────────────────────▶
      Design polish + P1 features
      Needs working features to polish (B)
      
      D ─────────────────────────────────────▶
        Tests + CI + i18n + Final gaps
        Needs stable features to test (C)
```

**Critical path:** T-003 (schema) → T-015 (submit-attempt) → T-019 (pass/fail) → T-041 (review page)

The critical chain is the point-based coverage system. Every downstream feature (plan generation, drill pass/fail, coverage map, readiness score, recycle targeting) depends on `user_skill_state.total_points` being populated correctly.

---

## Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Schema migration breaks existing user data | High | Write backfill scripts (T-008); test on staging clone first; create rollback scripts (T-013) |
| Taxonomy node ID change (UUID → TEXT) | High | **Defer to future phase** — too risky with existing foreign keys; UUID works fine |
| Material Card AI generation quality | Medium | Human review workflow (T-039) before publish; iterate on prompts |
| Team velocity lower than estimated | Medium | Focus on P0 tasks only if behind; P1/P2 can defer to next sprint cycle |
| Student data loss during migration | Critical | Backup before each migration; `ALTER TABLE ADD COLUMN` is non-destructive |
| `plan/page.tsx` decomposition introduces bugs | Medium | Decompose before adding new features; test in isolation |

---

## Testing Strategy

| Layer | Scope | Tool | When |
|---|---|---|---|
| Unit | Point calculation, readiness formula, phase logic | Vitest | Milestone B+D |
| Integration | submit-attempt → user_skill_state pipeline | Vitest + Supabase test DB | Milestone B |
| Component | QuestionRunner, MaterialCard, ReviewPage | Testing Library | Milestone C |
| E2E | Full student journey (onboarding → baseline → plan → drill) | Future (Playwright) | Post-release |
| Manual QA | Admin workflows, mobile responsiveness | Human | Each milestone exit |

---

## Release Readiness Checklist

### Must-Have (Gate)
- [ ] Core adaptive loop works end-to-end (answer → points → coverage)
- [ ] All baseline modules create valid skill states
- [ ] Plan generation uses coverage data
- [ ] 70% pass threshold enforced
- [ ] Admin auth guarded
- [ ] All 4 student tabs functional (Plan, Drill, Review, Analytics)
- [ ] Material Cards viewable by students
- [ ] No TypeScript or build errors
- [ ] Critical path unit tests pass

### Should-Have (Quality)
- [ ] Campus score comparison
- [ ] All animations (confetti, points, progress)
- [ ] Skeleton loading on all pages
- [ ] React Query for data fetching
- [ ] Complete i18n coverage
- [ ] CI pipeline running

### Nice-to-Have (Polish)
- [ ] Historical progress charts
- [ ] Answer persistence on disconnect
- [ ] Per-question timer
- [ ] Staging deployment
- [ ] Migration rollback scripts
