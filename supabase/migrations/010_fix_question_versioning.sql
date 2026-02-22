-- Fix question versioning to support both old and new field names

-- Update question_versions table to support new fields
ALTER TABLE question_versions
ALTER COLUMN stem DROP NOT NULL,
ALTER COLUMN correct_answer DROP NOT NULL,
ADD COLUMN IF NOT EXISTS question_text TEXT,
ADD COLUMN IF NOT EXISTS question_type TEXT;

-- Update the versioning trigger to handle both old and new field names
CREATE OR REPLACE FUNCTION create_question_version()
RETURNS TRIGGER AS $$
DECLARE
  v_stem TEXT;
  v_correct_answer TEXT;
BEGIN
  -- Use new field names if available, fall back to old ones
  v_stem := COALESCE(NEW.question_text, NEW.stem);
  v_correct_answer := COALESCE(NEW.correct_answer, 'N/A');

  -- Only create versions for published questions or on insert
  IF NEW.status = 'published' OR TG_OP = 'INSERT' THEN
    -- Mark all previous versions as not current
    UPDATE question_versions
    SET is_current = false
    WHERE question_id = NEW.id;

    -- Create new version (only if we have content)
    IF v_stem IS NOT NULL AND v_stem != '' THEN
      INSERT INTO question_versions (
        question_id, version, is_current,
        stem, question_text, question_type,
        stem_images, options, correct_answer,
        explanation, explanation_images,
        construct_weights, difficulty, cognitive_level,
        content_hash, created_by
      )
      VALUES (
        NEW.id,
        COALESCE((SELECT MAX(version) FROM question_versions WHERE question_id = NEW.id), 0) + 1,
        true,
        NEW.stem,
        NEW.question_text,
        NEW.question_type,
        COALESCE(NEW.stem_images, '[]'::jsonb),
        COALESCE(NEW.options, '{}'::jsonb),
        v_correct_answer,
        NEW.explanation,
        COALESCE(NEW.explanation_images, '[]'::jsonb),
        COALESCE(NEW.construct_weights, '{}'::jsonb),
        NEW.difficulty,
        NEW.cognitive_level,
        md5(COALESCE(v_stem, '') || COALESCE(NEW.options::text, '') || COALESCE(v_correct_answer, '')),
        NEW.created_by
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS question_version_trigger ON questions;

CREATE TRIGGER question_version_trigger
AFTER INSERT OR UPDATE ON questions
FOR EACH ROW
EXECUTE FUNCTION create_question_version();

COMMENT ON FUNCTION create_question_version() IS 'Creates version snapshots for questions, supports both old (stem) and new (question_text) field names';
