-- Analytics Snapshot Generation
-- Pre-computes analytics for fast dashboard loading
-- Triggered at key milestones: baseline complete, cycle end, daily

-- =====================================================
-- 1. CALCULATE COVERAGE MAP
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_coverage_map(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_coverage JSONB := '{}'::jsonb;
  v_subject RECORD;
  v_total_nodes INTEGER;
  v_attempted_nodes INTEGER;
  v_coverage_pct FLOAT;
BEGIN
  -- Calculate coverage for each level-1 subject
  FOR v_subject IN (
    SELECT id, name, code
    FROM taxonomy_nodes
    WHERE level = 1
    ORDER BY code
  )
  LOOP
    -- Count total nodes under this subject (all descendants)
    SELECT COUNT(DISTINCT tn.id)
    INTO v_total_nodes
    FROM taxonomy_nodes tn
    WHERE tn.id = v_subject.id
    OR tn.parent_id = v_subject.id
    OR EXISTS (
      SELECT 1 FROM taxonomy_nodes tn2
      WHERE tn2.parent_id = tn.id
      AND (tn2.id = v_subject.id OR tn2.parent_id = v_subject.id)
    );

    -- Count attempted nodes (with at least 1 attempt)
    SELECT COUNT(DISTINCT uss.taxonomy_node_id)
    INTO v_attempted_nodes
    FROM user_skill_state uss
    INNER JOIN taxonomy_nodes tn ON tn.id = uss.taxonomy_node_id
    WHERE uss.user_id = p_user_id
    AND uss.attempt_count > 0
    AND (
      tn.id = v_subject.id
      OR tn.parent_id = v_subject.id
      OR EXISTS (
        SELECT 1 FROM taxonomy_nodes tn2
        WHERE tn2.parent_id = tn.id
        AND (tn2.id = v_subject.id OR tn2.parent_id = v_subject.id)
      )
    );

    -- Calculate percentage
    IF v_total_nodes > 0 THEN
      v_coverage_pct := v_attempted_nodes::FLOAT / v_total_nodes;
    ELSE
      v_coverage_pct := 0.0;
    END IF;

    -- Add to coverage map
    v_coverage := jsonb_set(
      v_coverage,
      ARRAY[v_subject.code],
      to_jsonb(ROUND(v_coverage_pct::NUMERIC, 2))
    );
  END LOOP;

  RETURN v_coverage;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_coverage_map IS 'Calculate % of taxonomy attempted per subject (e.g., {"TPS": 0.85, "TKA": 0.45})';

-- =====================================================
-- 2. CALCULATE RADAR CHART DATA (Cognitive Levels)
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_radar_data(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_radar JSONB := '{}'::jsonb;
  v_level TEXT;
  v_avg_mastery FLOAT;
BEGIN
  -- Calculate average mastery for each cognitive level
  FOR v_level IN SELECT UNNEST(ARRAY['L1', 'L2', 'L3'])
  LOOP
    SELECT AVG(uss.mastery) * 100
    INTO v_avg_mastery
    FROM user_skill_state uss
    INNER JOIN question_taxonomy qt ON qt.taxonomy_node_id = uss.taxonomy_node_id
    INNER JOIN questions q ON q.id = qt.question_id
    WHERE uss.user_id = p_user_id
    AND q.cognitive_level = v_level
    AND uss.attempt_count >= 3;

    v_avg_mastery := COALESCE(v_avg_mastery, 0.0);

    -- Map L1/L2/L3 to descriptive labels
    v_radar := jsonb_set(
      v_radar,
      ARRAY[
        CASE v_level
          WHEN 'L1' THEN 'recall'
          WHEN 'L2' THEN 'application'
          WHEN 'L3' THEN 'analysis'
        END
      ],
      to_jsonb(ROUND(v_avg_mastery::NUMERIC, 1))
    );
  END LOOP;

  RETURN v_radar;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_radar_data IS 'Calculate mastery by cognitive level for radar chart';

-- =====================================================
-- 3. GET TOP WEAK SKILLS
-- =====================================================

CREATE OR REPLACE FUNCTION get_top_weak_skills(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS JSONB AS $$
DECLARE
  v_weak_skills JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'node_id', uss.taxonomy_node_id,
      'name', tn.name,
      'code', tn.code,
      'level', tn.level,
      'mastery', ROUND(uss.mastery::NUMERIC, 2),
      'attempt_count', uss.attempt_count
    )
    ORDER BY uss.mastery ASC
  )
  INTO v_weak_skills
  FROM (
    SELECT *
    FROM user_skill_state
    WHERE user_id = p_user_id
    AND attempt_count >= 3 -- Only skills with sufficient data
    AND mastery < 0.7 -- Below proficiency threshold
    ORDER BY mastery ASC
    LIMIT p_limit
  ) uss
  INNER JOIN taxonomy_nodes tn ON tn.id = uss.taxonomy_node_id;

  RETURN COALESCE(v_weak_skills, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_top_weak_skills IS 'Get top N weakest skills that need focus';

-- =====================================================
-- 4. GET TOP ERROR TAGS
-- =====================================================

CREATE OR REPLACE FUNCTION get_top_error_tags(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS JSONB AS $$
DECLARE
  v_error_tags JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'tag_id', aet.tag_id,
      'name', t.name,
      'count', tag_counts.count,
      'percentage', ROUND((tag_counts.count::FLOAT / total.total_errors * 100)::NUMERIC, 1)
    )
    ORDER BY tag_counts.count DESC
  )
  INTO v_error_tags
  FROM (
    SELECT tag_id, COUNT(*) as count
    FROM attempt_error_tags aet
    INNER JOIN attempts a ON a.id = aet.attempt_id
    WHERE a.user_id = p_user_id
    AND a.attempted_at >= NOW() - INTERVAL '30 days'
    GROUP BY tag_id
    ORDER BY COUNT(*) DESC
    LIMIT p_limit
  ) tag_counts
  INNER JOIN attempt_error_tags aet ON aet.tag_id = tag_counts.tag_id
  INNER JOIN tags t ON t.id = tag_counts.tag_id
  CROSS JOIN (
    SELECT COUNT(*) as total_errors
    FROM attempt_error_tags aet
    INNER JOIN attempts a ON a.id = aet.attempt_id
    WHERE a.user_id = p_user_id
    AND a.attempted_at >= NOW() - INTERVAL '30 days'
  ) total
  GROUP BY aet.tag_id, t.name, tag_counts.count, total.total_errors;

  RETURN COALESCE(v_error_tags, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_top_error_tags IS 'Get most common error patterns in last 30 days';

-- =====================================================
-- 5. GENERATE COMPLETE SNAPSHOT
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
BEGIN
  -- Validate scope
  IF p_scope NOT IN ('partial_baseline', 'full_baseline', 'cycle_end', 'checkpoint', 'daily') THEN
    RAISE EXCEPTION 'Invalid scope: %. Must be one of: partial_baseline, full_baseline, cycle_end, checkpoint, daily', p_scope;
  END IF;

  -- Calculate coverage map
  v_coverage := calculate_coverage_map(p_user_id);

  -- Get readiness score
  v_readiness := get_user_readiness_score(p_user_id);

  -- Calculate radar chart data
  v_radar := calculate_radar_data(p_user_id);

  -- Get current construct scores
  SELECT constructs INTO v_constructs
  FROM user_construct_state
  WHERE user_id = p_user_id;

  v_constructs := COALESCE(v_constructs, '{
    "C.ATTENTION": 50,
    "C.SPEED": 50,
    "C.REASONING": 50,
    "C.COMPUTATION": 50,
    "C.READING": 50
  }'::jsonb);

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

COMMENT ON FUNCTION generate_analytics_snapshot IS 'Generate complete analytics snapshot for dashboard';

-- =====================================================
-- 6. GET LATEST SNAPSHOT
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
BEGIN
  IF p_scope IS NULL THEN
    -- Get most recent snapshot of any type
    RETURN QUERY
    SELECT
      s.id,
      s.scope,
      s.coverage,
      s.readiness,
      s.radar,
      s.constructs,
      s.top_weak_skills,
      s.top_error_tags,
      s.created_at
    FROM analytics_snapshots s
    WHERE s.user_id = p_user_id
    ORDER BY s.created_at DESC
    LIMIT 1;
  ELSE
    -- Get most recent snapshot of specific type
    RETURN QUERY
    SELECT
      s.id,
      s.scope,
      s.coverage,
      s.readiness,
      s.radar,
      s.constructs,
      s.top_weak_skills,
      s.top_error_tags,
      s.created_at
    FROM analytics_snapshots s
    WHERE s.user_id = p_user_id
    AND s.scope = p_scope
    ORDER BY s.created_at DESC
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_latest_snapshot IS 'Get most recent analytics snapshot for a user';

-- =====================================================
-- 7. AUTO-GENERATE DAILY SNAPSHOT (Scheduled Job)
-- =====================================================

CREATE OR REPLACE FUNCTION generate_daily_snapshots()
RETURNS INTEGER AS $$
DECLARE
  v_user_id UUID;
  v_count INTEGER := 0;
BEGIN
  -- Generate daily snapshots for all active users
  FOR v_user_id IN (
    SELECT DISTINCT user_id
    FROM attempts
    WHERE attempted_at >= NOW() - INTERVAL '7 days'
  )
  LOOP
    -- Check if snapshot for today already exists
    IF NOT EXISTS (
      SELECT 1
      FROM analytics_snapshots
      WHERE user_id = v_user_id
      AND scope = 'daily'
      AND created_at >= CURRENT_DATE
    ) THEN
      -- Generate snapshot
      PERFORM generate_analytics_snapshot(v_user_id, 'daily');
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_daily_snapshots IS 'Generate daily snapshots for all active users (called by cron job)';

-- =====================================================
-- 8. TRIGGER SNAPSHOT ON BASELINE COMPLETION
-- =====================================================

CREATE OR REPLACE FUNCTION check_baseline_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_total_checkpoints INTEGER;
  v_completed_checkpoints INTEGER;
BEGIN
  -- Count total active baseline checkpoints
  SELECT COUNT(*)
  INTO v_total_checkpoints
  FROM baseline_modules
  WHERE is_active = true;

  -- Count how many the user has completed (at least 1 attempt per checkpoint)
  SELECT COUNT(DISTINCT bm.id)
  INTO v_completed_checkpoints
  FROM baseline_modules bm
  WHERE bm.is_active = true
  AND EXISTS (
    SELECT 1
    FROM attempts a
    WHERE a.user_id = NEW.user_id
    AND a.baseline_module_id = bm.id
  );

  -- If user just completed all checkpoints, generate full_baseline snapshot
  IF v_completed_checkpoints = v_total_checkpoints AND v_total_checkpoints > 0 THEN
    -- Check if full_baseline snapshot already exists
    IF NOT EXISTS (
      SELECT 1
      FROM analytics_snapshots
      WHERE user_id = NEW.user_id
      AND scope = 'full_baseline'
    ) THEN
      -- Generate baseline completion snapshot
      PERFORM generate_analytics_snapshot(NEW.user_id, 'full_baseline');
      RAISE NOTICE 'Generated full_baseline snapshot for user %', NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on attempts table
DROP TRIGGER IF EXISTS baseline_completion_trigger ON attempts;

CREATE TRIGGER baseline_completion_trigger
AFTER INSERT ON attempts
FOR EACH ROW
WHEN (NEW.baseline_module_id IS NOT NULL)
EXECUTE FUNCTION check_baseline_completion();

COMMENT ON FUNCTION check_baseline_completion IS 'Auto-generate snapshot when user completes all baseline checkpoints';
