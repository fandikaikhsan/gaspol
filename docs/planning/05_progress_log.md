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

---

## Open Blockers

*(none yet)*

---

## Notes / Decisions

- Branch: `exec/milestone-a`
- Starting with schema migrations (T-001 through T-010) before route/nav changes
- Existing `questions` table already has `cognitive_level` column with L1/L2/L3 values
- Existing `questions` table has `difficulty` column with easy/medium/hard values
- Existing `modules` table already has `passing_threshold DECIMAL(3,2)` column
- Need to verify if `passing_threshold` is actually used (backlog says "not present" but schema has it)

---

## Commands Run

```
git add -A && git commit -m "chore: add planning docs, blueprint v2, design v2, and migration 029"
git checkout -b exec/milestone-a
```
