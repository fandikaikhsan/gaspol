-- Backfill exam_id for baseline_modules that still have NULL
-- (e.g. created after 047 but before admin insert was updated to set exam_id)
UPDATE baseline_modules bm
SET exam_id = m.exam_id
FROM modules m
WHERE bm.module_id = m.id
  AND bm.exam_id IS NULL
  AND m.exam_id IS NOT NULL;
