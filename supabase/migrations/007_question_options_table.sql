-- Add question_options table for normalized option storage
-- This provides better query capability and relationships than JSONB

CREATE TABLE question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,

  -- Option content
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique positions per question
  UNIQUE(question_id, position)
);

-- Indexes for performance
CREATE INDEX idx_question_options_question ON question_options(question_id);
CREATE INDEX idx_question_options_correct ON question_options(question_id, is_correct);

-- Updated at trigger
CREATE TRIGGER update_question_options_updated_at
  BEFORE UPDATE ON question_options
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Note: The questions table still has the 'options' JSONB field for backwards compatibility
-- New questions should use question_options table
-- Migration of existing JSONB options can be done separately if needed
