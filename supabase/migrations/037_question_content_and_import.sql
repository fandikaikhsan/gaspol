-- Migration 037: Question content JSONB and import support
-- Adds content, content_version for structured blocks; extends question_type for MCK-Table, Fill-in

-- Add content columns for structured document storage
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS content JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS content_version INTEGER DEFAULT 1;

COMMENT ON COLUMN questions.content IS 'Structured document: { stimulus, answer, explanation } with blocks (text, inline_math, block_math, table, chart, etc.)';
COMMENT ON COLUMN questions.content_version IS 'Version of content schema for future migrations';

-- Add option_key to question_options for TF/non-A-B-C keys
ALTER TABLE question_options
ADD COLUMN IF NOT EXISTS option_key TEXT;

COMMENT ON COLUMN question_options.option_key IS 'Display key (A, B, True, False, etc.). Null = derive from position (A=0, B=1, ...)';

-- Extend question_type to support MCK-Table and Fill-in
ALTER TABLE questions
DROP CONSTRAINT IF EXISTS questions_question_type_check;

ALTER TABLE questions
ADD CONSTRAINT questions_question_type_check
CHECK (
  question_type IN ('MCQ5', 'MCQ4', 'MCK', 'MCK-Table', 'Fill-in', 'TF') OR
  question_type IS NULL
);
