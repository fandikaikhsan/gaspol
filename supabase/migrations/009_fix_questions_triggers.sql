-- Fix questions table triggers and add missing fields

-- Add updated_by field if it doesn't exist
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id);

-- Add updated_at if it doesn't exist
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update the updated_at trigger if it exists
DROP TRIGGER IF EXISTS update_questions_updated_at ON questions;

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Make created_by nullable for AI-generated questions
ALTER TABLE questions
ALTER COLUMN created_by DROP NOT NULL;

-- Add default status
ALTER TABLE questions
ALTER COLUMN status SET DEFAULT 'draft';

COMMENT ON COLUMN questions.created_by IS 'User who created the question (NULL for AI-generated)';
COMMENT ON COLUMN questions.updated_by IS 'User who last updated the question';
