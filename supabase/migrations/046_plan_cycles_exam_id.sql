-- Add exam_id to plan_cycles so plans are scoped to active exam only
-- Students only see plan when cycle.exam_id matches the currently active exam

ALTER TABLE plan_cycles
ADD COLUMN IF NOT EXISTS exam_id UUID REFERENCES exams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_plan_cycles_exam ON plan_cycles(exam_id);

COMMENT ON COLUMN plan_cycles.exam_id IS 'Exam this plan cycle targets; plan only shown when this matches active exam';

-- Backfill from analytics_snapshots (generated_from_snapshot_id -> snapshot.exam_id)
UPDATE plan_cycles pc
SET exam_id = s.exam_id
FROM analytics_snapshots s
WHERE pc.generated_from_snapshot_id = s.id
  AND s.exam_id IS NOT NULL
  AND pc.exam_id IS NULL;
