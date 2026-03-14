-- Migration 039: Add proper unique constraint for campus import upsert
-- PostgREST/Supabase upsert requires a named UNIQUE constraint, not a partial index.
-- Drop the partial index and add a full unique constraint on (program_id, year).
-- Note: PostgreSQL treats NULLs as distinct in unique constraints, so legacy rows
-- with program_id NULL are allowed.

DROP INDEX IF EXISTS idx_campus_scores_program_year;

-- Add named unique constraint for upsert ON CONFLICT
ALTER TABLE campus_scores
  ADD CONSTRAINT campus_scores_program_year_key UNIQUE (program_id, year);
