-- Migration 038: Extend campus_scores for TRYOUT and JSON import
-- Adds university_id, program_id, program_type, interest, capacity, acceptance_rate,
-- error flags, and confidence level for TRYOUT feature

-- Add new columns
ALTER TABLE campus_scores
  ADD COLUMN IF NOT EXISTS university_id INTEGER,
  ADD COLUMN IF NOT EXISTS program_id INTEGER,
  ADD COLUMN IF NOT EXISTS program_type TEXT,
  ADD COLUMN IF NOT EXISTS interest INTEGER,
  ADD COLUMN IF NOT EXISTS capacity INTEGER,
  ADD COLUMN IF NOT EXISTS acceptance_rate DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS interest_capacity_error SMALLINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS interest_negative_error SMALLINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS confidence_level SMALLINT,
  ADD COLUMN IF NOT EXISTS confidence_level_label TEXT;

-- Extend min_score precision for JSON (e.g. 406.713)
ALTER TABLE campus_scores
  ALTER COLUMN min_score TYPE DECIMAL(8,3) USING min_score::DECIMAL(8,3);

-- Partial unique index for upsert on re-import (program_id + year)
CREATE UNIQUE INDEX IF NOT EXISTS idx_campus_scores_program_year
  ON campus_scores(program_id, year)
  WHERE program_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_campus_scores_program_id ON campus_scores(program_id);
CREATE INDEX IF NOT EXISTS idx_campus_scores_university_id ON campus_scores(university_id);

COMMENT ON COLUMN campus_scores.program_id IS 'External program ID from import JSON; used for upsert';
COMMENT ON COLUMN campus_scores.confidence_level_label IS 'low, medium, high, superhigh';
COMMENT ON COLUMN campus_scores.interest_capacity_error IS '1 = overcapacity';
COMMENT ON COLUMN campus_scores.interest_negative_error IS '1 = interest invalid';
