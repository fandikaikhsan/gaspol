# 05 — Progress Log

> Execution tracking for Milestone A: Stabilize & Align Foundations

---

## Milestone in Progress

**Milestone A: Stabilize & Align Foundations (Week 1–2)**

Goal: Get the data model, auth, and routes correct before building features.

---

## Completed Tasks

### T-001: Add difficulty_level (L1/L2/L3) to questions
- **AC**: Column exists; backfill from existing difficulty mapping (easy→L1, medium→L2, hard→L3)
- **Files**: `supabase/migrations/030_point_based_coverage_schema.sql`
- **Notes**: Questions table already had `cognitive_level` (L1/L2/L3) and `difficulty` (easy/medium/hard). Added new `difficulty_level` column and backfilled from `difficulty` with fallback to `cognitive_level`.

### T-002: Add point_value generated column to questions
- **AC**: Auto-calculated from difficulty_level (L1→1, L2→2, L3→5)
- **Files**: `supabase/migrations/030_point_based_coverage_schema.sql`
- **Notes**: Used GENERATED ALWAYS AS ... STORED for automatic calculation.

### T-003: Add total_points, l1_correct, l2_correct, l3_correct to user_skill_state
- **AC**: Columns exist with defaults; backfill script available
- **Files**: `supabase/migrations/030_point_based_coverage_schema.sql`

### T-004: Add is_covered generated column to user_skill_state
- **AC**: is_covered = (total_points >= 20) computed automatically
- **Files**: `supabase/migrations/030_point_based_coverage_schema.sql`

### T-005: Add points_awarded to attempts table
- **AC**: Column nullable, populated on submit
- **Files**: `supabase/migrations/030_point_based_coverage_schema.sql`

### T-006: Ensure pass_threshold default on modules
- **AC**: Column exists (passing_threshold), default set to 0.70, existing NULLs backfilled
- **Files**: `supabase/migrations/030_point_based_coverage_schema.sql`
- **Notes**: Column already existed as `passing_threshold DECIMAL(3,2)`. Set default and backfilled NULLs.

### T-007: Add exam_date to profiles
- **AC**: DATE column, nullable; package_days kept for backward compat
- **Files**: `supabase/migrations/030_point_based_coverage_schema.sql`

### T-009: Create material_cards table
- **AC**: Schema with id, skill_id FK, title, core_idea, key_facts, common_mistakes, examples, status, timestamps
- **Files**: `supabase/migrations/031_material_cards_campus_scores.sql`

### T-010: Create campus_scores table
- **AC**: Schema with id, university_name, major, min_score, year, source_url, verified, created_at
- **Files**: `supabase/migrations/031_material_cards_campus_scores.sql`

### T-008: Backfill script for existing user_skill_state data
- **AC**: Existing mastery levels approximated to points; no data loss
- **Files**: `scripts/backfill-points.ts`

### T-011: Update database.types.ts
- **AC**: All new columns/tables typed (questions, attempts, user_skill_state, material_cards, campus_scores, profiles)
- **Files**: `lib/supabase/database.types.ts`
- **Notes**: Manual update since Supabase CLI may not be configured. Added DifficultyLevel, MaterialCardStatus, UserPhase type aliases.

### T-012: RLS policies for new tables
- **AC**: Students read-only on published material_cards; admin full access; campus_scores public read (verified only)
- **Files**: `supabase/migrations/032_rls_material_cards_campus_scores.sql`

### T-022: Rename /locked-in → /drill
- **AC**: Route active at /drill; all imports/refs updated; i18n namespace changed to 'drill'
- **Files**: `app/(student)/drill/` (moved from `locked-in/`), `lib/i18n/locales/{en,id}/drill.json`

### T-023: Rename /taktis → /review
- **AC**: Route active at /review; all imports/refs updated; i18n namespace changed to 'review'
- **Files**: `app/(student)/review/` (moved from `taktis/`), `components/review/FlashcardStack.tsx`, `lib/i18n/locales/{en,id}/review.json`

### T-024: Update nav labels and icons
- **AC**: BottomNav, SideNav, TopNav show correct 4 tabs (Plan, Drill, Review, Analytics) with updated icons
- **Files**: `components/navigation/BottomNav.tsx`, `SideNav.tsx`, `TopNav.tsx`

### T-071: Admin role check on API routes
- **AC**: All 6 admin API routes return 403 if user is not admin
- **Files**: `lib/supabase/require-admin.ts`, `app/api/admin/*/route.ts` (6 files)

### T-072: Admin middleware guard for API routes
- **AC**: Middleware guards `/api/admin/*` in addition to `/admin` page routes
- **Files**: `middleware.ts`

### T-073: Middleware phase guards for all 6 phases
- **AC**: Each phase maps to allowed routes; unauthorized access redirects to phase default route
- **Files**: `middleware.ts`
- **Notes**: Phase→route map: ONBOARDING→/onboarding, BASELINE_IN_PROGRESS→/baseline, BASELINE_COMPLETE→/analytics, PLAN_ACTIVE→/plan, RECYCLE_UNLOCKED→/plan, RECYCLE_IN_PROGRESS→/recycle

---

## Milestone A — COMPLETE

All 18 tasks completed. Exit criteria verified:
- [x] All new columns/tables exist in Supabase with RLS
- [x] `database.types.ts` reflects full schema
- [x] Existing data backfill script available
- [x] Routes renamed: `/drill` and `/review` active
- [x] Bottom/side nav shows correct 4 tabs (Plan, Drill, Review, Analytics)
- [x] Admin routes require authenticated admin role (middleware + API handler)
- [x] Middleware enforces all 6 user phases
- [x] App builds without errors (`next build` passes)

---

## Milestone B — Close P0 Feature Gaps (Week 3–6)

### Phase B.1: Scoring + Pass/Fail (8 tasks)

### T-014: Calculate points_awarded on submit-attempt
- **AC**: `points_awarded = isCorrect ? point_value : 0` saved to attempt row
- **Files**: `app/api/submit-attempt/route.ts`
- **Commit**: `14110af`

### T-015: Upsert user_skill_state on submit-attempt
- **AC**: total_points, l1/l2/l3_correct incremented per correct attempt
- **Files**: `app/api/submit-attempt/route.ts`
- **Commit**: `14110af`

### T-016: Recalculate user_construct_state EMA
- **AC**: EMA with dynamic learning rate; trend derived from delta
- **Files**: `app/api/submit-attempt/route.ts`
- **Commit**: `14110af`

### T-017: Derive attempt_error_tags
- **AC**: Time-based (SLOW/RUSHED), performance-based (CARELESS/STRUGGLE), construct-based tags
- **Files**: `app/api/submit-attempt/route.ts`
- **Commit**: `14110af`

### T-019: Module pass/fail with 70% threshold
- **AC**: Fetches module.passing_threshold (default 0.70); computes pass/fail
- **Files**: `app/api/finalize-baseline-module/route.ts`
- **Commit**: `0c9407d`

### T-020: Fetch weak Material Cards on fail
- **AC**: On fail, fetches published material_cards linked to weak skills
- **Files**: `app/api/finalize-baseline-module/route.ts`
- **Commit**: `0c9407d`

### T-021: QuestionRunner pass/fail results screen
- **AC**: ModuleResult interface; pass/fail UI with score card, weak material cards, retry/continue buttons
- **Files**: `components/assessment/QuestionRunner.tsx`
- **Commit**: `10e8fb2`

### T-018: Unit tests for point calculation + scoring
- **AC**: 59 tests across 11 describe blocks covering all scoring functions
- **Files**: `tests/submit-attempt.test.ts`, `lib/assessment/scoring.ts`, `vitest.config.ts`
- **Commit**: `85b8dca`

### Phase B.2: Admin Materials + Student Review (6 tasks)

### T-037: Admin materials CRUD page
- **AC**: Full CRUD for material_cards with Dialog forms, search/filter, stats cards
- **Files**: `app/admin/materials/page.tsx`, `app/admin/layout.tsx`
- **Commit**: `9ef9312`
- **Notes**: Fixed database.types.ts — removed `[key: string]` index signature, added `Relationships: []` to all 8 tables for supabase-js v2.97 compatibility.

### T-039: Publish workflow (draft → review → published)
- **AC**: Status badges, transition buttons, status filter
- **Files**: `app/admin/materials/page.tsx`
- **Commit**: `9ef9312`

### T-038: AI batch generation for Material Cards
- **AC**: Edge function with multi-provider AI; API proxy with admin auth; UI dialog with skill selection
- **Files**: `supabase/functions/generate_material_cards/index.ts`, `app/api/admin/generate-material-cards/route.ts`, `app/admin/materials/page.tsx`
- **Commit**: `b558de8`

### T-041: Student /review page with topic tree
- **AC**: L4 subtopics with expand/collapse; lazy-loads L5 skills + coverage on expand
- **Files**: `app/(student)/review/page.tsx`
- **Commit**: `f765e3a`

### T-042: Coverage status per micro-skill (X/20 points)
- **AC**: Point count display per skill; coverage badge per subtopic (X/Y covered)
- **Files**: `app/(student)/review/page.tsx`
- **Commit**: `f765e3a`

### T-043: Material Card detail page (/review/[skillId])
- **AC**: Core Idea, Key Facts, Common Mistakes, Examples sections; coverage badge; back navigation
- **Files**: `app/(student)/review/[skillId]/page.tsx`
- **Commit**: `f765e3a`

### Phase B.3: Question Types + Onboarding (5 tasks)

### T-030: MCQ4 question type
- **AC**: MCQ4 added to QuestionFormat; MCQ4Options (A-D) type; AnswerOptions auto-detects 4 vs 5 options
- **Files**: `lib/assessment/types.ts`, `components/assessment/AnswerOptions.tsx`, `components/assessment/QuestionRunner.tsx`
- **Commit**: `48bd422`

### T-031: True/False question type
- **AC**: TF + TFOptions types; TrueFalseOptions component with card-style binary selector; scoring handles TF
- **Files**: `lib/assessment/types.ts`, `components/assessment/TrueFalseOptions.tsx`, `lib/assessment/scoring.ts`, `components/assessment/QuestionRunner.tsx`
- **Commit**: `48bd422`

### T-032: Fill-in question type completion
- **AC**: FillInInput already robust; added Enter key submit handler; keyboard handling complete
- **Files**: `components/assessment/FillInInput.tsx`
- **Commit**: `48bd422`

### T-025: Onboarding exam date picker
- **AC**: Calendar date input replaces package_days dropdown; auto-computes days_remaining; urgency indicators
- **Files**: `app/(student)/onboarding/page.tsx`
- **Commit**: `c3a8321`

### T-026: Daily time budget input
- **AC**: Preset options (30/60/90/120 min) + custom numeric input (10-480 min); validation
- **Files**: `app/(student)/onboarding/page.tsx`
- **Commit**: `c3a8321`

---

## Milestone B — COMPLETE

All 19 tasks completed. Exit criteria:
- [x] submit-attempt scores points, updates user_skill_state, recalculates constructs, derives error tags
- [x] finalize-baseline-module computes pass/fail with 70% threshold
- [x] QuestionRunner shows pass/fail results with material cards
- [x] 59 unit tests passing for all scoring logic
- [x] Admin materials CRUD + publish workflow + AI generation
- [x] Student /review page with topic tree + coverage + material card detail
- [x] MCQ4, TF, Fill-in question types work end-to-end
- [x] Onboarding collects exam_date via calendar picker
- [x] Onboarding collects time_budget_min with presets + custom input

---

## Open Blockers

*(none yet)*

---

## Notes / Decisions

- Branch Milestone A: `exec/milestone-a`
- Branch Milestone B: `exec/milestone-b`
- Starting with schema migrations (T-001 through T-010) before route/nav changes
- Existing `questions` table already has `cognitive_level` column with L1/L2/L3 values
- Existing `questions` table has `difficulty` column with easy/medium/hard values
- Existing `modules` table already has `passing_threshold DECIMAL(3,2)` column
- Need to verify if `passing_threshold` is actually used (backlog says "not present" but schema has it)
- supabase-js v2.97 requires `Relationships: []` in table type definitions — fixed in T-037
- Removed catch-all `[key: string]` index signature from Database types to fix `never` type resolution
- Untyped tables use `(supabase as any).from('table_name')` pattern — many tables not yet in types file
- 741 lines of pre-existing TypeScript errors across 31 files (not in our new/modified files)

---

## Commands Run

```
git add -A && git commit -m "chore: add planning docs, blueprint v2, design v2, and migration 029"
git checkout -b exec/milestone-a
```
