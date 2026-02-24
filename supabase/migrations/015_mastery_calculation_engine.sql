-- Mastery Calculation Engine
-- Implements weighted mastery formulas with recency bias
-- Updates skill state and construct profiling after each attempt

-- =====================================================
-- 1. CALCULATE MASTERY FOR A TAXONOMY NODE
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_mastery_score(
  p_user_id UUID,
  p_taxonomy_node_id UUID,
  p_max_attempts INTEGER DEFAULT 20
)
RETURNS FLOAT AS $$
DECLARE
  v_mastery FLOAT := 0.0;
  v_attempt_count INTEGER;
  v_weighted_sum FLOAT := 0.0;
  v_weight_total FLOAT := 0.0;
  v_weight FLOAT;
  v_attempt RECORD;
BEGIN
  -- Get recent attempts for questions linked to this taxonomy node
  FOR v_attempt IN (
    SELECT
      a.is_correct,
      a.attempted_at,
      ROW_NUMBER() OVER (ORDER BY a.attempted_at DESC) as recency_rank
    FROM attempts a
    INNER JOIN question_taxonomy qt ON a.question_id = qt.question_id
    WHERE a.user_id = p_user_id
    AND qt.taxonomy_node_id = p_taxonomy_node_id
    ORDER BY a.attempted_at DESC
    LIMIT p_max_attempts
  )
  LOOP
    -- Recency weight: exponential decay
    -- Most recent attempt has weight 1.0, older attempts decay exponentially
    v_weight := POWER(0.85, v_attempt.recency_rank - 1);

    -- Add to weighted sum
    v_weighted_sum := v_weighted_sum + (CASE WHEN v_attempt.is_correct THEN 1.0 ELSE 0.0 END) * v_weight;
    v_weight_total := v_weight_total + v_weight;
  END LOOP;

  -- Calculate weighted average
  IF v_weight_total > 0 THEN
    v_mastery := v_weighted_sum / v_weight_total;
  ELSE
    v_mastery := 0.0;
  END IF;

  -- Apply confidence adjustment based on sample size
  GET DIAGNOSTICS v_attempt_count = ROW_COUNT;

  IF v_attempt_count < 3 THEN
    -- Low confidence penalty: pull towards 0.5
    v_mastery := v_mastery * 0.7 + 0.5 * 0.3;
  ELSIF v_attempt_count < 5 THEN
    v_mastery := v_mastery * 0.85 + 0.5 * 0.15;
  END IF;

  RETURN GREATEST(0.0, LEAST(1.0, v_mastery));
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_mastery_score IS 'Calculate weighted mastery score with recency bias and confidence adjustment';

-- =====================================================
-- 2. CALCULATE STABILITY (CONSISTENCY)
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_stability(
  p_user_id UUID,
  p_taxonomy_node_id UUID,
  p_max_attempts INTEGER DEFAULT 10
)
RETURNS FLOAT AS $$
DECLARE
  v_results INTEGER[];
  v_variance FLOAT := 0.0;
  v_mean FLOAT;
  v_stability FLOAT := 1.0;
  v_count INTEGER;
  v_diff FLOAT;
  v_result INTEGER;
BEGIN
  -- Get recent correctness results (1 or 0)
  SELECT ARRAY_AGG(CASE WHEN is_correct THEN 1 ELSE 0 END ORDER BY attempted_at DESC)
  INTO v_results
  FROM (
    SELECT a.is_correct, a.attempted_at
    FROM attempts a
    INNER JOIN question_taxonomy qt ON a.question_id = qt.question_id
    WHERE a.user_id = p_user_id
    AND qt.taxonomy_node_id = p_taxonomy_node_id
    ORDER BY a.attempted_at DESC
    LIMIT p_max_attempts
  ) recent;

  v_count := COALESCE(array_length(v_results, 1), 0);

  IF v_count < 3 THEN
    -- Not enough data for stability calculation
    RETURN 0.5;
  END IF;

  -- Calculate mean
  v_mean := 0.0;
  FOREACH v_result IN ARRAY v_results
  LOOP
    v_mean := v_mean + v_result;
  END LOOP;
  v_mean := v_mean / v_count;

  -- Calculate variance
  FOREACH v_result IN ARRAY v_results
  LOOP
    v_diff := v_result - v_mean;
    v_variance := v_variance + (v_diff * v_diff);
  END LOOP;
  v_variance := v_variance / v_count;

  -- Convert variance to stability (inverse relationship)
  -- Low variance = high stability
  v_stability := 1.0 - LEAST(v_variance * 2, 1.0);

  RETURN GREATEST(0.0, LEAST(1.0, v_stability));
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_stability IS 'Calculate performance consistency (low variance = high stability)';

-- =====================================================
-- 3. UPDATE USER SKILL STATE
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_skill_state(
  p_user_id UUID,
  p_taxonomy_node_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_mastery FLOAT;
  v_stability FLOAT;
  v_attempt_count INTEGER;
  v_correct_count INTEGER;
  v_avg_time FLOAT;
BEGIN
  -- Calculate mastery score
  v_mastery := calculate_mastery_score(p_user_id, p_taxonomy_node_id);

  -- Calculate stability
  v_stability := calculate_stability(p_user_id, p_taxonomy_node_id);

  -- Get attempt statistics
  SELECT
    COUNT(*),
    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END),
    AVG(time_spent_sec)
  INTO v_attempt_count, v_correct_count, v_avg_time
  FROM attempts a
  INNER JOIN question_taxonomy qt ON a.question_id = qt.question_id
  WHERE a.user_id = p_user_id
  AND qt.taxonomy_node_id = p_taxonomy_node_id;

  -- Upsert user_skill_state
  INSERT INTO user_skill_state (
    user_id,
    taxonomy_node_id,
    mastery,
    stability,
    speed_percentile,
    attempt_count,
    correct_count,
    last_attempt_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_taxonomy_node_id,
    v_mastery,
    v_stability,
    NULL, -- Will calculate percentile separately
    v_attempt_count,
    v_correct_count,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, taxonomy_node_id)
  DO UPDATE SET
    mastery = EXCLUDED.mastery,
    stability = EXCLUDED.stability,
    attempt_count = EXCLUDED.attempt_count,
    correct_count = EXCLUDED.correct_count,
    last_attempt_at = EXCLUDED.last_attempt_at,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_user_skill_state IS 'Update skill state after new attempt with calculated mastery and stability';

-- =====================================================
-- 4. PROPAGATE MASTERY TO PARENT NODES
-- =====================================================

CREATE OR REPLACE FUNCTION propagate_mastery_to_parents(
  p_user_id UUID,
  p_taxonomy_node_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_parent_id UUID;
  v_parent_mastery FLOAT;
  v_child_count INTEGER;
BEGIN
  -- Get parent node
  SELECT parent_id INTO v_parent_id
  FROM taxonomy_nodes
  WHERE id = p_taxonomy_node_id;

  -- If no parent, we're at the root
  IF v_parent_id IS NULL THEN
    RETURN;
  END IF;

  -- Calculate parent mastery as average of children's mastery
  SELECT
    AVG(uss.mastery),
    COUNT(*)
  INTO v_parent_mastery, v_child_count
  FROM taxonomy_nodes tn
  LEFT JOIN user_skill_state uss
    ON uss.taxonomy_node_id = tn.id
    AND uss.user_id = p_user_id
  WHERE tn.parent_id = v_parent_id;

  -- Update parent's skill state
  IF v_parent_mastery IS NOT NULL THEN
    INSERT INTO user_skill_state (
      user_id,
      taxonomy_node_id,
      mastery,
      attempt_count,
      correct_count,
      updated_at
    )
    VALUES (
      p_user_id,
      v_parent_id,
      v_parent_mastery,
      0, -- Parent doesn't have direct attempts
      0,
      NOW()
    )
    ON CONFLICT (user_id, taxonomy_node_id)
    DO UPDATE SET
      mastery = EXCLUDED.mastery,
      updated_at = NOW();

    -- Recursively propagate to grandparent
    PERFORM propagate_mastery_to_parents(p_user_id, v_parent_id);
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION propagate_mastery_to_parents IS 'Recursively update parent nodes mastery as average of children';

-- =====================================================
-- 5. UPDATE CONSTRUCT PROFILING
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_constructs(
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
  -- Get question's construct weights (with inheritance)
  v_construct_weights := get_question_construct_weights(p_question_id);

  -- Get or initialize user's construct state
  SELECT constructs, sample_size
  INTO v_constructs, v_sample_size
  FROM user_construct_state
  WHERE user_id = p_user_id;

  IF v_constructs IS NULL THEN
    -- Initialize with default scores (50 = neutral)
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
    -- Early attempts have more impact, later attempts have less
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

COMMENT ON FUNCTION update_user_constructs IS 'Update construct profiling based on question performance with construct weights';

-- =====================================================
-- 6. MASTER UPDATE FUNCTION (Called after each attempt)
-- =====================================================

CREATE OR REPLACE FUNCTION process_attempt_analytics(
  p_user_id UUID,
  p_question_id UUID,
  p_is_correct BOOLEAN
)
RETURNS VOID AS $$
DECLARE
  v_taxonomy_node_id UUID;
BEGIN
  -- Get taxonomy node for this question
  SELECT taxonomy_node_id INTO v_taxonomy_node_id
  FROM question_taxonomy
  WHERE question_id = p_question_id
  LIMIT 1;

  IF v_taxonomy_node_id IS NULL THEN
    -- Question not linked to taxonomy, skip mastery update
    RAISE NOTICE 'Question % not linked to taxonomy, skipping mastery update', p_question_id;
  ELSE
    -- Update skill state at this node
    PERFORM update_user_skill_state(p_user_id, v_taxonomy_node_id);

    -- Propagate to parent nodes
    PERFORM propagate_mastery_to_parents(p_user_id, v_taxonomy_node_id);
  END IF;

  -- Update construct profiling (always run)
  PERFORM update_user_constructs(p_user_id, p_question_id, p_is_correct);

  RAISE NOTICE 'Analytics processed for user % question %', p_user_id, p_question_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION process_attempt_analytics IS 'Master function to update all analytics after an attempt: skill state, parent nodes, and constructs';

-- =====================================================
-- 7. HELPER: GET USER READINESS SCORE
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

  -- Component 2: Average mastery across all skills (0-100 scale)
  SELECT AVG(mastery) * 100
  INTO v_mastery_avg
  FROM user_skill_state
  WHERE user_id = p_user_id
  AND attempt_count >= 3; -- Only count skills with sufficient data

  v_mastery_avg := COALESCE(v_mastery_avg, 50.0);

  -- Component 3: Coverage score (how many skills attempted)
  SELECT
    COUNT(CASE WHEN attempt_count > 0 THEN 1 END),
    COUNT(*)
  INTO v_skill_count, v_total_skills
  FROM taxonomy_nodes tn
  LEFT JOIN user_skill_state uss
    ON uss.taxonomy_node_id = tn.id
    AND uss.user_id = p_user_id
  WHERE tn.level = 5; -- Count only micro-skills (leaf nodes)

  IF v_total_skills > 0 THEN
    v_coverage_score := (v_skill_count::FLOAT / v_total_skills) * 100;
  ELSE
    v_coverage_score := 0.0;
  END IF;

  -- Weighted combination
  v_readiness := (
    v_construct_avg * 0.4 +    -- 40% constructs
    v_mastery_avg * 0.4 +      -- 40% mastery
    v_coverage_score * 0.2     -- 20% coverage
  );

  RETURN GREATEST(0.0, LEAST(100.0, v_readiness));
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_readiness_score IS 'Calculate overall readiness score (0-100) from constructs, mastery, and coverage';
