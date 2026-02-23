-- Metadata Suggestion Helper Functions
-- Support for AI-powered metadata suggestions

-- =====================================================
-- 1. APPLY METADATA SUGGESTION TO QUESTION
-- =====================================================

CREATE OR REPLACE FUNCTION apply_metadata_suggestion(
  p_question_id UUID,
  p_construct_weights JSONB,
  p_time_estimate_seconds INTEGER,
  p_cognitive_level TEXT DEFAULT NULL,
  p_difficulty TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Validate inputs
  IF p_construct_weights IS NULL THEN
    RAISE EXCEPTION 'construct_weights cannot be null';
  END IF;

  IF p_time_estimate_seconds IS NULL OR p_time_estimate_seconds <= 0 THEN
    RAISE EXCEPTION 'time_estimate_seconds must be positive';
  END IF;

  -- Update question metadata
  UPDATE questions
  SET
    construct_weights = p_construct_weights,
    time_estimate_seconds = p_time_estimate_seconds,
    cognitive_level = COALESCE(p_cognitive_level, cognitive_level),
    difficulty = COALESCE(p_difficulty, difficulty),
    updated_at = NOW()
  WHERE id = p_question_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Question % not found', p_question_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION apply_metadata_suggestion IS 'Apply AI-suggested metadata to a question after admin review';

-- =====================================================
-- 2. BULK APPLY DEFAULTS FROM RESEARCH
-- =====================================================

CREATE OR REPLACE FUNCTION bulk_apply_research_defaults(
  p_exam_id UUID DEFAULT NULL,
  p_overwrite_existing BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  updated_count INTEGER,
  skipped_count INTEGER,
  error_count INTEGER
) AS $$
DECLARE
  v_question RECORD;
  v_updated INTEGER := 0;
  v_skipped INTEGER := 0;
  v_errors INTEGER := 0;
  v_taxonomy_node RECORD;
  v_construct_weights JSONB;
  v_time_estimate INTEGER;
BEGIN
  -- Loop through questions
  FOR v_question IN (
    SELECT DISTINCT q.id, q.construct_weights, q.time_estimate_seconds
    FROM questions q
    INNER JOIN question_taxonomy qt ON qt.question_id = q.id
    INNER JOIN taxonomy_nodes tn ON tn.id = qt.taxonomy_node_id
    WHERE q.is_active = true
    AND (p_exam_id IS NULL OR tn.exam_id = p_exam_id)
  )
  LOOP
    -- Skip if already has metadata and not overwriting
    IF NOT p_overwrite_existing
       AND v_question.construct_weights IS NOT NULL
       AND v_question.construct_weights != '{}'::jsonb
       AND v_question.time_estimate_seconds IS NOT NULL
    THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    BEGIN
      -- Get first taxonomy node for this question
      SELECT tn.default_construct_weights, tn.expected_time_sec
      INTO v_taxonomy_node
      FROM question_taxonomy qt
      INNER JOIN taxonomy_nodes tn ON tn.id = qt.taxonomy_node_id
      WHERE qt.question_id = v_question.id
      AND tn.default_construct_weights IS NOT NULL
      AND tn.default_construct_weights != '{}'::jsonb
      LIMIT 1;

      IF FOUND THEN
        v_construct_weights := v_taxonomy_node.default_construct_weights;
        v_time_estimate := COALESCE(v_taxonomy_node.expected_time_sec, 120);

        -- Apply to question
        UPDATE questions
        SET
          construct_weights = v_construct_weights,
          time_estimate_seconds = v_time_estimate,
          updated_at = NOW()
        WHERE id = v_question.id;

        v_updated := v_updated + 1;
      ELSE
        v_skipped := v_skipped + 1;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors + 1;
      RAISE NOTICE 'Error updating question %: %', v_question.id, SQLERRM;
    END;
  END LOOP;

  RETURN QUERY SELECT v_updated, v_skipped, v_errors;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION bulk_apply_research_defaults IS 'Bulk apply research-based defaults to questions. Set overwrite to true to update existing metadata.';

-- =====================================================
-- 3. VIEW: METADATA COMPLETENESS STATUS
-- =====================================================

CREATE OR REPLACE VIEW question_metadata_completeness AS
SELECT
  q.id,
  q.question_text,
  q.question_type,
  q.difficulty,
  q.cognitive_level,
  CASE
    WHEN q.construct_weights IS NOT NULL
      AND q.construct_weights != '{}'::jsonb
    THEN true
    ELSE false
  END as has_construct_weights,
  CASE
    WHEN q.time_estimate_seconds IS NOT NULL
      AND q.time_estimate_seconds > 0
    THEN true
    ELSE false
  END as has_time_estimate,
  CASE
    WHEN q.cognitive_level IS NOT NULL
    THEN true
    ELSE false
  END as has_cognitive_level,
  CASE
    WHEN q.difficulty IS NOT NULL
    THEN true
    ELSE false
  END as has_difficulty,
  CASE
    WHEN q.construct_weights IS NOT NULL
      AND q.construct_weights != '{}'::jsonb
      AND q.time_estimate_seconds IS NOT NULL
      AND q.time_estimate_seconds > 0
      AND q.cognitive_level IS NOT NULL
      AND q.difficulty IS NOT NULL
    THEN 'complete'
    WHEN q.construct_weights IS NOT NULL
      AND q.construct_weights != '{}'::jsonb
    THEN 'partial'
    ELSE 'missing'
  END as completeness_status,
  -- Check if research data is available
  EXISTS (
    SELECT 1
    FROM question_taxonomy qt
    INNER JOIN taxonomy_nodes tn ON tn.id = qt.taxonomy_node_id
    WHERE qt.question_id = q.id
    AND tn.default_construct_weights IS NOT NULL
    AND tn.default_construct_weights != '{}'::jsonb
  ) as research_available,
  q.is_active,
  q.created_at,
  q.updated_at
FROM questions q
ORDER BY q.created_at DESC;

COMMENT ON VIEW question_metadata_completeness IS 'Shows metadata completeness status and whether research data is available for suggestions';

-- =====================================================
-- 4. STATISTICS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_metadata_completeness_stats()
RETURNS TABLE (
  total_questions INTEGER,
  complete_metadata INTEGER,
  partial_metadata INTEGER,
  missing_metadata INTEGER,
  research_available INTEGER,
  completion_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_questions,
    COUNT(CASE WHEN completeness_status = 'complete' THEN 1 END)::INTEGER as complete_metadata,
    COUNT(CASE WHEN completeness_status = 'partial' THEN 1 END)::INTEGER as partial_metadata,
    COUNT(CASE WHEN completeness_status = 'missing' THEN 1 END)::INTEGER as missing_metadata,
    COUNT(CASE WHEN research_available = true THEN 1 END)::INTEGER as research_available,
    ROUND(
      COUNT(CASE WHEN completeness_status = 'complete' THEN 1 END)::NUMERIC /
      NULLIF(COUNT(*)::NUMERIC, 0) * 100,
      1
    ) as completion_percentage
  FROM question_metadata_completeness
  WHERE is_active = true;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_metadata_completeness_stats IS 'Get summary statistics of metadata completeness across all questions';
