-- Fix AI Runs Schema
-- Align column names with what edge functions are using
-- Add new operation types

-- First, drop ALL existing constraints on job_type and status
ALTER TABLE ai_runs DROP CONSTRAINT IF EXISTS ai_runs_operation_type_check;
ALTER TABLE ai_runs DROP CONSTRAINT IF EXISTS ai_runs_job_type_check;
ALTER TABLE ai_runs DROP CONSTRAINT IF EXISTS ai_runs_status_check;

-- Rename columns to match edge function usage (if they exist with old names)
DO $$
BEGIN
  -- Check if operation_type exists and job_type doesn't
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_runs' AND column_name = 'operation_type')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_runs' AND column_name = 'job_type') THEN
    ALTER TABLE ai_runs RENAME COLUMN operation_type TO job_type;
  END IF;

  -- Check if input_context exists and input_params doesn't
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_runs' AND column_name = 'input_context')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_runs' AND column_name = 'input_params') THEN
    ALTER TABLE ai_runs RENAME COLUMN input_context TO input_params;
  END IF;

  -- Check if output_data exists and output_result doesn't
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_runs' AND column_name = 'output_data')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_runs' AND column_name = 'output_result') THEN
    ALTER TABLE ai_runs RENAME COLUMN output_data TO output_result;
  END IF;

  -- Check if started_at exists and created_at doesn't
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_runs' AND column_name = 'started_at')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_runs' AND column_name = 'created_at') THEN
    ALTER TABLE ai_runs RENAME COLUMN started_at TO created_at;
  END IF;
END $$;

-- Add missing columns if they don't exist
ALTER TABLE ai_runs ADD COLUMN IF NOT EXISTS job_type TEXT;
ALTER TABLE ai_runs ADD COLUMN IF NOT EXISTS prompt_version TEXT;
ALTER TABLE ai_runs ADD COLUMN IF NOT EXISTS input_params JSONB;
ALTER TABLE ai_runs ADD COLUMN IF NOT EXISTS output_result JSONB;
ALTER TABLE ai_runs ADD COLUMN IF NOT EXISTS tokens_used INTEGER;
ALTER TABLE ai_runs ADD COLUMN IF NOT EXISTS duration_ms INTEGER;
ALTER TABLE ai_runs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Add new constraint with all operation types
ALTER TABLE ai_runs ADD CONSTRAINT ai_runs_job_type_check
  CHECK (job_type IN (
    'item_generation',
    'flashcard_generation',
    'exam_research',
    'auto_tag',
    'qc',
    'session_summary',
    'taxonomy_generation',
    'metadata_suggestion'
  ));

-- Add status constraint
ALTER TABLE ai_runs ADD CONSTRAINT ai_runs_status_check
  CHECK (status IN ('pending', 'success', 'error'));

-- Update index to use new column name
DROP INDEX IF EXISTS idx_ai_runs_recent;
CREATE INDEX IF NOT EXISTS idx_ai_runs_recent ON ai_runs(created_at DESC);

-- Make job_type NOT NULL with a default for existing rows
UPDATE ai_runs SET job_type = 'item_generation' WHERE job_type IS NULL;
ALTER TABLE ai_runs ALTER COLUMN job_type SET NOT NULL;
