-- Fix Analytics Snapshots Schema
-- The table was created with old columns but functions expect new JSONB columns
-- This migration adds the missing columns

-- =====================================================
-- 1. ADD MISSING COLUMNS TO ANALYTICS_SNAPSHOTS
-- =====================================================

-- Add scope column (was snapshot_type before)
ALTER TABLE analytics_snapshots
ADD COLUMN IF NOT EXISTS scope TEXT;

-- Add JSONB columns for analytics data
ALTER TABLE analytics_snapshots
ADD COLUMN IF NOT EXISTS coverage JSONB DEFAULT '{}'::jsonb;

ALTER TABLE analytics_snapshots
ADD COLUMN IF NOT EXISTS readiness FLOAT DEFAULT 50.0;

ALTER TABLE analytics_snapshots
ADD COLUMN IF NOT EXISTS radar JSONB DEFAULT '{}'::jsonb;

ALTER TABLE analytics_snapshots
ADD COLUMN IF NOT EXISTS constructs JSONB DEFAULT '{}'::jsonb;

ALTER TABLE analytics_snapshots
ADD COLUMN IF NOT EXISTS top_weak_skills JSONB DEFAULT '[]'::jsonb;

ALTER TABLE analytics_snapshots
ADD COLUMN IF NOT EXISTS top_error_tags JSONB DEFAULT '[]'::jsonb;

-- Add exam_id for adaptive platform
ALTER TABLE analytics_snapshots
ADD COLUMN IF NOT EXISTS exam_id UUID REFERENCES exams(id);

-- =====================================================
-- 2. MIGRATE OLD DATA (if any exists)
-- =====================================================

-- Copy snapshot_type to scope if scope is null
UPDATE analytics_snapshots
SET scope = snapshot_type
WHERE scope IS NULL AND snapshot_type IS NOT NULL;

-- Build constructs JSONB from individual columns
UPDATE analytics_snapshots
SET constructs = jsonb_build_object(
  'C.ATTENTION', COALESCE(teliti_score, 50),
  'C.SPEED', COALESCE(speed_score, 50),
  'C.REASONING', COALESCE(reasoning_score, 50),
  'C.COMPUTATION', COALESCE(computation_score, 50),
  'C.READING', COALESCE(reading_score, 50)
)
WHERE constructs IS NULL OR constructs = '{}'::jsonb;

-- Copy readiness_score to readiness
UPDATE analytics_snapshots
SET readiness = COALESCE(readiness_score, 50)
WHERE readiness IS NULL OR readiness = 0;

-- =====================================================
-- 3. CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_user_scope
ON analytics_snapshots(user_id, scope);

CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_created
ON analytics_snapshots(created_at DESC);

-- =====================================================
-- 4. UPDATE GET_LATEST_SNAPSHOT FUNCTION
-- =====================================================

-- Drop and recreate to handle both old and new schema
CREATE OR REPLACE FUNCTION get_latest_snapshot(
  p_user_id UUID,
  p_scope TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  scope TEXT,
  coverage JSONB,
  readiness FLOAT,
  radar JSONB,
  constructs JSONB,
  top_weak_skills JSONB,
  top_error_tags JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  IF p_scope IS NULL THEN
    RETURN QUERY
    SELECT
      s.id,
      COALESCE(s.scope, s.snapshot_type) as scope,
      COALESCE(s.coverage, '{}'::jsonb) as coverage,
      COALESCE(s.readiness, s.readiness_score::float, 50.0) as readiness,
      COALESCE(s.radar, '{}'::jsonb) as radar,
      COALESCE(s.constructs, jsonb_build_object(
        'C.ATTENTION', COALESCE(s.teliti_score, 50),
        'C.SPEED', COALESCE(s.speed_score, 50),
        'C.REASONING', COALESCE(s.reasoning_score, 50),
        'C.COMPUTATION', COALESCE(s.computation_score, 50),
        'C.READING', COALESCE(s.reading_score, 50)
      )) as constructs,
      COALESCE(s.top_weak_skills, '[]'::jsonb) as top_weak_skills,
      COALESCE(s.top_error_tags, '[]'::jsonb) as top_error_tags,
      s.created_at
    FROM analytics_snapshots s
    WHERE s.user_id = p_user_id
    ORDER BY s.created_at DESC
    LIMIT 1;
  ELSE
    RETURN QUERY
    SELECT
      s.id,
      COALESCE(s.scope, s.snapshot_type) as scope,
      COALESCE(s.coverage, '{}'::jsonb) as coverage,
      COALESCE(s.readiness, s.readiness_score::float, 50.0) as readiness,
      COALESCE(s.radar, '{}'::jsonb) as radar,
      COALESCE(s.constructs, jsonb_build_object(
        'C.ATTENTION', COALESCE(s.teliti_score, 50),
        'C.SPEED', COALESCE(s.speed_score, 50),
        'C.REASONING', COALESCE(s.reasoning_score, 50),
        'C.COMPUTATION', COALESCE(s.computation_score, 50),
        'C.READING', COALESCE(s.reading_score, 50)
      )) as constructs,
      COALESCE(s.top_weak_skills, '[]'::jsonb) as top_weak_skills,
      COALESCE(s.top_error_tags, '[]'::jsonb) as top_error_tags,
      s.created_at
    FROM analytics_snapshots s
    WHERE s.user_id = p_user_id
    AND (s.scope = p_scope OR s.snapshot_type = p_scope)
    ORDER BY s.created_at DESC
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =====================================================
-- 5. VERIFY
-- =====================================================

SELECT 'Analytics snapshots schema fixed!' as status;

-- Show column list
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'analytics_snapshots'
ORDER BY ordinal_position;
