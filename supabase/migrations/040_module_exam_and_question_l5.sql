-- Module exam_id and Question L5-only taxonomy
-- Plan: Exam-Module-Question Taxonomy Refactor

-- ============================================
-- 1. ADD exam_id TO modules
-- ============================================

ALTER TABLE modules
ADD COLUMN IF NOT EXISTS exam_id UUID REFERENCES exams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_modules_exam ON modules(exam_id);

COMMENT ON COLUMN modules.exam_id IS 'Exam this module belongs to; module represents how to test students for this exam';

-- Backfill exam_id from target_node_id -> taxonomy_nodes.exam_id
UPDATE modules m
SET exam_id = tn.exam_id
FROM taxonomy_nodes tn
WHERE m.target_node_id = tn.id
  AND m.exam_id IS NULL;

-- ============================================
-- 2. DATA MIGRATION: question_taxonomy
-- - Keep one L5 link per question (prefer L5, delete others)
-- - Delete non-L5 links (questions will need manual L5 assignment)
-- ============================================

-- Delete non-L5 links (taxonomy_node_id points to level != 5)
DELETE FROM question_taxonomy qt
WHERE NOT EXISTS (
  SELECT 1 FROM taxonomy_nodes tn
  WHERE tn.id = qt.taxonomy_node_id AND tn.level = 5
);

-- For questions with multiple L5 links, keep one (first by created_at)
WITH ranked AS (
  SELECT ctid, ROW_NUMBER() OVER (PARTITION BY question_id ORDER BY created_at) as rn
  FROM question_taxonomy
)
DELETE FROM question_taxonomy
WHERE ctid IN (SELECT ctid FROM ranked WHERE rn > 1);

-- Sync micro_skill_id from the single question_taxonomy L5 link
UPDATE questions q
SET micro_skill_id = qt.taxonomy_node_id
FROM question_taxonomy qt
WHERE qt.question_id = q.id
  AND (q.micro_skill_id IS DISTINCT FROM qt.taxonomy_node_id);

-- ============================================
-- 3. ADD CONSTRAINTS: question_taxonomy
-- ============================================

-- Enforce exactly one taxonomy link per question
CREATE UNIQUE INDEX IF NOT EXISTS idx_question_taxonomy_one_per_question
ON question_taxonomy (question_id);

-- ============================================
-- 4. TRIGGERS: question_taxonomy
-- ============================================

-- Enforce taxonomy_node_id must reference level-5 nodes (PostgreSQL doesn't allow subqueries in CHECK)
CREATE OR REPLACE FUNCTION check_question_taxonomy_l5_only()
RETURNS TRIGGER AS $$
DECLARE
  v_level INTEGER;
BEGIN
  SELECT level INTO v_level FROM taxonomy_nodes WHERE id = NEW.taxonomy_node_id;
  IF v_level IS NULL OR v_level != 5 THEN
    RAISE EXCEPTION 'question_taxonomy must reference a level-5 (micro-skill) taxonomy node'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_question_taxonomy_l5 ON question_taxonomy;
CREATE TRIGGER check_question_taxonomy_l5
BEFORE INSERT OR UPDATE ON question_taxonomy
FOR EACH ROW
EXECUTE FUNCTION check_question_taxonomy_l5_only();

COMMENT ON FUNCTION check_question_taxonomy_l5_only IS 'Enforces that question_taxonomy only links to L5 (micro-skill) taxonomy nodes';

-- Sync micro_skill_id from question_taxonomy
CREATE OR REPLACE FUNCTION sync_question_micro_skill_id()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE questions SET micro_skill_id = NULL WHERE id = OLD.question_id;
    RETURN OLD;
  ELSIF TG_OP IN ('INSERT', 'UPDATE') THEN
    UPDATE questions SET micro_skill_id = NEW.taxonomy_node_id WHERE id = NEW.question_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_micro_skill_on_question_taxonomy ON question_taxonomy;
CREATE TRIGGER sync_micro_skill_on_question_taxonomy
AFTER INSERT OR UPDATE OR DELETE ON question_taxonomy
FOR EACH ROW
EXECUTE FUNCTION sync_question_micro_skill_id();
