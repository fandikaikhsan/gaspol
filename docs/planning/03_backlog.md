# 03 — Backlog

> Epics → Stories → Tasks — prioritized, estimated, and sequenced.

---

## Notation

- **Priority:** P0 (must-have for core loop), P1 (important UX/quality), P2 (nice-to-have / future)
- **Effort:** S (≤4h), M (4-16h), L (16-40h), XL (40h+)
- **Dependencies:** listed by task ID
- **Supabase Governance:** All migration tasks require careful review — existing data may need backfill

---

## Epic 1: Stabilize Supabase Schema (P0)

> Align the data model with blueprint before building features on top.

### Story 1.1 — Point-Based Coverage Schema

| Task ID | Title                                                                              | Priority | Effort | Deps  | Files                        | Acceptance Criteria                                                                      |
| ------- | ---------------------------------------------------------------------------------- | -------- | ------ | ----- | ---------------------------- | ---------------------------------------------------------------------------------------- |
| T-001   | Add `difficulty_level` (L1/L2/L3) to `questions` table                             | P0       | S      | —     | Migration                    | Column exists; backfill from existing `difficulty` mapping (easy→L1, medium→L2, hard→L3) |
| T-002   | Add `point_value` generated column to `questions`                                  | P0       | S      | T-001 | Migration                    | Auto-calculated from `difficulty_level` (L1→1, L2→2, L3→5)                               |
| T-003   | Add `total_points`, `l1_correct`, `l2_correct`, `l3_correct` to `user_skill_state` | P0       | M      | —     | Migration                    | Columns exist with defaults; backfill script from existing `accuracy`/`attempts` data    |
| T-004   | Add `is_covered` generated column to `user_skill_state`                            | P0       | S      | T-003 | Migration                    | `is_covered = (total_points >= 20)` computed automatically                               |
| T-005   | Add `points_awarded` to `attempts` table                                           | P0       | S      | T-002 | Migration                    | Column nullable, populated on submit                                                     |
| T-006   | Add `pass_threshold` to `modules` table (default 0.7)                              | P0       | S      | —     | Migration                    | Column exists, default 0.7, existing modules backfilled                                  |
| T-007   | Add `exam_date` to `profiles` table                                                | P0       | S      | —     | Migration                    | DATE column, nullable; keep `package_days` for backward compat                           |
| T-008   | Write backfill script for existing `user_skill_state` data                         | P0       | M      | T-003 | `scripts/backfill-points.ts` | Existing mastery levels approximated to points; no data loss                             |

### Story 1.2 — New Tables

| Task ID | Title                                            | Priority | Effort | Deps         | Files               | Acceptance Criteria                                                                                                                             |
| ------- | ------------------------------------------------ | -------- | ------ | ------------ | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| T-009   | Create `material_cards` table with RLS           | P0       | M      | —            | Migration           | Schema: id, skill_id (FK taxonomy L5), title, core_idea, key_facts, common_mistakes, examples, status (draft/published), created_at, updated_at |
| T-010   | Create `campus_scores` table with RLS            | P1       | M      | —            | Migration           | Schema: id, university_name, major, min_score, year, source_url, verified (bool), created_at                                                    |
| T-011   | Regenerate `database.types.ts` from Supabase CLI | P0       | S      | T-003, T-009 | `database.types.ts` | All 25+ tables typed; run `supabase gen types typescript`                                                                                       |

### Story 1.3 — Schema Governance

| Task ID | Title                                 | Priority | Effort | Deps         | Files                    | Acceptance Criteria                                                                |
| ------- | ------------------------------------- | -------- | ------ | ------------ | ------------------------ | ---------------------------------------------------------------------------------- |
| T-012   | Audit all RLS policies for new tables | P0       | M      | T-009, T-010 | Migrations               | Students read-only on material_cards; admin full access; campus_scores public read |
| T-013   | Create migration rollback scripts     | P1       | M      | T-001–T-010  | `scripts/rollback-*.sql` | Each migration has a reversible counterpart                                        |

---

## Epic 2: Core Adaptive Loop (P0)

> The submit → score → update → coverage chain — the heart of the product.

### Story 2.1 — Submit-Attempt Overhaul

| Task ID | Title                                                                       | Priority | Effort | Deps         | Files                                                         | Acceptance Criteria                                        |
| ------- | --------------------------------------------------------------------------- | -------- | ------ | ------------ | ------------------------------------------------------------- | ---------------------------------------------------------- |
| T-014   | Update submit-attempt to calculate `points_awarded`                         | P0       | M      | T-002, T-005 | `api/submit-attempt/route.ts`, Edge Function `submit-attempt` | Correct answer → points_awarded = point_value; wrong → 0   |
| T-015   | Update submit-attempt to upsert `user_skill_state` (total_points, l1/l2/l3) | P0       | L      | T-003, T-014 | Edge Function `submit-attempt`                                | Each submission accumulates points and per-level counts    |
| T-016   | Update submit-attempt to recalculate `user_construct_state`                 | P0       | M      | T-015        | Edge Function `submit-attempt`                                | 5 construct dimensions updated after each answer           |
| T-017   | Update submit-attempt to derive `attempt_error_tags`                        | P0       | M      | T-015        | Edge Function `submit-attempt`                                | Rule-based error tag assignment on incorrect answers       |
| T-018   | Write unit tests for point calculation logic                                | P0       | M      | T-014        | `tests/submit-attempt.test.ts`                                | All difficulty levels × correct/incorrect scenarios tested |

### Story 2.2 — Finalize Module with Pass/Fail

| Task ID | Title                                                    | Priority | Effort | Deps         | Files                                   | Acceptance Criteria                                                     |
| ------- | -------------------------------------------------------- | -------- | ------ | ------------ | --------------------------------------- | ----------------------------------------------------------------------- |
| T-019   | Add 70% pass threshold check to finalize-baseline-module | P0       | M      | T-006        | `api/finalize-baseline-module/route.ts` | Returns pass/fail status; reads module.pass_threshold                   |
| T-020   | Return weak skill Material Cards on module fail          | P0       | M      | T-009, T-019 | `api/finalize-baseline-module/route.ts` | Response includes Material Card data for missed skills                  |
| T-021   | Add pass/fail UI to QuestionRunner results screen        | P0       | M      | T-019        | `QuestionRunner.tsx`                    | Pass → celebration confetti; Fail → Material Card review + retry button |

---

## Epic 3: Navigation & Route Alignment (P0)

> Rename routes and tabs to match SoT before building new pages.

### Story 3.1 — Route Rename

| Task ID | Title                                                       | Priority | Effort | Deps         | Files                                                    | Acceptance Criteria                                   |
| ------- | ----------------------------------------------------------- | -------- | ------ | ------------ | -------------------------------------------------------- | ----------------------------------------------------- |
| T-022   | Rename `/locked-in` → `/drill`                              | P0       | M      | —            | `app/(student)/locked-in/` → `drill/`, all imports/links | All navigation points to `/drill`; old URL redirects  |
| T-023   | Rename `/taktis` → `/review`                                | P0       | M      | —            | `app/(student)/taktis/` → `review/`, all imports/links   | All navigation points to `/review`; old URL redirects |
| T-024   | Update BottomNav tab labels: Locked-In→Drill, Taktis→Review | P0       | S      | T-022, T-023 | `BottomNav.tsx`, `SideNav.tsx`                           | Tab labels match SoT (Plan, Drill, Review, Analytics) |

---

## Epic 4: Onboarding Overhaul (P0)

### Story 4.1 — Exam Date & Target Campus

| Task ID | Title                                                        | Priority | Effort | Deps  | Files                                     | Acceptance Criteria                                |
| ------- | ------------------------------------------------------------ | -------- | ------ | ----- | ----------------------------------------- | -------------------------------------------------- |
| T-025   | Replace package_days dropdown with date picker for exam_date | P0       | M      | T-007 | `onboarding/page.tsx`                     | Calendar component; auto-calculates days_remaining |
| T-026   | Add daily time budget input (minutes)                        | P0       | S      | —     | `onboarding/page.tsx`, profiles migration | Numeric input with presets (30, 60, 90, 120 min)   |
| T-027   | Add target university searchable dropdown                    | P1       | M      | T-010 | `onboarding/page.tsx`                     | Search campus_scores; store in profile             |
| T-028   | Add target major input                                       | P1       | S      | T-027 | `onboarding/page.tsx`                     | Optional text field                                |
| T-029   | Pre-fill exam date from admin default                        | P1       | S      | T-025 | `onboarding/page.tsx`                     | Read default from exam metadata                    |

---

## Epic 5: QuestionRunner Enhancement (P0)

### Story 5.1 — Missing Question Types

| Task ID | Title                              | Priority | Effort | Deps | Files                                     | Acceptance Criteria                                                 |
| ------- | ---------------------------------- | -------- | ------ | ---- | ----------------------------------------- | ------------------------------------------------------------------- |
| T-030   | Implement MCQ4 question type       | P0       | M      | —    | `AnswerOptions.tsx`, `QuestionRunner.tsx` | 4-option layout renders correctly; scoring works                    |
| T-031   | Implement True/False question type | P0       | M      | —    | `AnswerOptions.tsx`, `QuestionRunner.tsx` | Binary toggle/button; scoring works                                 |
| T-032   | Complete Fill-in question type     | P0       | M      | —    | `FillInInput.tsx`, `QuestionRunner.tsx`   | Text input with validation; keyboard handling; answer normalization |

### Story 5.2 — UX Features

| Task ID | Title                                         | Priority | Effort | Deps | Files                                     | Acceptance Criteria                                       |
| ------- | --------------------------------------------- | -------- | ------ | ---- | ----------------------------------------- | --------------------------------------------------------- |
| T-033   | Add per-question timer                        | P1       | M      | —    | `QuestionRunner.tsx`                      | Countdown display; auto-submit on expiry                  |
| T-034   | Add prev/next/review-later navigation         | P1       | M      | —    | `QuestionRunner.tsx`                      | Users can navigate back; "review later" flag on questions |
| T-035   | Add answer persistence (resume on disconnect) | P1       | M      | —    | `QuestionRunner.tsx`                      | localStorage or server-side; restore on reconnect         |
| T-036   | Add KaTeX math rendering                      | P1       | M      | —    | `QuestionDisplay.tsx`, `MaterialCard.tsx` | Inline + block math renders correctly                     |

---

## Epic 6: Material Card System (P0)

> Entire new feature — content + admin + student UI.

### Story 6.1 — Admin Material Card Management

| Task ID | Title                                                     | Priority | Effort | Deps  | Files                               | Acceptance Criteria                                          |
| ------- | --------------------------------------------------------- | -------- | ------ | ----- | ----------------------------------- | ------------------------------------------------------------ |
| T-037   | Create `/admin/materials` page (CRUD)                     | P0       | L      | T-009 | `app/admin/materials/page.tsx`      | List, search, filter, create, edit, delete Material Cards    |
| T-038   | Add AI batch generation for Material Cards                | P0       | L      | T-037 | Edge Function, admin materials page | Generate cards per micro-skill; review before publish        |
| T-039   | Add publish workflow (draft → review → published)         | P0       | M      | T-037 | Admin materials page                | Status transitions; only published cards visible to students |
| T-040   | Add coverage dashboard (which skills have Material Cards) | P1       | M      | T-037 | Admin materials page                | Visual grid showing card coverage vs taxonomy                |

### Story 6.2 — Student Review Page

| Task ID | Title                                                            | Priority | Effort | Deps         | Files                                     | Acceptance Criteria                                           |
| ------- | ---------------------------------------------------------------- | -------- | ------ | ------------ | ----------------------------------------- | ------------------------------------------------------------- |
| T-041   | Build `/review` page with topic tree (L4 expandable → L5 skills) | P0       | L      | T-009, T-023 | `app/(student)/review/page.tsx`           | Subtopic list; expand to see micro-skills with coverage ✅/❌ |
| T-042   | Show coverage status per micro-skill (X/20 points)               | P0       | M      | T-003, T-041 | Review page                               | Point count + covered/uncovered icon                          |
| T-043   | Build `/review/[skillId]` Material Card detail page              | P0       | M      | T-009, T-041 | `app/(student)/review/[skillId]/page.tsx` | Core Idea, Key Facts, Common Mistakes, Examples sections      |
| T-044   | Add subtopic progress indicator (X/Y skills covered)             | P1       | S      | T-041        | Review page                               | Progress bar per subtopic header                              |

---

## Epic 7: Drill Page (P1)

### Story 7.1 — Module Listing & Filters

| Task ID | Title                                                   | Priority | Effort | Deps         | Files                          | Acceptance Criteria                                          |
| ------- | ------------------------------------------------------- | -------- | ------ | ------------ | ------------------------------ | ------------------------------------------------------------ |
| T-045   | Rebuild `/drill` page with full module listing          | P1       | M      | T-022        | `app/(student)/drill/page.tsx` | All available modules with title, topic, count, time, status |
| T-046   | Add required task pinning (plan tasks at top)           | P1       | M      | T-045        | Drill page                     | Required tasks visually distinguished and pinned             |
| T-047   | Add filter tabs: All / Required / Completed             | P1       | M      | T-045        | Drill page                     | Tab switching filters the list                               |
| T-048   | Add post-module fail flow: Material Card review + retry | P1       | M      | T-020, T-043 | QuestionRunner                 | On fail → show weak Material Cards → retry button            |

---

## Epic 8: Campus Scores (P1)

### Story 8.1 — Admin Campus Management

| Task ID | Title                                             | Priority | Effort | Deps  | Files                       | Acceptance Criteria                              |
| ------- | ------------------------------------------------- | -------- | ------ | ----- | --------------------------- | ------------------------------------------------ |
| T-049   | Create `/admin/campus` page (CRUD)                | P1       | L      | T-010 | `app/admin/campus/page.tsx` | List, search, create, edit, delete campus scores |
| T-050   | Add AI-assisted campus research                   | P1       | L      | T-049 | Edge Function, admin page   | AI suggests scores; human confirms before save   |
| T-051   | Add verification workflow (unverified → verified) | P1       | M      | T-049 | Admin campus page           | Only verified scores shown to students           |

### Story 8.2 — Student Campus Comparison

| Task ID | Title                                       | Priority | Effort | Deps         | Files                          | Acceptance Criteria                             |
| ------- | ------------------------------------------- | -------- | ------ | ------------ | ------------------------------ | ----------------------------------------------- |
| T-052   | Integrate campus target into Readiness Ring | P1       | M      | T-010, T-027 | `ReadinessRing.tsx`, analytics | Ring shows user score vs campus target          |
| T-053   | Add campus comparison section to analytics  | P1       | M      | T-052        | Analytics page                 | Visual comparison of readiness vs target campus |

---

## Epic 9: Analytics Enhancement (P1)

### Story 9.1 — Wire Up & Extend

| Task ID | Title                                                | Priority | Effort | Deps         | Files                                | Acceptance Criteria                                |
| ------- | ---------------------------------------------------- | -------- | ------ | ------------ | ------------------------------------ | -------------------------------------------------- |
| T-054   | Wire `readiness-score.ts` formula to analytics page  | P1       | M      | T-003        | `readiness-score.ts`, analytics page | Formula uses point-based coverage data             |
| T-055   | Update `CoverageMap.tsx` to use point-based coverage | P1       | M      | T-003        | `CoverageMap.tsx`                    | Shows covered/uncovered based on total_points ≥ 20 |
| T-056   | Add historical progress chart                        | P1       | L      | —            | Analytics page                       | Time-series chart of readiness score over time     |
| T-057   | Add Material Card links to `WeakSkillsList.tsx`      | P1       | S      | T-009, T-043 | `WeakSkillsList.tsx`                 | Each weak skill links to its Material Card         |
| T-058   | Verify delta analytics works with snapshots          | P1       | M      | —            | `DeltaAnalyticsCard.tsx`             | Before/after comparison renders correctly          |

---

## Epic 10: Plan Page Enhancement (P1)

### Story 10.1 — Timeline & Countdown

| Task ID | Title                                              | Priority | Effort | Deps  | Files                                   | Acceptance Criteria                                   |
| ------- | -------------------------------------------------- | -------- | ------ | ----- | --------------------------------------- | ----------------------------------------------------- |
| T-059   | Add exam countdown display                         | P1       | S      | T-007 | `plan/page.tsx`                         | "X days until exam" shown prominently                 |
| T-060   | Decompose `plan/page.tsx` (726 lines → components) | P1       | L      | —     | `plan/page.tsx` → multiple components   | No single file > 300 lines; N+1 queries eliminated    |
| T-061   | Verify plan generation targets uncovered skills    | P1       | M      | T-003 | `generate-plan/route.ts`, Edge Function | Generated tasks target skills with total_points < 20  |
| T-062   | Add "Generate Next Plan" button in recycle flow    | P1       | M      | —     | Recycle page                            | After recycle completion, button generates next cycle |

---

## Epic 11: Design System Convergence (P1)

### Story 11.1 — Token Integration

| Task ID | Title                                                               | Priority | Effort | Deps  | Files                                    | Acceptance Criteria                                |
| ------- | ------------------------------------------------------------------- | -------- | ------ | ----- | ---------------------------------------- | -------------------------------------------------- |
| T-063   | Connect `design-tokens.ts` to `tailwind.config.ts`                  | P1       | M      | —     | `design-tokens.ts`, `tailwind.config.ts` | Tailwind classes use SoT design tokens             |
| T-064   | Audit & fix touch target sizes (44px min)                           | P1       | M      | T-063 | All interactive components               | No interactive element < 44×44px on mobile         |
| T-065   | Apply surface color context rules (yellow=baseline, sky=plan, etc.) | P1       | M      | T-063 | All page components                      | Each section uses correct context color            |
| T-066   | Add skeleton loading to all pages                                   | P1       | M      | —     | All page components                      | No blank screens; shimmer placeholders during load |
| T-067   | Add empty state components (illustration + title + CTA)             | P1       | M      | —     | All list pages                           | Consistent empty states across app                 |

### Story 11.2 — Animations

| Task ID | Title                                            | Priority | Effort | Deps  | Files                  | Acceptance Criteria                  |
| ------- | ------------------------------------------------ | -------- | ------ | ----- | ---------------------- | ------------------------------------ |
| T-068   | Add confetti animation on module pass            | P1       | M      | T-021 | QuestionRunner results | 50 particles, triggers on pass score |
| T-069   | Add points fly-up animation on correct answer    | P1       | M      | T-014 | QuestionRunner         | "+X pts" flies up & fades (600ms)    |
| T-070   | Add progress bar fill animation (800ms ease-out) | P2       | S      | —     | Progress components    | Smooth fill animation with delay     |

---

## Epic 12: Security & Auth (P0)

### Story 12.1 — Admin Auth Guard

| Task ID | Title                                        | Priority | Effort | Deps | Files                      | Acceptance Criteria                                    |
| ------- | -------------------------------------------- | -------- | ------ | ---- | -------------------------- | ------------------------------------------------------ |
| T-071   | Add admin role check to all admin API routes | P0       | M      | —    | All `api/admin/*/route.ts` | 403 if user not admin; check Supabase user metadata    |
| T-072   | Add admin role check to middleware           | P0       | M      | —    | `middleware.ts`            | `/admin/*` routes require admin role                   |
| T-073   | Extend middleware to guard all 6 phases      | P0       | M      | —    | `middleware.ts`            | Phase transitions enforced; redirect on invalid access |

---

## Epic 13: Data Fetching Modernization (P1)

### Story 13.1 — TanStack React Query

| Task ID | Title                                  | Priority | Effort | Deps         | Files                         | Acceptance Criteria                                   |
| ------- | -------------------------------------- | -------- | ------ | ------------ | ----------------------------- | ----------------------------------------------------- |
| T-074   | Set up QueryClient provider            | P1       | S      | —            | `app/layout.tsx` or providers | QueryClientProvider wraps app                         |
| T-075   | Migrate `plan/page.tsx` to React Query | P1       | L      | T-060, T-074 | Plan page                     | useQuery hooks; caching; no manual useEffect fetching |
| T-076   | Migrate analytics page to React Query  | P1       | M      | T-074        | Analytics page                | Cached queries; stale-while-revalidate                |
| T-077   | Migrate baseline pages to React Query  | P1       | M      | T-074        | Baseline pages                | Consistent data fetching pattern                      |

---

## Epic 14: i18n Completeness (P2)

| Task ID | Title                                               | Priority | Effort | Deps  | Files                    | Acceptance Criteria              |
| ------- | --------------------------------------------------- | -------- | ------ | ----- | ------------------------ | -------------------------------- |
| T-078   | Audit all hardcoded strings and extract to i18n     | P2       | L      | —     | All components with text | No hardcoded user-facing strings |
| T-079   | Complete Indonesian translations for all namespaces | P2       | M      | T-078 | `lib/i18n/locales/id/`   | All keys have ID translations    |

---

## Epic 15: Testing & CI (P2)

### Story 15.1 — Test Infrastructure

| Task ID | Title                                              | Priority | Effort | Deps  | Files                              | Acceptance Criteria                        |
| ------- | -------------------------------------------------- | -------- | ------ | ----- | ---------------------------------- | ------------------------------------------ |
| T-080   | Set up Vitest + Testing Library                    | P2       | M      | —     | `vitest.config.ts`, `package.json` | Test runner configured; sample test passes |
| T-081   | Write tests for point calculation (submit-attempt) | P0       | M      | T-018 | `tests/`                           | All scoring scenarios covered              |
| T-082   | Write tests for readiness score formula            | P1       | M      | —     | `tests/`                           | Formula edge cases tested                  |
| T-083   | Write tests for phase transitions                  | P1       | M      | —     | `tests/`                           | All valid/invalid transitions tested       |

### Story 15.2 — CI/CD

| Task ID | Title                             | Priority | Effort | Deps  | Files                          | Acceptance Criteria            |
| ------- | --------------------------------- | -------- | ------ | ----- | ------------------------------ | ------------------------------ |
| T-084   | Set up GitHub Actions CI pipeline | P2       | M      | T-080 | `.github/workflows/ci.yml`     | Lint + type-check + test on PR |
| T-085   | Set up staging deployment         | P2       | L      | T-084 | GitHub Actions, Vercel/hosting | Preview deploys on PRs         |

---

## Backlog Summary

| Epic                            | Priority | Tasks  | Total Effort |
| ------------------------------- | -------- | ------ | ------------ |
| 1. Stabilize Supabase Schema    | P0       | 13     | ~M-L         |
| 2. Core Adaptive Loop           | P0       | 8      | ~L-XL        |
| 3. Navigation & Route Alignment | P0       | 3      | ~M           |
| 4. Onboarding Overhaul          | P0/P1    | 5      | ~M           |
| 5. QuestionRunner Enhancement   | P0/P1    | 7      | ~L           |
| 6. Material Card System         | P0       | 8      | ~XL          |
| 7. Drill Page                   | P1       | 4      | ~L           |
| 8. Campus Scores                | P1       | 5      | ~XL          |
| 9. Analytics Enhancement        | P1       | 5      | ~L           |
| 10. Plan Page Enhancement       | P1       | 4      | ~L           |
| 11. Design System Convergence   | P1/P2    | 8      | ~L           |
| 12. Security & Auth             | P0       | 3      | ~M           |
| 13. Data Fetching Modernization | P1       | 4      | ~L           |
| 14. i18n Completeness           | P2       | 2      | ~L           |
| 15. Testing & CI                | P0-P2    | 6      | ~L           |
| **TOTAL**                       |          | **85** |              |

### Priority Distribution

| Priority | Task Count |
| -------- | ---------- |
| P0       | 38         |
| P1       | 35         |
| P2       | 12         |
