-- Update modules schema for composer interface

-- Add is_published field (easier than status enum)
ALTER TABLE modules
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);

-- Make question_count computed/optional (will be calculated from module_questions)
ALTER TABLE modules
ALTER COLUMN question_count DROP NOT NULL,
ALTER COLUMN question_count SET DEFAULT 0;

-- Create module_questions junction table for proper normalization
CREATE TABLE IF NOT EXISTS module_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,

  -- Order in module
  order_index INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(module_id, question_id),
  UNIQUE(module_id, order_index)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_module_questions_module ON module_questions(module_id, order_index);
CREATE INDEX IF NOT EXISTS idx_module_questions_question ON module_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_modules_published ON modules(is_published);
CREATE INDEX IF NOT EXISTS idx_modules_type ON modules(module_type);

-- Function to auto-update question_count
CREATE OR REPLACE FUNCTION update_module_question_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE modules
  SET question_count = (
    SELECT COUNT(*)
    FROM module_questions
    WHERE module_id = COALESCE(NEW.module_id, OLD.module_id)
  )
  WHERE id = COALESCE(NEW.module_id, OLD.module_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update question_count
DROP TRIGGER IF EXISTS module_question_count_trigger ON module_questions;

CREATE TRIGGER module_question_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON module_questions
FOR EACH ROW
EXECUTE FUNCTION update_module_question_count();

-- RLS policies
ALTER TABLE module_questions ENABLE ROW LEVEL SECURITY;

-- Admins can manage all module questions
CREATE POLICY module_questions_admin_all ON module_questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Students can view published module questions
CREATE POLICY module_questions_student_view ON module_questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = module_questions.module_id
      AND modules.is_published = true
    )
  );

COMMENT ON TABLE module_questions IS 'Junction table linking questions to modules with ordering';
COMMENT ON COLUMN modules.is_published IS 'Whether module is visible to students (replaces status for simplicity)';
