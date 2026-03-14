-- Add exam_id to baseline_modules so baseline is exam-specific
-- When student switches to a new exam, they must complete baseline for that exam

ALTER TABLE baseline_modules
ADD COLUMN IF NOT EXISTS exam_id UUID REFERENCES exams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_baseline_modules_exam ON baseline_modules(exam_id);

COMMENT ON COLUMN baseline_modules.exam_id IS 'Exam this baseline checkpoint belongs to; student must complete baseline per exam';

-- Backfill from modules (baseline_modules.module_id -> modules.exam_id)
UPDATE baseline_modules bm
SET exam_id = m.exam_id
FROM modules m
WHERE bm.module_id = m.id
  AND bm.exam_id IS NULL
  AND m.exam_id IS NOT NULL;
