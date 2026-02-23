-- Add construct weight inheritance system
-- Questions inherit construct weights from taxonomy nodes if not set

-- =====================================================
-- 1. Add default construct weights to taxonomy_nodes
-- =====================================================

ALTER TABLE taxonomy_nodes
ADD COLUMN IF NOT EXISTS default_construct_weights JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS expected_time_sec INTEGER DEFAULT 120;

COMMENT ON COLUMN taxonomy_nodes.default_construct_weights IS 'Default construct weights inherited by questions at this taxonomy node. Example: {"C.REASONING": 0.6, "C.ATTENTION": 0.3, "C.SPEED": 0.1}';
COMMENT ON COLUMN taxonomy_nodes.expected_time_sec IS 'Expected time to answer questions in this taxonomy node (seconds)';

-- =====================================================
-- 2. Add time estimate to questions if not exists
-- =====================================================

-- Check if time_estimate_seconds exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions'
    AND column_name = 'time_estimate_seconds'
  ) THEN
    ALTER TABLE questions ADD COLUMN time_estimate_seconds INTEGER DEFAULT 120;
  END IF;
END $$;

COMMENT ON COLUMN questions.time_estimate_seconds IS 'Expected time to answer this question in seconds';

-- =====================================================
-- 3. Helper function to get effective construct weights
-- =====================================================

-- Get construct weights for a question, with fallback to taxonomy node
CREATE OR REPLACE FUNCTION get_question_construct_weights(p_question_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_weights JSONB;
  v_taxonomy_node_id UUID;
BEGIN
  -- Get question's construct weights
  SELECT construct_weights, taxonomy_node_id
  INTO v_weights, v_taxonomy_node_id
  FROM questions
  LEFT JOIN question_taxonomy ON questions.id = question_taxonomy.question_id
  LEFT JOIN taxonomy_nodes ON question_taxonomy.taxonomy_node_id = taxonomy_nodes.id
  WHERE questions.id = p_question_id
  LIMIT 1;

  -- If question has weights, use them
  IF v_weights IS NOT NULL AND jsonb_typeof(v_weights) = 'object' AND v_weights != '{}'::jsonb THEN
    RETURN v_weights;
  END IF;

  -- Otherwise, get from taxonomy node
  IF v_taxonomy_node_id IS NOT NULL THEN
    SELECT default_construct_weights INTO v_weights
    FROM taxonomy_nodes
    WHERE id = v_taxonomy_node_id;

    IF v_weights IS NOT NULL AND jsonb_typeof(v_weights) = 'object' THEN
      RETURN v_weights;
    END IF;
  END IF;

  -- Default fallback: balanced weights
  RETURN '{
    "C.ATTENTION": 0.2,
    "C.SPEED": 0.2,
    "C.REASONING": 0.2,
    "C.COMPUTATION": 0.2,
    "C.READING": 0.2
  }'::jsonb;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_question_construct_weights IS 'Get effective construct weights for a question, with inheritance from taxonomy node and fallback defaults';

-- =====================================================
-- 4. Function to update construct weights for multiple questions
-- =====================================================

CREATE OR REPLACE FUNCTION set_taxonomy_construct_weights(
  p_taxonomy_node_id UUID,
  p_weights JSONB
)
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  -- Update the taxonomy node
  UPDATE taxonomy_nodes
  SET default_construct_weights = p_weights,
      updated_at = NOW()
  WHERE id = p_taxonomy_node_id;

  -- Count how many questions will inherit these weights
  SELECT COUNT(*) INTO v_updated_count
  FROM question_taxonomy
  WHERE taxonomy_node_id = p_taxonomy_node_id;

  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION set_taxonomy_construct_weights IS 'Set construct weights for a taxonomy node, affecting all linked questions that dont have custom weights';

-- =====================================================
-- 5. Extend constructs table if exists
-- =====================================================

-- Add sort_order column if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'constructs') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'constructs' AND column_name = 'sort_order'
    ) THEN
      ALTER TABLE constructs ADD COLUMN sort_order INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'constructs' AND column_name = 'icon'
    ) THEN
      ALTER TABLE constructs ADD COLUMN icon TEXT;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'constructs' AND column_name = 'color'
    ) THEN
      ALTER TABLE constructs ADD COLUMN color TEXT;
    END IF;
  END IF;
END $$;

-- Upsert the 5 core constructs
INSERT INTO constructs (id, name, description, icon, color, sort_order)
VALUES
  ('C.ATTENTION', 'Attention & Accuracy', 'Ability to maintain focus and avoid careless errors', '🎯', '#10b981', 1),
  ('C.SPEED', 'Speed & Efficiency', 'How quickly you can solve problems while maintaining accuracy', '⚡', '#3b82f6', 2),
  ('C.REASONING', 'Logical Reasoning', 'Ability to analyze, deduce, and solve complex problems', '🧠', '#8b5cf6', 3),
  ('C.COMPUTATION', 'Computation & Calculation', 'Mathematical calculation accuracy and number sense', '🔢', '#f59e0b', 4),
  ('C.READING', 'Reading Comprehension', 'Ability to understand and extract meaning from text', '📖', '#ef4444', 5)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order;

COMMENT ON TABLE constructs IS 'Reference table defining the 5 cognitive constructs used for profiling';
