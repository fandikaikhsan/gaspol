-- Student sees only active exam
-- Plan, analytics, time left, and related content are shown only when there is an active exam.
-- If user_state.current_exam_id points to an inactive exam, we fall back to most recent active exam.

-- =====================================================
-- 1. UPDATE get_user_exam_config: Only return active exams
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
  -- Get user's current exam from user_state
  SELECT us.current_exam_id INTO v_exam_id
  FROM user_state us
  WHERE us.user_id = p_user_id;

  -- Validate: if user has an exam, it must be active; otherwise treat as null
  IF v_exam_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM exams e WHERE e.id = v_exam_id AND e.is_active = true) THEN
      v_exam_id := NULL;  -- User's exam is inactive, ignore it
    END IF;
  END IF;

  -- Fallback to most recent active exam
  IF v_exam_id IS NULL THEN
    SELECT id INTO v_exam_id
    FROM exams
    WHERE is_active = true
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  IF v_exam_id IS NULL THEN
    RETURN;  -- No active exam
  END IF;

  RETURN QUERY
  SELECT
    e.id as exam_id,
    e.exam_type,
    e.name as exam_name,
    (SELECT COUNT(*)::INTEGER FROM exam_constructs WHERE exam_id = e.id AND is_active = true) as construct_count,
    (SELECT COUNT(*)::INTEGER FROM tags WHERE exam_id = e.id AND tag_type = 'error' AND is_active = true) as error_tag_count
  FROM exams e
  WHERE e.id = v_exam_id AND e.is_active = true;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_exam_config IS 'Get exam config for a user. Returns only active exams. Students see content based on this.';

-- =====================================================
-- 2. UPDATE generate_analytics_snapshot: Only use active exams
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
  IF p_scope NOT IN ('partial_baseline', 'full_baseline', 'cycle_end', 'checkpoint', 'daily') THEN
    RAISE EXCEPTION 'Invalid scope: %. Must be one of: partial_baseline, full_baseline, cycle_end, checkpoint, daily', p_scope;
  END IF;

  -- Get user's current exam, only if it is active
  SELECT us.current_exam_id INTO v_exam_id
  FROM user_state us
  WHERE us.user_id = p_user_id;

  IF v_exam_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM exams e WHERE e.id = v_exam_id AND e.is_active = true) THEN
    v_exam_id := NULL;  -- User's exam is inactive
  END IF;

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

  IF v_constructs IS NULL OR v_constructs = '{}'::jsonb THEN
    IF v_exam_id IS NOT NULL THEN
      SELECT jsonb_object_agg(code, 50) INTO v_constructs
      FROM exam_constructs
      WHERE exam_id = v_exam_id AND is_active = true;
    END IF;
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

  v_weak_skills := get_top_weak_skills(p_user_id, 5);
  v_error_tags := get_top_error_tags(p_user_id, 5);

  INSERT INTO analytics_snapshots (
    user_id,
    scope,
    coverage,
    readiness,
    radar,
    constructs,
    top_weak_skills,
    top_error_tags,
    exam_id
  )
  VALUES (
    p_user_id,
    p_scope,
    v_coverage,
    v_readiness,
    v_radar,
    v_constructs,
    v_weak_skills,
    v_error_tags,
    v_exam_id
  )
  RETURNING id INTO v_snapshot_id;

  RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_analytics_snapshot IS 'Generate analytics snapshot using only active exam constructs';

-- =====================================================
-- 3. UPDATE get_latest_snapshot: Only return snapshots for active exam
-- =====================================================

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
DECLARE
  v_active_exam_id UUID;
BEGIN
  -- Resolve active exam (same logic as get_user_exam_config)
  SELECT us.current_exam_id INTO v_active_exam_id
  FROM user_state us
  WHERE us.user_id = p_user_id;

  IF v_active_exam_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM exams e WHERE e.id = v_active_exam_id AND e.is_active = true) THEN
    v_active_exam_id := NULL;
  END IF;

  IF v_active_exam_id IS NULL THEN
    SELECT e.id INTO v_active_exam_id
    FROM exams e
    WHERE e.is_active = true
    ORDER BY e.created_at DESC
    LIMIT 1;
  END IF;

  -- When no active exam, return nothing (student should not see analytics for inactive exam)
  IF v_active_exam_id IS NULL THEN
    RETURN;
  END IF;

  -- Return only snapshots for the active exam (or legacy snapshots with null exam_id for backward compat)
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
    AND s.exam_id = v_active_exam_id
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
    AND s.exam_id = v_active_exam_id
    ORDER BY s.created_at DESC
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_latest_snapshot IS 'Get most recent analytics snapshot for user, filtered by active exam only';
