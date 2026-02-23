-- Adaptive Constructs Schema
-- Makes constructs exam-specific instead of hardcoded
-- Supports pivoting to ANY exam type

-- =====================================================
-- 1. CREATE EXAM_CONSTRUCTS TABLE
-- =====================================================
-- Stores the cognitive constructs that apply to each exam
-- Different exams can have different constructs

CREATE TABLE IF NOT EXISTS exam_constructs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,

  -- Construct identity
  code TEXT NOT NULL, -- e.g., 'C.ATTENTION', 'C.SPEED'
  name TEXT NOT NULL, -- Display name: 'Attention & Accuracy'
  short_name TEXT, -- Short name for UI: 'Teliti'

  -- Description and help
  description TEXT, -- What this construct measures
  icon TEXT, -- Emoji or icon name
  color TEXT, -- CSS color class

  -- Tips for improvement (from research)
  improvement_tips JSONB DEFAULT '[]', -- ["Tip 1", "Tip 2"]

  -- Ordering
  display_order INTEGER DEFAULT 0,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(exam_id, code)
);

CREATE INDEX IF NOT EXISTS idx_exam_constructs_exam ON exam_constructs(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_constructs_code ON exam_constructs(code);

COMMENT ON TABLE exam_constructs IS 'Exam-specific cognitive constructs. Different exams can have different construct profiles.';

-- =====================================================
-- 2. EXTEND TAGS TABLE WITH REMEDIATION
-- =====================================================

ALTER TABLE tags
ADD COLUMN IF NOT EXISTS remediation JSONB DEFAULT '{}';

ALTER TABLE tags
ADD COLUMN IF NOT EXISTS tips JSONB DEFAULT '[]';

COMMENT ON COLUMN tags.remediation IS 'Remediation strategies from research: { "short": "Brief tip", "detailed": "Full explanation" }';
COMMENT ON COLUMN tags.tips IS 'Actionable improvement tips: ["Tip 1", "Tip 2", "Tip 3"]';

-- =====================================================
-- 3. FUNCTION: APPLY CONSTRUCTS FROM RESEARCH
-- =====================================================

CREATE OR REPLACE FUNCTION apply_constructs_from_research(p_exam_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_construct_profile JSONB;
  v_node RECORD;
  v_constructs JSONB;
  v_code TEXT;
  v_inserted_count INTEGER := 0;
BEGIN
  -- Get construct profile from exam
  SELECT construct_profile INTO v_construct_profile
  FROM exams
  WHERE id = p_exam_id;

  IF v_construct_profile IS NULL OR v_construct_profile = '{}'::jsonb THEN
    RETURN 0;
  END IF;

  -- Extract unique constructs from all taxonomy nodes
  FOR v_node IN (
    SELECT DISTINCT key as node_code, value as profile
    FROM jsonb_each(v_construct_profile)
  )
  LOOP
    v_constructs := v_node.profile->'constructs';

    IF v_constructs IS NOT NULL THEN
      -- Insert each construct
      FOR v_code IN (SELECT jsonb_object_keys(v_constructs))
      LOOP
        INSERT INTO exam_constructs (exam_id, code, name, short_name, description, display_order)
        VALUES (
          p_exam_id,
          v_code,
          CASE v_code
            WHEN 'C.ATTENTION' THEN 'Attention & Accuracy'
            WHEN 'C.SPEED' THEN 'Speed & Efficiency'
            WHEN 'C.REASONING' THEN 'Logical Reasoning'
            WHEN 'C.COMPUTATION' THEN 'Computation'
            WHEN 'C.READING' THEN 'Reading Comprehension'
            ELSE v_code
          END,
          CASE v_code
            WHEN 'C.ATTENTION' THEN 'Teliti'
            WHEN 'C.SPEED' THEN 'Speed'
            WHEN 'C.REASONING' THEN 'Reasoning'
            WHEN 'C.COMPUTATION' THEN 'Computation'
            WHEN 'C.READING' THEN 'Reading'
            ELSE v_code
          END,
          CASE v_code
            WHEN 'C.ATTENTION' THEN 'Focus, detail orientation, avoiding careless errors'
            WHEN 'C.SPEED' THEN 'Working under time pressure, rapid processing'
            WHEN 'C.REASONING' THEN 'Problem-solving, critical thinking, analysis'
            WHEN 'C.COMPUTATION' THEN 'Mathematical operations, numerical work'
            WHEN 'C.READING' THEN 'Text understanding, information extraction'
            ELSE 'Cognitive construct'
          END,
          CASE v_code
            WHEN 'C.ATTENTION' THEN 1
            WHEN 'C.SPEED' THEN 2
            WHEN 'C.REASONING' THEN 3
            WHEN 'C.COMPUTATION' THEN 4
            WHEN 'C.READING' THEN 5
            ELSE 10
          END
        )
        ON CONFLICT (exam_id, code) DO UPDATE SET
          name = EXCLUDED.name,
          short_name = EXCLUDED.short_name,
          description = EXCLUDED.description,
          updated_at = NOW();

        v_inserted_count := v_inserted_count + 1;
      END LOOP;
    END IF;
  END LOOP;

  RETURN v_inserted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. FUNCTION: GET CONSTRUCTS FOR EXAM
-- =====================================================

CREATE OR REPLACE FUNCTION get_exam_constructs(p_exam_id UUID)
RETURNS TABLE (
  code TEXT,
  name TEXT,
  short_name TEXT,
  description TEXT,
  icon TEXT,
  color TEXT,
  improvement_tips JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ec.code,
    ec.name,
    ec.short_name,
    ec.description,
    ec.icon,
    ec.color,
    ec.improvement_tips
  FROM exam_constructs ec
  WHERE ec.exam_id = p_exam_id
  AND ec.is_active = true
  ORDER BY ec.display_order;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 5. FUNCTION: GET ERROR TAG WITH METADATA
-- =====================================================

CREATE OR REPLACE FUNCTION get_error_tag_with_metadata(p_tag_id TEXT)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  description TEXT,
  category TEXT,
  tips JSONB,
  remediation JSONB,
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
    COALESCE(t.tips, '[]'::jsonb),
    COALESCE(t.remediation, '{}'::jsonb),
    COALESCE(t.detection_signals, '[]'::jsonb),
    COALESCE(t.prevalence, '{}'::jsonb)
  FROM tags t
  WHERE t.id = p_tag_id
  AND t.is_active = true;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 6. VIEW: EXAM CONFIGURATION STATUS
-- =====================================================

CREATE OR REPLACE VIEW exam_configuration_status AS
SELECT
  e.id,
  e.name,
  e.exam_type,
  e.year,
  (SELECT COUNT(*) FROM exam_constructs WHERE exam_id = e.id AND is_active = true) as construct_count,
  (SELECT COUNT(*) FROM tags WHERE exam_id = e.id AND tag_type = 'error' AND is_active = true) as error_tag_count,
  (SELECT COUNT(*) FROM taxonomy_nodes WHERE exam_id = e.id AND is_active = true) as taxonomy_node_count,
  CASE
    WHEN e.structure_metadata IS NOT NULL AND e.structure_metadata != '{}'::jsonb
      AND e.construct_profile IS NOT NULL AND e.construct_profile != '{}'::jsonb
      AND e.error_patterns IS NOT NULL AND e.error_patterns != '{}'::jsonb
      AND EXISTS (SELECT 1 FROM exam_constructs WHERE exam_id = e.id)
      AND EXISTS (SELECT 1 FROM tags WHERE exam_id = e.id AND tag_type = 'error')
    THEN 'ready'
    ELSE 'incomplete'
  END as configuration_status,
  e.is_active
FROM exams e
ORDER BY e.created_at DESC;

COMMENT ON VIEW exam_configuration_status IS 'Shows complete exam setup status including constructs and error tags';

-- =====================================================
-- 7. RLS POLICIES
-- =====================================================

ALTER TABLE exam_constructs ENABLE ROW LEVEL SECURITY;

-- Everyone can read constructs
CREATE POLICY exam_constructs_read_all ON exam_constructs
  FOR SELECT TO authenticated
  USING (true);

-- Only admins can modify
CREATE POLICY exam_constructs_admin_all ON exam_constructs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
