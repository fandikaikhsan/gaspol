-- Error Pattern Research Schema Extension
-- Stores error pattern profiling research from Batch 4 of exam research

-- =====================================================
-- 1. EXTEND EXAMS TABLE FOR ERROR PATTERN RESEARCH
-- =====================================================

ALTER TABLE exams
ADD COLUMN IF NOT EXISTS error_patterns JSONB DEFAULT '{}';

COMMENT ON COLUMN exams.error_patterns IS 'Error pattern research from Batch 4. Exam-specific error types, detection signals, and prevalence by content area';

-- Create index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_exams_error_patterns
ON exams USING gin(error_patterns);

-- =====================================================
-- 2. EXTEND TAGS TABLE FOR EXAM-SPECIFIC LINKING
-- =====================================================

-- Add exam_id to link error tags to specific exams
ALTER TABLE tags
ADD COLUMN IF NOT EXISTS exam_id UUID REFERENCES exams(id) ON DELETE SET NULL;

-- Add source tracking for research-generated tags
ALTER TABLE tags
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'research', 'ai'));

-- Add prevalence data
ALTER TABLE tags
ADD COLUMN IF NOT EXISTS prevalence JSONB DEFAULT '{}';

COMMENT ON COLUMN tags.exam_id IS 'For exam-specific error tags, links to the exam they apply to';
COMMENT ON COLUMN tags.source IS 'How the tag was created: manual, research (from Batch 4), or ai';
COMMENT ON COLUMN tags.prevalence IS 'Prevalence data per content area: { "TPS-PU": 0.15, "TPS-PK": 0.08 }';

CREATE INDEX IF NOT EXISTS idx_tags_exam ON tags(exam_id);
CREATE INDEX IF NOT EXISTS idx_tags_source ON tags(source);

-- =====================================================
-- 3. FUNCTION: APPLY ERROR PATTERNS TO TAGS
-- =====================================================

CREATE OR REPLACE FUNCTION apply_error_patterns_to_tags(p_exam_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_error_patterns JSONB;
  v_pattern RECORD;
  v_inserted_count INTEGER := 0;
  v_exam_type TEXT;
BEGIN
  -- Get error patterns and exam type
  SELECT error_patterns, exam_type INTO v_error_patterns, v_exam_type
  FROM exams
  WHERE id = p_exam_id;

  IF v_error_patterns IS NULL OR v_error_patterns = '{}'::jsonb THEN
    RAISE NOTICE 'No error patterns found for exam %', p_exam_id;
    RETURN 0;
  END IF;

  -- Process each error pattern from the research
  FOR v_pattern IN (
    SELECT
      key as error_code,
      value as pattern_data
    FROM jsonb_each(v_error_patterns->'patterns')
  )
  LOOP
    -- Insert or update tag with tips from remediation
    INSERT INTO tags (
      id,
      tag_type,
      category,
      name,
      description,
      detection_signals,
      exam_id,
      source,
      prevalence,
      tips,
      remediation,
      is_active
    ) VALUES (
      v_pattern.error_code,
      'error',
      COALESCE(v_pattern.pattern_data->>'category', 'exam_specific'),
      v_pattern.pattern_data->>'name',
      v_pattern.pattern_data->>'description',
      COALESCE(v_pattern.pattern_data->'detection_signals', '[]'::jsonb),
      p_exam_id,
      'research',
      COALESCE(v_pattern.pattern_data->'prevalence', '{}'::jsonb),
      -- Extract tips from remediation or create array from remediation string
      CASE
        WHEN v_pattern.pattern_data ? 'tips' THEN v_pattern.pattern_data->'tips'
        WHEN v_pattern.pattern_data ? 'remediation' THEN
          jsonb_build_array(v_pattern.pattern_data->>'remediation')
        ELSE '[]'::jsonb
      END,
      jsonb_build_object(
        'short', v_pattern.pattern_data->>'remediation',
        'detailed', v_pattern.pattern_data->>'description'
      ),
      true
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      detection_signals = EXCLUDED.detection_signals,
      exam_id = EXCLUDED.exam_id,
      source = 'research',
      prevalence = EXCLUDED.prevalence,
      tips = EXCLUDED.tips,
      remediation = EXCLUDED.remediation,
      updated_at = NOW();

    v_inserted_count := v_inserted_count + 1;
  END LOOP;

  RETURN v_inserted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION apply_error_patterns_to_tags IS 'Create/update error tags from Batch 4 research for an exam';

-- =====================================================
-- 4. VIEW: ERROR PATTERN STATUS
-- =====================================================

CREATE OR REPLACE VIEW exam_error_pattern_status AS
SELECT
  e.id,
  e.name,
  e.exam_type,
  e.year,
  CASE
    WHEN e.error_patterns IS NOT NULL AND e.error_patterns != '{}'::jsonb THEN true
    ELSE false
  END as has_error_patterns,
  jsonb_array_length(
    COALESCE(
      (SELECT jsonb_agg(key) FROM jsonb_each(e.error_patterns->'patterns')),
      '[]'::jsonb
    )
  ) as pattern_count,
  (SELECT COUNT(*) FROM tags WHERE exam_id = e.id AND tag_type = 'error') as tags_created,
  e.is_active
FROM exams e
ORDER BY e.created_at DESC;

COMMENT ON VIEW exam_error_pattern_status IS 'Shows error pattern research completeness for each exam';

-- =====================================================
-- 5. VIEW: ERROR TAGS BY EXAM
-- =====================================================

CREATE OR REPLACE VIEW error_tags_by_exam AS
SELECT
  t.id as tag_id,
  t.name,
  t.description,
  t.category,
  t.detection_signals,
  t.prevalence,
  t.source,
  e.id as exam_id,
  e.exam_type,
  e.year,
  t.usage_count,
  t.is_active
FROM tags t
LEFT JOIN exams e ON e.id = t.exam_id
WHERE t.tag_type = 'error'
ORDER BY e.exam_type, t.category, t.name;

COMMENT ON VIEW error_tags_by_exam IS 'Shows all error tags grouped by exam';

-- =====================================================
-- 6. FUNCTION: GET ERROR TAGS FOR EXAM
-- =====================================================

CREATE OR REPLACE FUNCTION get_error_tags_for_exam(p_exam_id UUID)
RETURNS TABLE (
  tag_id TEXT,
  name TEXT,
  description TEXT,
  category TEXT,
  detection_signals JSONB,
  prevalence JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.description,
    t.category,
    t.detection_signals,
    t.prevalence
  FROM tags t
  WHERE t.tag_type = 'error'
  AND (t.exam_id = p_exam_id OR t.exam_id IS NULL) -- Include global + exam-specific
  AND t.is_active = true
  ORDER BY t.category, t.name;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_error_tags_for_exam IS 'Get all applicable error tags for an exam (global + exam-specific)';

-- =====================================================
-- 7. UPDATE RESEARCH STATUS VIEW
-- =====================================================

DROP VIEW IF EXISTS exam_research_status;
CREATE VIEW exam_research_status AS
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
    WHEN e.error_patterns IS NOT NULL AND e.error_patterns != '{}'::jsonb THEN true
    ELSE false
  END as has_error_patterns,
  CASE
    WHEN e.structure_metadata IS NOT NULL AND e.structure_metadata != '{}'::jsonb
      AND e.construct_profile IS NOT NULL AND e.construct_profile != '{}'::jsonb
      AND e.error_patterns IS NOT NULL AND e.error_patterns != '{}'::jsonb
    THEN 'complete'
    WHEN e.structure_metadata IS NOT NULL AND e.structure_metadata != '{}'::jsonb
      AND e.construct_profile IS NOT NULL AND e.construct_profile != '{}'::jsonb
    THEN 'partial_no_errors'
    WHEN e.structure_metadata IS NOT NULL AND e.structure_metadata != '{}'::jsonb
    THEN 'partial_structure_only'
    ELSE 'none'
  END as research_status,
  e.is_active,
  e.created_at
FROM exams e
ORDER BY e.created_at DESC;

COMMENT ON VIEW exam_research_status IS 'Shows research completeness for each exam (Batches 1-4)';

-- =====================================================
-- 8. UPDATE STATISTICS FUNCTION
-- =====================================================

DROP FUNCTION IF EXISTS get_research_statistics();
CREATE FUNCTION get_research_statistics()
RETURNS TABLE (
  total_exams INTEGER,
  exams_with_structure INTEGER,
  exams_with_constructs INTEGER,
  exams_with_error_patterns INTEGER,
  total_taxonomy_nodes INTEGER,
  nodes_with_weights INTEGER,
  nodes_with_time INTEGER,
  total_error_tags INTEGER,
  research_error_tags INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_exams,
    COUNT(CASE WHEN has_structure THEN 1 END)::INTEGER as exams_with_structure,
    COUNT(CASE WHEN has_constructs THEN 1 END)::INTEGER as exams_with_constructs,
    COUNT(CASE WHEN has_error_patterns THEN 1 END)::INTEGER as exams_with_error_patterns,
    (SELECT COUNT(*)::INTEGER FROM taxonomy_nodes WHERE is_active = true) as total_taxonomy_nodes,
    (SELECT COUNT(*)::INTEGER FROM taxonomy_nodes WHERE default_construct_weights != '{}'::jsonb AND is_active = true) as nodes_with_weights,
    (SELECT COUNT(*)::INTEGER FROM taxonomy_nodes WHERE expected_time_sec > 0 AND is_active = true) as nodes_with_time,
    (SELECT COUNT(*)::INTEGER FROM tags WHERE tag_type = 'error' AND is_active = true) as total_error_tags,
    (SELECT COUNT(*)::INTEGER FROM tags WHERE tag_type = 'error' AND source = 'research' AND is_active = true) as research_error_tags
  FROM exam_research_status;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_research_statistics IS 'Get summary statistics of research data completeness including error patterns';
