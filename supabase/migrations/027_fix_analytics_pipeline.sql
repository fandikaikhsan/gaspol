-- Fix Analytics Pipeline
-- Issues:
-- 1. No trigger calling analytics processing after each attempt
-- 2. Functions use taxonomy_node_id but table uses micro_skill_id
-- This migration fixes both issues

-- =====================================================
-- 1. CREATE/UPDATE process_attempt_analytics TO USE micro_skill_id
-- =====================================================

CREATE OR REPLACE FUNCTION process_attempt_analytics(
  p_user_id UUID,
  p_question_id UUID,
  p_is_correct BOOLEAN
)
RETURNS VOID AS $$
DECLARE
  v_micro_skill_id UUID;
BEGIN
  -- Get micro_skill_id for this question
  SELECT micro_skill_id INTO v_micro_skill_id
  FROM questions
  WHERE id = p_question_id;

  IF v_micro_skill_id IS NULL THEN
    RAISE NOTICE 'Question % has no micro_skill_id, skipping mastery update', p_question_id;
  ELSE
    -- Update skill state at this node
    PERFORM update_user_skill_state_v2(p_user_id, v_micro_skill_id, p_is_correct);

    -- Propagate to parent nodes
    PERFORM propagate_mastery_to_parents_v2(p_user_id, v_micro_skill_id);
  END IF;

  -- Update construct profiling
  PERFORM update_user_constructs_v2(p_user_id, p_question_id, p_is_correct);

  RAISE NOTICE 'Analytics processed for user % question %', p_user_id, p_question_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION process_attempt_analytics IS 'Master function to update all analytics after an attempt';

-- =====================================================
-- 2. UPDATE SKILL STATE (using existing table schema)
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_skill_state_v2(
  p_user_id UUID,
  p_micro_skill_id UUID,
  p_is_correct BOOLEAN
)
RETURNS VOID AS $$
DECLARE
  v_current_accuracy DECIMAL(5,2);
  v_current_attempt_count INTEGER;
  v_current_correct_count INTEGER;
  v_new_accuracy DECIMAL(5,2);
  v_new_correct_count INTEGER;
  v_new_attempt_count INTEGER;
BEGIN
  -- Get current state
  SELECT accuracy, attempt_count, correct_count
  INTO v_current_accuracy, v_current_attempt_count, v_current_correct_count
  FROM user_skill_state
  WHERE user_id = p_user_id AND micro_skill_id = p_micro_skill_id;

  -- If no existing record
  IF NOT FOUND THEN
    v_current_accuracy := 0;
    v_current_attempt_count := 0;
    v_current_correct_count := 0;
  END IF;

  -- Calculate new values
  v_new_attempt_count := v_current_attempt_count + 1;
  v_new_correct_count := v_current_correct_count + (CASE WHEN p_is_correct THEN 1 ELSE 0 END);
  v_new_accuracy := (v_new_correct_count::DECIMAL / v_new_attempt_count) * 100;

  -- Upsert
  INSERT INTO user_skill_state (
    user_id,
    micro_skill_id,
    accuracy,
    attempt_count,
    correct_count,
    last_attempted_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_micro_skill_id,
    v_new_accuracy,
    v_new_attempt_count,
    v_new_correct_count,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, micro_skill_id)
  DO UPDATE SET
    accuracy = EXCLUDED.accuracy,
    attempt_count = EXCLUDED.attempt_count,
    correct_count = EXCLUDED.correct_count,
    last_attempted_at = EXCLUDED.last_attempted_at,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_user_skill_state_v2 IS 'Update skill state using micro_skill_id';

-- =====================================================
-- 3. PROPAGATE MASTERY TO PARENT NODES
-- =====================================================

CREATE OR REPLACE FUNCTION propagate_mastery_to_parents_v2(
  p_user_id UUID,
  p_micro_skill_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_parent_id UUID;
  v_parent_accuracy DECIMAL(5,2);
  v_child_count INTEGER;
BEGIN
  -- Get parent node
  SELECT parent_id INTO v_parent_id
  FROM taxonomy_nodes
  WHERE id = p_micro_skill_id;

  -- If no parent, we're done
  IF v_parent_id IS NULL THEN
    RETURN;
  END IF;

  -- Calculate parent accuracy as average of children's accuracy
  SELECT
    COALESCE(AVG(uss.accuracy), 0),
    COUNT(*)
  INTO v_parent_accuracy, v_child_count
  FROM taxonomy_nodes tn
  LEFT JOIN user_skill_state uss
    ON uss.micro_skill_id = tn.id
    AND uss.user_id = p_user_id
  WHERE tn.parent_id = v_parent_id;

  -- Update parent's skill state (creating record if needed)
  IF v_parent_accuracy > 0 THEN
    INSERT INTO user_skill_state (
      user_id,
      micro_skill_id,
      accuracy,
      attempt_count,
      correct_count,
      updated_at
    )
    VALUES (
      p_user_id,
      v_parent_id,
      v_parent_accuracy,
      0, -- Parent doesn't have direct attempts
      0,
      NOW()
    )
    ON CONFLICT (user_id, micro_skill_id)
    DO UPDATE SET
      accuracy = EXCLUDED.accuracy,
      updated_at = NOW();

    -- Recursively propagate to grandparent
    PERFORM propagate_mastery_to_parents_v2(p_user_id, v_parent_id);
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION propagate_mastery_to_parents_v2 IS 'Recursively update parent nodes accuracy';

-- =====================================================
-- 4. UPDATE CONSTRUCT PROFILING
-- =====================================================

-- First ensure the table exists
CREATE TABLE IF NOT EXISTS user_construct_state (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  constructs JSONB NOT NULL DEFAULT '{}'::jsonb,
  sample_size INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id)
);

-- Enable RLS
ALTER TABLE user_construct_state ENABLE ROW LEVEL SECURITY;

-- Policies (drop first to avoid duplicates)
DROP POLICY IF EXISTS user_construct_state_own ON user_construct_state;
CREATE POLICY user_construct_state_own ON user_construct_state
  FOR ALL
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_construct_state_service ON user_construct_state;
CREATE POLICY user_construct_state_service ON user_construct_state
  FOR ALL
  USING (auth.role() = 'service_role');

-- Update constructs function
CREATE OR REPLACE FUNCTION update_user_constructs_v2(
  p_user_id UUID,
  p_question_id UUID,
  p_is_correct BOOLEAN
)
RETURNS VOID AS $$
DECLARE
  v_construct_weights JSONB;
  v_constructs JSONB;
  v_sample_size INTEGER;
  v_construct TEXT;
  v_weight FLOAT;
  v_current_score FLOAT;
  v_new_score FLOAT;
  v_impact FLOAT;
BEGIN
  -- Get construct_weights directly from question
  SELECT construct_weights INTO v_construct_weights
  FROM questions
  WHERE id = p_question_id;

  -- Return default weights if not found
  IF v_construct_weights IS NULL OR v_construct_weights = '{}'::jsonb THEN
    v_construct_weights := '{
      "C.ATTENTION": 0.2,
      "C.SPEED": 0.2,
      "C.REASONING": 0.2,
      "C.COMPUTATION": 0.2,
      "C.READING": 0.2
    }'::jsonb;
  END IF;

  -- Get or initialize user's construct state
  SELECT constructs, sample_size
  INTO v_constructs, v_sample_size
  FROM user_construct_state
  WHERE user_id = p_user_id;

  IF v_constructs IS NULL THEN
    v_constructs := '{
      "C.ATTENTION": 50,
      "C.SPEED": 50,
      "C.REASONING": 50,
      "C.COMPUTATION": 50,
      "C.READING": 50
    }'::jsonb;
    v_sample_size := 0;
  END IF;

  -- Update each construct based on performance
  FOR v_construct, v_weight IN
    SELECT * FROM jsonb_each_text(v_construct_weights)
  LOOP
    -- Get current score
    v_current_score := COALESCE((v_constructs->>v_construct)::FLOAT, 50.0);

    -- Calculate impact: +/- based on correctness, scaled by weight
    v_impact := CASE WHEN p_is_correct THEN 1.0 ELSE -1.0 END * v_weight::FLOAT * 10;

    -- Apply impact with learning rate decay
    v_new_score := v_current_score + (v_impact / (1 + v_sample_size * 0.1));

    -- Clamp to 0-100 range
    v_new_score := GREATEST(0, LEAST(100, v_new_score));

    -- Update construct in JSONB
    v_constructs := jsonb_set(v_constructs, ARRAY[v_construct], to_jsonb(v_new_score));
  END LOOP;

  -- Upsert user_construct_state
  INSERT INTO user_construct_state (
    user_id,
    constructs,
    sample_size,
    updated_at
  )
  VALUES (
    p_user_id,
    v_constructs,
    v_sample_size + 1,
    NOW()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    constructs = EXCLUDED.constructs,
    sample_size = EXCLUDED.sample_size,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_user_constructs_v2 IS 'Update construct profiling based on question performance';

-- =====================================================
-- 5. CREATE TRIGGER TO AUTO-PROCESS ANALYTICS
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_process_attempt_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Process analytics for this attempt
  PERFORM process_attempt_analytics(NEW.user_id, NEW.question_id, NEW.is_correct);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS attempt_analytics_trigger ON attempts;

-- Create trigger
CREATE TRIGGER attempt_analytics_trigger
AFTER INSERT ON attempts
FOR EACH ROW
EXECUTE FUNCTION trigger_process_attempt_analytics();

COMMENT ON TRIGGER attempt_analytics_trigger ON attempts IS 'Auto-process analytics after each attempt';

-- =====================================================
-- 6. UPDATE get_top_weak_skills TO USE micro_skill_id
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
      'node_id', uss.micro_skill_id,
      'name', tn.name,
      'code', tn.code,
      'level', tn.level,
      'mastery', ROUND((uss.accuracy / 100)::NUMERIC, 2),
      'attempt_count', uss.attempt_count
    )
    ORDER BY uss.accuracy ASC
  )
  INTO v_weak_skills
  FROM (
    SELECT *
    FROM user_skill_state
    WHERE user_id = p_user_id
    AND attempt_count >= 3 -- Only skills with sufficient data
    AND accuracy < 70 -- Below proficiency threshold
    ORDER BY accuracy ASC
    LIMIT p_limit
  ) uss
  INNER JOIN taxonomy_nodes tn ON tn.id = uss.micro_skill_id;

  RETURN COALESCE(v_weak_skills, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_top_weak_skills IS 'Get top N weakest skills using micro_skill_id';

-- =====================================================
-- 7. UPDATE get_user_readiness_score TO USE micro_skill_id
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_readiness_score(p_user_id UUID)
RETURNS FLOAT AS $$
DECLARE
  v_readiness FLOAT;
  v_construct_avg FLOAT;
  v_mastery_avg FLOAT;
  v_coverage_score FLOAT;
  v_skill_count INTEGER;
  v_total_skills INTEGER;
BEGIN
  -- Component 1: Average construct score (0-100)
  SELECT
    (
      COALESCE((constructs->>'C.ATTENTION')::FLOAT, 50) +
      COALESCE((constructs->>'C.SPEED')::FLOAT, 50) +
      COALESCE((constructs->>'C.REASONING')::FLOAT, 50) +
      COALESCE((constructs->>'C.COMPUTATION')::FLOAT, 50) +
      COALESCE((constructs->>'C.READING')::FLOAT, 50)
    ) / 5.0
  INTO v_construct_avg
  FROM user_construct_state
  WHERE user_id = p_user_id;

  v_construct_avg := COALESCE(v_construct_avg, 50.0);

  -- Component 2: Average accuracy across all skills (already 0-100)
  SELECT AVG(accuracy)
  INTO v_mastery_avg
  FROM user_skill_state
  WHERE user_id = p_user_id
  AND attempt_count >= 3;

  v_mastery_avg := COALESCE(v_mastery_avg, 50.0);

  -- Component 3: Coverage score (how many skills attempted)
  SELECT
    COUNT(CASE WHEN uss.attempt_count > 0 THEN 1 END),
    COUNT(*)
  INTO v_skill_count, v_total_skills
  FROM taxonomy_nodes tn
  LEFT JOIN user_skill_state uss
    ON uss.micro_skill_id = tn.id
    AND uss.user_id = p_user_id
  WHERE tn.level = 5;

  IF v_total_skills > 0 THEN
    v_coverage_score := (v_skill_count::FLOAT / v_total_skills) * 100;
  ELSE
    v_coverage_score := 0.0;
  END IF;

  -- Weighted combination
  v_readiness := (
    v_construct_avg * 0.4 +
    v_mastery_avg * 0.4 +
    v_coverage_score * 0.2
  );

  RETURN GREATEST(0.0, LEAST(100.0, v_readiness));
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_readiness_score IS 'Calculate overall readiness score using micro_skill_id';

-- =====================================================
-- 8. UPDATE calculate_coverage_map TO USE micro_skill_id
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
    -- Count total micro-skills (level 5) under this subject
    WITH RECURSIVE descendants AS (
      SELECT id FROM taxonomy_nodes WHERE id = v_subject.id
      UNION ALL
      SELECT tn.id FROM taxonomy_nodes tn
      INNER JOIN descendants d ON tn.parent_id = d.id
    )
    SELECT COUNT(*) INTO v_total_nodes
    FROM descendants d
    INNER JOIN taxonomy_nodes tn ON tn.id = d.id
    WHERE tn.level = 5;

    -- Count attempted micro-skills
    WITH RECURSIVE descendants AS (
      SELECT id FROM taxonomy_nodes WHERE id = v_subject.id
      UNION ALL
      SELECT tn.id FROM taxonomy_nodes tn
      INNER JOIN descendants d ON tn.parent_id = d.id
    )
    SELECT COUNT(DISTINCT uss.micro_skill_id) INTO v_attempted_nodes
    FROM user_skill_state uss
    WHERE uss.user_id = p_user_id
    AND uss.attempt_count > 0
    AND uss.micro_skill_id IN (SELECT id FROM descendants);

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

COMMENT ON FUNCTION calculate_coverage_map IS 'Calculate coverage per subject using micro_skill_id';

-- =====================================================
-- DONE
-- =====================================================

-- Summary:
-- 1. Created process_attempt_analytics using micro_skill_id
-- 2. Created trigger to auto-process analytics after each attempt
-- 3. Updated all analytics functions to use micro_skill_id column
-- Now analytics will update automatically when users answer questions!
