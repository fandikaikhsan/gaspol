-- Populate Missing Question Metadata
-- Sets reasonable defaults for time estimates and construct weights

-- =====================================================
-- 1. SET TIME ESTIMATES BY DIFFICULTY
-- =====================================================

-- Update time estimates based on difficulty if not set or default
UPDATE questions
SET time_estimate_seconds = CASE
  WHEN difficulty = 'easy' THEN 60
  WHEN difficulty = 'medium' THEN 90
  WHEN difficulty = 'hard' THEN 120
  ELSE 90
END
WHERE time_estimate_seconds IS NULL
   OR time_estimate_seconds = 120; -- Reset defaults

COMMENT ON COLUMN questions.time_estimate_seconds IS 'Expected time: easy=60s, medium=90s, hard=120s';

-- =====================================================
-- 2. SET CONSTRUCT WEIGHTS BY COGNITIVE LEVEL
-- =====================================================

-- L1 (Recall) - Heavy on reading and attention
UPDATE questions
SET construct_weights = '{
  "C.ATTENTION": 0.25,
  "C.SPEED": 0.20,
  "C.REASONING": 0.15,
  "C.COMPUTATION": 0.15,
  "C.READING": 0.25
}'::jsonb
WHERE cognitive_level = 'L1'
AND (construct_weights = '{}'::jsonb OR construct_weights IS NULL);

-- L2 (Application) - Balanced with more computation
UPDATE questions
SET construct_weights = '{
  "C.ATTENTION": 0.20,
  "C.SPEED": 0.20,
  "C.REASONING": 0.20,
  "C.COMPUTATION": 0.25,
  "C.READING": 0.15
}'::jsonb
WHERE cognitive_level = 'L2'
AND (construct_weights = '{}'::jsonb OR construct_weights IS NULL);

-- L3 (Analysis) - Heavy on reasoning
UPDATE questions
SET construct_weights = '{
  "C.ATTENTION": 0.15,
  "C.SPEED": 0.15,
  "C.REASONING": 0.35,
  "C.COMPUTATION": 0.20,
  "C.READING": 0.15
}'::jsonb
WHERE cognitive_level = 'L3'
AND (construct_weights = '{}'::jsonb OR construct_weights IS NULL);

-- =====================================================
-- 3. SET DEFAULT CONSTRUCT WEIGHTS FOR TAXONOMY NODES
-- =====================================================

-- Set balanced defaults for all taxonomy nodes
UPDATE taxonomy_nodes
SET default_construct_weights = '{
  "C.ATTENTION": 0.20,
  "C.SPEED": 0.20,
  "C.REASONING": 0.20,
  "C.COMPUTATION": 0.20,
  "C.READING": 0.20
}'::jsonb,
expected_time_sec = CASE
  WHEN level = 5 THEN 90  -- Micro-skills
  WHEN level = 4 THEN 100 -- Subtopics
  WHEN level = 3 THEN 110 -- Topics
  WHEN level = 2 THEN 120 -- Subtests
  ELSE 120                -- Subjects
END
WHERE default_construct_weights = '{}'::jsonb
   OR default_construct_weights IS NULL;

-- =====================================================
-- 4. ENSURE QUESTIONS ARE LINKED TO TAXONOMY
-- =====================================================

-- Create a helper view to see unlinked questions
CREATE OR REPLACE VIEW unlinked_questions AS
SELECT
  q.id,
  q.question_text,
  q.question_type,
  q.difficulty,
  q.cognitive_level,
  q.created_at
FROM questions q
WHERE NOT EXISTS (
  SELECT 1 FROM question_taxonomy qt
  WHERE qt.question_id = q.id
)
AND q.is_active = true;

COMMENT ON VIEW unlinked_questions IS 'Questions not linked to taxonomy - need manual assignment for skill tracking';

-- =====================================================
-- 5. SUMMARY STATISTICS
-- =====================================================

-- Create a view to check metadata completeness
CREATE OR REPLACE VIEW question_metadata_status AS
SELECT
  COUNT(*) as total_questions,
  COUNT(CASE WHEN construct_weights = '{}'::jsonb THEN 1 END) as empty_constructs,
  COUNT(CASE WHEN time_estimate_seconds IS NULL THEN 1 END) as missing_time,
  COUNT(CASE WHEN EXISTS (
    SELECT 1 FROM question_taxonomy qt WHERE qt.question_id = questions.id
  ) THEN 1 END) as linked_to_taxonomy,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_questions
FROM questions;

COMMENT ON VIEW question_metadata_status IS 'Shows completeness of question metadata for analytics';

-- Display summary
SELECT * FROM question_metadata_status;
