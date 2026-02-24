-- Fix Analytics for Adaptive Platform
-- Makes snapshot generation use exam-specific constructs

-- =====================================================
-- 1. UPDATE generate_analytics_snapshot TO USE EXAM CONSTRUCTS
-- =====================================================

CREATE OR REPLACE FUNCTION generate_analytics_snapshot(
  p_user_id UUID,
  p_scope TEXT
)
RETURNS UUID AS $$
DECLARE
  v_snapshot_id UUID;
  v_coverage JSONB;
  v_readiness FLOAT;
  v_radar JSONB;
  v_constructs JSONB;
  v_weak_skills JSONB;
  v_error_tags JSONB;
  v_exam_id UUID;
BEGIN
  -- Validate scope
  IF p_scope NOT IN ('partial_baseline', 'full_baseline', 'cycle_end', 'checkpoint', 'daily') THEN
    RAISE EXCEPTION 'Invalid scope: %. Must be one of: partial_baseline, full_baseline, cycle_end, checkpoint, daily', p_scope;
  END IF;

  -- Get user's current exam
  SELECT current_exam_id INTO v_exam_id
  FROM user_state
  WHERE user_id = p_user_id;

  -- Fallback: Get most recent active exam if no user_state
  IF v_exam_id IS NULL THEN
    SELECT id INTO v_exam_id
    FROM exams
    WHERE is_active = true
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  -- Calculate coverage map
  v_coverage := calculate_coverage_map(p_user_id);

  -- Get readiness score
  v_readiness := get_user_readiness_score(p_user_id);

  -- Calculate radar chart data
  v_radar := calculate_radar_data(p_user_id);

  -- Get current construct scores from user_construct_state
  SELECT jsonb_object_agg(construct_name, score) INTO v_constructs
  FROM user_construct_state
  WHERE user_id = p_user_id;

  -- If no construct state, build default from exam_constructs (adaptive)
  IF v_constructs IS NULL OR v_constructs = '{}'::jsonb THEN
    SELECT jsonb_object_agg(code, 50) INTO v_constructs
    FROM exam_constructs
    WHERE exam_id = v_exam_id
    AND is_active = true;

    -- Ultimate fallback: hardcoded defaults
    IF v_constructs IS NULL OR v_constructs = '{}'::jsonb THEN
      v_constructs := '{
        "C.ATTENTION": 50,
        "C.SPEED": 50,
        "C.REASONING": 50,
        "C.COMPUTATION": 50,
        "C.READING": 50
      }'::jsonb;
    END IF;
  END IF;

  -- Get top weak skills
  v_weak_skills := get_top_weak_skills(p_user_id, 5);

  -- Get top error tags
  v_error_tags := get_top_error_tags(p_user_id, 5);

  -- Insert snapshot
  INSERT INTO analytics_snapshots (
    user_id,
    scope,
    coverage,
    readiness,
    radar,
    constructs,
    top_weak_skills,
    top_error_tags
  )
  VALUES (
    p_user_id,
    p_scope,
    v_coverage,
    v_readiness,
    v_radar,
    v_constructs,
    v_weak_skills,
    v_error_tags
  )
  RETURNING id INTO v_snapshot_id;

  RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_analytics_snapshot IS 'Generate complete analytics snapshot using exam-specific constructs';

-- =====================================================
-- 2. ADD EXAM_ID TO USER_STATE IF MISSING
-- =====================================================

ALTER TABLE user_state
ADD COLUMN IF NOT EXISTS current_exam_id UUID REFERENCES exams(id);

COMMENT ON COLUMN user_state.current_exam_id IS 'The exam the user is currently preparing for';

-- =====================================================
-- 3. FUNCTION TO GET USER EXAM CONFIG
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_exam_config(p_user_id UUID)
RETURNS TABLE (
  exam_id UUID,
  exam_type TEXT,
  exam_name TEXT,
  construct_count INTEGER,
  error_tag_count INTEGER
) AS $$
DECLARE
  v_exam_id UUID;
BEGIN
  -- Get user's current exam
  SELECT current_exam_id INTO v_exam_id
  FROM user_state
  WHERE user_id = p_user_id;

  -- Fallback to most recent active exam
  IF v_exam_id IS NULL THEN
    SELECT id INTO v_exam_id
    FROM exams
    WHERE is_active = true
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  IF v_exam_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    e.id as exam_id,
    e.exam_type,
    e.name as exam_name,
    (SELECT COUNT(*)::INTEGER FROM exam_constructs WHERE exam_id = e.id AND is_active = true) as construct_count,
    (SELECT COUNT(*)::INTEGER FROM tags WHERE exam_id = e.id AND tag_type = 'error' AND is_active = true) as error_tag_count
  FROM exams e
  WHERE e.id = v_exam_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_exam_config IS 'Get the exam configuration for a user';

-- =====================================================
-- 4. ADD EXAM_ID TO ANALYTICS SNAPSHOT FOR REFERENCE
-- =====================================================

ALTER TABLE analytics_snapshots
ADD COLUMN IF NOT EXISTS exam_id UUID REFERENCES exams(id);

COMMENT ON COLUMN analytics_snapshots.exam_id IS 'The exam this snapshot was generated for';
