-- Add construct_id FK to exam_constructs for schema alignment
-- Plan: docs/planning/07_construct_schema_and_admin_ux.md

-- =====================================================
-- 1. ADD construct_id COLUMN
-- =====================================================

ALTER TABLE exam_constructs
ADD COLUMN IF NOT EXISTS construct_id TEXT REFERENCES constructs(id);

CREATE INDEX IF NOT EXISTS idx_exam_constructs_construct_id
ON exam_constructs(construct_id);

COMMENT ON COLUMN exam_constructs.construct_id IS 'FK to constructs table; code maps to constructs.id for standard constructs';

-- =====================================================
-- 2. BACKFILL EXISTING ROWS
-- =====================================================

UPDATE exam_constructs
SET construct_id = code
WHERE construct_id IS NULL
  AND code IN (SELECT id FROM constructs);

-- =====================================================
-- 3. UPDATE apply_constructs_from_research TO SET construct_id
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
        INSERT INTO exam_constructs (exam_id, code, construct_id, name, short_name, description, display_order)
        VALUES (
          p_exam_id,
          v_code,
          CASE WHEN EXISTS (SELECT 1 FROM constructs WHERE id = v_code) THEN v_code ELSE NULL END,
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
          construct_id = EXCLUDED.construct_id,
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
