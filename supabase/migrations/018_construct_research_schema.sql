-- Construct Research Schema Extension
-- Stores construct profiling research from Batch 3 of exam research

-- =====================================================
-- 1. EXTEND EXAMS TABLE FOR CONSTRUCT RESEARCH
-- =====================================================

ALTER TABLE exams
ADD COLUMN IF NOT EXISTS construct_profile JSONB DEFAULT '{}';

COMMENT ON COLUMN exams.construct_profile IS 'Construct profiling research from Batch 3. Per taxonomy node: constructs, cognitive levels, time expectations, difficulty distribution';

-- Create index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_exams_construct_profile
ON exams USING gin(construct_profile);

-- =====================================================
-- 2. HELPER FUNCTION: GET RESEARCH PROFILE FOR NODE
-- =====================================================

CREATE OR REPLACE FUNCTION get_research_profile_for_node(
  p_exam_id UUID,
  p_taxonomy_node_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_node RECORD;
  v_construct_profile JSONB;
  v_result JSONB;
BEGIN
  -- Get taxonomy node details
  SELECT id, name, code, level
  INTO v_node
  FROM taxonomy_nodes
  WHERE id = p_taxonomy_node_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Get construct profile from exam
  SELECT construct_profile INTO v_construct_profile
  FROM exams
  WHERE id = p_exam_id;

  IF v_construct_profile IS NULL OR v_construct_profile = '{}'::jsonb THEN
    RETURN NULL;
  END IF;

  -- Try to find by code in the research data
  -- Check in order: exact code match, parent lookups
  v_result := v_construct_profile->v_node.code;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_research_profile_for_node IS 'Fetch construct research profile for a taxonomy node from exam research';

-- =====================================================
-- 3. HELPER FUNCTION: APPLY RESEARCH TO TAXONOMY
-- =====================================================

CREATE OR REPLACE FUNCTION apply_research_to_taxonomy(p_exam_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_construct_profile JSONB;
  v_updated_count INTEGER := 0;
  v_node RECORD;
  v_profile JSONB;
  v_constructs JSONB;
  v_time INTEGER;
BEGIN
  -- Get construct profile
  SELECT construct_profile INTO v_construct_profile
  FROM exams
  WHERE id = p_exam_id;

  IF v_construct_profile IS NULL OR v_construct_profile = '{}'::jsonb THEN
    RAISE NOTICE 'No construct profile found for exam %', p_exam_id;
    RETURN 0;
  END IF;

  -- Update each taxonomy node linked to this exam
  FOR v_node IN (
    SELECT id, code
    FROM taxonomy_nodes
    WHERE exam_id = p_exam_id
    AND is_active = true
  )
  LOOP
    -- Get profile for this node
    v_profile := v_construct_profile->v_node.code;

    IF v_profile IS NOT NULL THEN
      -- Extract constructs and time
      v_constructs := v_profile->'constructs';
      v_time := COALESCE((v_profile->'time_expectations'->>'average')::INTEGER, 120);

      -- Convert construct percentages to decimals if needed
      IF v_constructs IS NOT NULL THEN
        -- Update node
        UPDATE taxonomy_nodes
        SET
          default_construct_weights = v_constructs,
          expected_time_sec = v_time,
          updated_at = NOW()
        WHERE id = v_node.id;

        v_updated_count := v_updated_count + 1;
      END IF;
    END IF;
  END LOOP;

  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION apply_research_to_taxonomy IS 'Apply construct research to taxonomy nodes for an exam';

-- =====================================================
-- 4. VIEW: RESEARCH STATUS
-- =====================================================

CREATE OR REPLACE VIEW exam_research_status AS
SELECT
  e.id,
  e.name,
  e.exam_type,
  e.year,
  CASE
    WHEN e.structure_metadata IS NOT NULL AND e.structure_metadata != '{}'::jsonb THEN true
    ELSE false
  END as has_structure,
  CASE
    WHEN e.construct_profile IS NOT NULL AND e.construct_profile != '{}'::jsonb THEN true
    ELSE false
  END as has_constructs,
  CASE
    WHEN e.structure_metadata IS NOT NULL AND e.structure_metadata != '{}'::jsonb
      AND e.construct_profile IS NOT NULL AND e.construct_profile != '{}'::jsonb
    THEN 'complete'
    WHEN e.structure_metadata IS NOT NULL AND e.structure_metadata != '{}'::jsonb
    THEN 'partial'
    ELSE 'none'
  END as research_status,
  e.is_active,
  e.created_at
FROM exams e
ORDER BY e.created_at DESC;

COMMENT ON VIEW exam_research_status IS 'Shows research completeness for each exam';

-- =====================================================
-- 5. VIEW: TAXONOMY RESEARCH STATUS
-- =====================================================

CREATE OR REPLACE VIEW taxonomy_research_status AS
SELECT
  tn.id,
  tn.name,
  tn.code,
  tn.level,
  tn.exam_id,
  e.exam_type,
  CASE
    WHEN tn.default_construct_weights IS NOT NULL
      AND tn.default_construct_weights != '{}'::jsonb
    THEN true
    ELSE false
  END as has_construct_weights,
  CASE
    WHEN tn.expected_time_sec IS NOT NULL
      AND tn.expected_time_sec > 0
    THEN true
    ELSE false
  END as has_time_estimate,
  tn.default_construct_weights,
  tn.expected_time_sec,
  tn.is_active
FROM taxonomy_nodes tn
LEFT JOIN exams e ON e.id = tn.exam_id
ORDER BY tn.level, tn.code;

COMMENT ON VIEW taxonomy_research_status IS 'Shows which taxonomy nodes have research-based defaults';

-- =====================================================
-- 6. STATISTICS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_research_statistics()
RETURNS TABLE (
  total_exams INTEGER,
  exams_with_structure INTEGER,
  exams_with_constructs INTEGER,
  total_taxonomy_nodes INTEGER,
  nodes_with_weights INTEGER,
  nodes_with_time INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_exams,
    COUNT(CASE WHEN has_structure THEN 1 END)::INTEGER as exams_with_structure,
    COUNT(CASE WHEN has_constructs THEN 1 END)::INTEGER as exams_with_constructs,
    (SELECT COUNT(*)::INTEGER FROM taxonomy_nodes WHERE is_active = true) as total_taxonomy_nodes,
    (SELECT COUNT(*)::INTEGER FROM taxonomy_nodes WHERE default_construct_weights != '{}'::jsonb AND is_active = true) as nodes_with_weights,
    (SELECT COUNT(*)::INTEGER FROM taxonomy_nodes WHERE expected_time_sec > 0 AND is_active = true) as nodes_with_time
  FROM exam_research_status;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_research_statistics IS 'Get summary statistics of research data completeness';
