-- checkpoint_order should be unique per exam, not globally
-- This allows each exam to have its own sequence 1, 2, 3...

-- Drop the global unique constraint
ALTER TABLE baseline_modules
DROP CONSTRAINT IF EXISTS baseline_modules_checkpoint_order_key;

-- Add per-exam unique constraint (exam_id, checkpoint_order)
-- Rows with exam_id NULL (legacy) are not enforced
CREATE UNIQUE INDEX baseline_modules_exam_order_key
ON baseline_modules(exam_id, checkpoint_order)
WHERE exam_id IS NOT NULL;

-- Renumber existing checkpoints per exam (1, 2, 3... within each exam)
-- Two-step update to avoid unique constraint violations during renumbering
WITH numbered AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY exam_id ORDER BY checkpoint_order) AS new_order
  FROM baseline_modules
  WHERE exam_id IS NOT NULL
)
UPDATE baseline_modules bm
SET checkpoint_order = -n.new_order
FROM numbered n
WHERE bm.id = n.id;

WITH numbered AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY exam_id ORDER BY checkpoint_order) AS new_order
  FROM baseline_modules
  WHERE exam_id IS NOT NULL
)
UPDATE baseline_modules bm
SET checkpoint_order = n.new_order
FROM numbered n
WHERE bm.id = n.id;
