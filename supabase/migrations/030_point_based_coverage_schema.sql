-- Migration 030: Point-Based Coverage Schema
-- Tasks: T-001, T-002, T-003, T-004, T-005, T-006, T-007
-- Part of Milestone A: Stabilize & Align Foundations
--
-- Adds difficulty_level, point_value, coverage tracking columns,
-- points_awarded to attempts, pass_threshold defaults, and exam_date.

-- ============================================
-- T-001: Add difficulty_level (L1/L2/L3) to questions
-- Maps from existing 'difficulty' column: easy→L1, medium→L2, hard→L3
-- Note: cognitive_level already exists with L1/L2/L3 but has different semantics
--       difficulty_level is specifically for the point-based system
-- ============================================

ALTER TABLE questions
ADD COLUMN IF NOT EXISTS difficulty_level TEXT CHECK (difficulty_level IN ('L1', 'L2', 'L3'));

-- Backfill from existing difficulty column
UPDATE questions SET difficulty_level = CASE
  WHEN difficulty = 'easy' THEN 'L1'
  WHEN difficulty = 'medium' THEN 'L2'
  WHEN difficulty = 'hard' THEN 'L3'
  ELSE cognitive_level  -- fallback to cognitive_level if difficulty is null
END
WHERE difficulty_level IS NULL;

COMMENT ON COLUMN questions.difficulty_level IS 'Point-based difficulty: L1=1pt, L2=2pt, L3=5pt (on correct answer)';

-- ============================================
-- T-002: Add point_value generated column to questions
-- Auto-calculated from difficulty_level: L1→1, L2→2, L3→5
-- ============================================

ALTER TABLE questions
ADD COLUMN IF NOT EXISTS point_value INTEGER GENERATED ALWAYS AS (
  CASE difficulty_level
    WHEN 'L1' THEN 1
    WHEN 'L2' THEN 2
    WHEN 'L3' THEN 5
    ELSE 0
  END
) STORED;

COMMENT ON COLUMN questions.point_value IS 'Auto-calculated points awarded on correct answer (L1=1, L2=2, L3=5)';

-- ============================================
-- T-003: Add total_points, l1_correct, l2_correct, l3_correct to user_skill_state
-- ============================================

ALTER TABLE user_skill_state
ADD COLUMN IF NOT EXISTS total_points INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS l1_correct INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS l2_correct INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS l3_correct INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN user_skill_state.total_points IS 'Accumulated points from correct answers (coverage threshold: 20)';
COMMENT ON COLUMN user_skill_state.l1_correct IS 'Count of correct L1 (easy) answers';
COMMENT ON COLUMN user_skill_state.l2_correct IS 'Count of correct L2 (medium) answers';
COMMENT ON COLUMN user_skill_state.l3_correct IS 'Count of correct L3 (hard) answers';

-- ============================================
-- T-004: Add is_covered generated column to user_skill_state
-- A micro-skill is "covered" when total_points >= 20
-- ============================================

ALTER TABLE user_skill_state
ADD COLUMN IF NOT EXISTS is_covered BOOLEAN GENERATED ALWAYS AS (total_points >= 20) STORED;

COMMENT ON COLUMN user_skill_state.is_covered IS 'Auto-computed: true when total_points >= 20';

-- ============================================
-- T-005: Add points_awarded to attempts table
-- Nullable, populated on submit (correct → point_value, wrong → 0)
-- ============================================

ALTER TABLE attempts
ADD COLUMN IF NOT EXISTS points_awarded INTEGER;

COMMENT ON COLUMN attempts.points_awarded IS 'Points earned from this attempt (0 if incorrect)';

-- ============================================
-- T-006: Ensure pass_threshold has default 0.7 for modules
-- The column already exists (passing_threshold DECIMAL(3,2)) but may lack a default.
-- Backfill existing rows that have NULL to 0.70.
-- ============================================

ALTER TABLE modules
ALTER COLUMN passing_threshold SET DEFAULT 0.70;

UPDATE modules
SET passing_threshold = 0.70
WHERE passing_threshold IS NULL;

-- ============================================
-- T-007: Add exam_date to profiles table
-- DATE column, nullable; keep package_days for backward compat
-- ============================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS exam_date DATE;

COMMENT ON COLUMN profiles.exam_date IS 'User exam date; auto-calculates days remaining';

-- Create index for exam date queries
CREATE INDEX IF NOT EXISTS idx_profiles_exam_date ON profiles(exam_date);
