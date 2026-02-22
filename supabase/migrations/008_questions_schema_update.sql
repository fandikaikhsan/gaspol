-- Update questions table to support new question management interface
-- Adds new fields while keeping old ones for backwards compatibility

-- Add new fields
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS question_text TEXT,
ADD COLUMN IF NOT EXISTS question_type TEXT,
ADD COLUMN IF NOT EXISTS time_estimate_seconds INTEGER DEFAULT 120,
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Make old required fields optional for new workflow
ALTER TABLE questions
ALTER COLUMN micro_skill_id DROP NOT NULL,
ALTER COLUMN question_format DROP NOT NULL,
ALTER COLUMN stem DROP NOT NULL,
ALTER COLUMN correct_answer DROP NOT NULL,
ALTER COLUMN construct_weights DROP NOT NULL;

-- Add check constraint for question_type
ALTER TABLE questions
DROP CONSTRAINT IF EXISTS questions_question_type_check;

ALTER TABLE questions
ADD CONSTRAINT questions_question_type_check
CHECK (question_type IN ('MCQ5', 'MCQ4', 'MCK', 'TF') OR question_type IS NULL);

-- Ensure at least one of the text fields is present
ALTER TABLE questions
DROP CONSTRAINT IF EXISTS questions_text_check;

ALTER TABLE questions
ADD CONSTRAINT questions_text_check
CHECK (
  (question_text IS NOT NULL AND question_text != '') OR
  (stem IS NOT NULL AND stem != '')
);

-- Create index on new fields
CREATE INDEX IF NOT EXISTS idx_questions_question_type ON questions(question_type);
CREATE INDEX IF NOT EXISTS idx_questions_is_active ON questions(is_active);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_cognitive_level ON questions(cognitive_level);

COMMENT ON COLUMN questions.question_text IS 'Question text (new interface)';
COMMENT ON COLUMN questions.stem IS 'Question text (legacy field)';
COMMENT ON COLUMN questions.question_type IS 'Question type (new interface)';
COMMENT ON COLUMN questions.question_format IS 'Question format (legacy field)';
