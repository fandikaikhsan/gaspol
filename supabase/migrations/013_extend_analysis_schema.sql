-- Extend Analysis Schema
-- Add missing fields and indexes for the analysis system

-- =====================================================
-- 1. Extend attempts table
-- =====================================================

-- Add confidence field if not exists
ALTER TABLE attempts
ADD COLUMN IF NOT EXISTS confidence SMALLINT CHECK (confidence BETWEEN 1 AND 5);

-- Add baseline_module_id for better tracking
ALTER TABLE attempts
ADD COLUMN IF NOT EXISTS baseline_module_id UUID REFERENCES baseline_modules(id) ON DELETE SET NULL;

-- Add checkpoint_id for future use
ALTER TABLE attempts
ADD COLUMN IF NOT EXISTS checkpoint_id TEXT;

-- Add index for baseline tracking
CREATE INDEX IF NOT EXISTS idx_attempts_baseline ON attempts(baseline_module_id);

COMMENT ON COLUMN attempts.confidence IS 'Student self-reported confidence level 1-5';
COMMENT ON COLUMN attempts.baseline_module_id IS 'Reference to baseline checkpoint if attempt was during baseline assessment';

-- =====================================================
-- 2. Create attempt_error_tags junction table
-- =====================================================

CREATE TABLE IF NOT EXISTS attempt_error_tags (
  attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,

  -- How was this tag assigned?
  source TEXT NOT NULL CHECK (source IN ('rule', 'ai', 'user_confirmed')),
  confidence DECIMAL(3,2) NULL CHECK (confidence BETWEEN 0 AND 1),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (attempt_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_attempt_tags_attempt ON attempt_error_tags(attempt_id);
CREATE INDEX IF NOT EXISTS idx_attempt_tags_tag ON attempt_error_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_attempt_tags_source ON attempt_error_tags(source);

COMMENT ON TABLE attempt_error_tags IS 'Links attempts to error pattern tags for diagnostic analysis';
COMMENT ON COLUMN attempt_error_tags.source IS 'How tag was assigned: rule (algorithmic), ai (Claude analysis), user_confirmed (student verified)';

-- =====================================================
-- 3. RLS for attempt_error_tags
-- =====================================================

ALTER TABLE attempt_error_tags ENABLE ROW LEVEL SECURITY;

-- Students can view their own error tags
CREATE POLICY attempt_tags_user_view ON attempt_error_tags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM attempts
      WHERE attempts.id = attempt_error_tags.attempt_id
      AND attempts.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can manage all error tags
CREATE POLICY attempt_tags_admin_all ON attempt_error_tags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- 4. Helper functions for analysis
-- =====================================================

-- Function to get user's current mastery for a taxonomy node
CREATE OR REPLACE FUNCTION get_user_mastery(p_user_id UUID, p_node_id UUID)
RETURNS FLOAT AS $$
BEGIN
  RETURN (
    SELECT COALESCE(mastery, 0.0)
    FROM user_skill_state
    WHERE user_id = p_user_id
    AND taxonomy_node_id = p_node_id
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get user's recent attempts
CREATE OR REPLACE FUNCTION get_recent_attempts(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  attempt_id UUID,
  question_id UUID,
  is_correct BOOLEAN,
  time_spent_sec INTEGER,
  attempted_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    attempts.id,
    attempts.question_id,
    attempts.is_correct,
    attempts.time_spent_sec,
    attempts.attempted_at
  FROM attempts
  WHERE attempts.user_id = p_user_id
  ORDER BY attempts.attempted_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to calculate accuracy for a user
CREATE OR REPLACE FUNCTION get_user_accuracy(p_user_id UUID, p_days INTEGER DEFAULT 7)
RETURNS FLOAT AS $$
DECLARE
  v_accuracy FLOAT;
BEGIN
  SELECT
    CASE
      WHEN COUNT(*) = 0 THEN 0.0
      ELSE CAST(SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*)
    END INTO v_accuracy
  FROM attempts
  WHERE user_id = p_user_id
  AND attempted_at >= NOW() - (p_days || ' days')::INTERVAL;

  RETURN COALESCE(v_accuracy, 0.0);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_mastery IS 'Get current mastery score for a user at a specific taxonomy node';
COMMENT ON FUNCTION get_recent_attempts IS 'Get most recent attempts for a user for quick lookups';
COMMENT ON FUNCTION get_user_accuracy IS 'Calculate user accuracy percentage over the last N days';
