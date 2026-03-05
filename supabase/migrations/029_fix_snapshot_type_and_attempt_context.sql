-- Align analytics snapshot_type constraint with current generate_snapshot scopes
-- and harden attempts.context_id for non-UUID context sources (e.g., mock-* session ids).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'analytics_snapshots_snapshot_type_check'
  ) THEN
    ALTER TABLE analytics_snapshots
      DROP CONSTRAINT analytics_snapshots_snapshot_type_check;
  END IF;
END $$;

ALTER TABLE analytics_snapshots
  ADD CONSTRAINT analytics_snapshots_snapshot_type_check
  CHECK (
    snapshot_type IN (
      'baseline_start',
      'baseline_complete',
      'cycle_start',
      'cycle_end',
      'recycle_before',
      'recycle_after',
      'partial_baseline',
      'full_baseline',
      'checkpoint',
      'daily'
    )
  );

ALTER TABLE attempts
  ALTER COLUMN context_id TYPE TEXT USING context_id::text;

DROP INDEX IF EXISTS idx_attempts_user_question_context;
DROP INDEX IF EXISTS idx_attempts_unique_submission;

CREATE UNIQUE INDEX IF NOT EXISTS idx_attempts_user_question_context
  ON attempts(user_id, question_id, context_type, context_id);
