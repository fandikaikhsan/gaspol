-- Migration: Remove modules.question_ids, use module_questions exclusively
-- 1. Add 'recycle' to module_type constraint (for create_recycle_checkpoint)
-- 2. Migrate existing question_ids data to module_questions
-- 3. Drop question_ids column

-- Step 1: Add 'recycle' to module_type CHECK
ALTER TABLE modules DROP CONSTRAINT IF EXISTS modules_module_type_check;
ALTER TABLE modules ADD CONSTRAINT modules_module_type_check
  CHECK (module_type IN ('baseline', 'drill_focus', 'drill_mixed', 'mock', 'flashcard', 'swipe', 'recycle'));

-- Step 2: Migrate question_ids to module_questions (for modules that have non-empty question_ids)
-- Only insert if module_questions doesn't already have rows for this module
INSERT INTO module_questions (module_id, question_id, order_index)
SELECT m.id, qid::uuid, ord
FROM modules m,
     jsonb_array_elements_text(m.question_ids) WITH ORDINALITY AS arr(qid, ord)
WHERE m.question_ids IS NOT NULL
  AND jsonb_array_length(m.question_ids) > 0
  AND NOT EXISTS (SELECT 1 FROM module_questions mq WHERE mq.module_id = m.id)
ON CONFLICT (module_id, question_id) DO NOTHING;

-- Step 3: Drop question_ids column
ALTER TABLE modules DROP COLUMN IF EXISTS question_ids;

COMMENT ON TABLE module_questions IS 'Junction table for module-question mapping. Replaces deprecated modules.question_ids.';
