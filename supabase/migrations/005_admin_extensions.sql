-- Admin Extensions Migration
-- Adds exam configuration, versioning, tags, and enhanced admin features

-- ============================================
-- EXAM CONFIGURATION
-- ============================================

-- Exams table - allows pivoting to different exam types
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Exam identification
  name TEXT NOT NULL, -- "UTBK 2026", "SNBT 2026"
  exam_type TEXT NOT NULL, -- "UTBK", "SNBT", "UM PTN"
  year INTEGER NOT NULL,

  -- Structure metadata (from AI research)
  structure_metadata JSONB DEFAULT '{}', -- {sections:[], time_limits:{}, scoring:{}}
  research_summary TEXT, -- AI-generated exam overview

  -- Configuration
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false, -- only one can be primary

  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(name, year)
);

-- Add exam_id to taxonomy_nodes
ALTER TABLE taxonomy_nodes
ADD COLUMN exam_id UUID REFERENCES exams(id) ON DELETE CASCADE;

CREATE INDEX idx_taxonomy_nodes_exam ON taxonomy_nodes(exam_id);
CREATE INDEX idx_exams_active ON exams(is_active);

-- ============================================
-- CONSTRUCTS MANAGEMENT
-- ============================================

-- Constructs table (make configurable vs hardcoded)
CREATE TABLE constructs (
  id TEXT PRIMARY KEY, -- 'teliti', 'speed', 'reasoning', 'computation', 'reading'

  -- Display
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- icon name
  color TEXT, -- color code

  -- Configuration
  weight_range JSONB DEFAULT '{"min": 0, "max": 1}',
  default_weight DECIMAL(3,2) DEFAULT 0.2,

  -- Metadata
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default constructs
INSERT INTO constructs (id, name, description, display_order) VALUES
  ('teliti', 'Ketelitian', 'Attention to detail and careful analysis', 1),
  ('speed', 'Kecepatan', 'Speed and time efficiency', 2),
  ('reasoning', 'Penalaran', 'Logical reasoning and analysis', 3),
  ('computation', 'Komputasi', 'Mathematical computation skills', 4),
  ('reading', 'Pemahaman', 'Reading comprehension', 5);

-- ============================================
-- TAGS SYSTEM
-- ============================================

-- Unified tags table (error, question, option tags)
CREATE TABLE tags (
  id TEXT PRIMARY KEY, -- 'ERR.CARELESS', 'Q.ALGEBRA', 'OPT.SIGN_ERROR'

  -- Tag classification
  tag_type TEXT NOT NULL CHECK (tag_type IN ('error', 'question', 'option')),
  category TEXT, -- group related tags

  -- Content
  name TEXT NOT NULL,
  description TEXT,

  -- Error tag specific: signals for detection
  detection_signals JSONB DEFAULT '[]', -- [{signal: 'fast_incorrect', threshold: 0.6}]

  -- Display
  color TEXT,
  icon TEXT,

  -- Metadata
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tags_type ON tags(tag_type);
CREATE INDEX idx_tags_category ON tags(category);

-- Question-Tag mapping
CREATE TABLE question_tags (
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  tag_id TEXT REFERENCES tags(id) ON DELETE CASCADE,

  -- Assignment metadata
  assigned_by TEXT DEFAULT 'manual' CHECK (assigned_by IN ('manual', 'ai', 'rule')),
  confidence DECIMAL(3,2), -- for AI assignments

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (question_id, tag_id)
);

CREATE INDEX idx_question_tags_question ON question_tags(question_id);
CREATE INDEX idx_question_tags_tag ON question_tags(tag_id);

-- ============================================
-- QUESTION VERSIONING
-- ============================================

-- Question versions table (track all changes)
CREATE TABLE question_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,

  -- Version tracking
  version INTEGER NOT NULL,
  is_current BOOLEAN DEFAULT false, -- only one version is current

  -- Content snapshot
  stem TEXT NOT NULL,
  stem_images JSONB DEFAULT '[]',
  options JSONB DEFAULT '{}',
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  explanation_images JSONB DEFAULT '[]',

  -- Metadata snapshot
  construct_weights JSONB DEFAULT '{}',
  difficulty TEXT,
  cognitive_level TEXT,

  -- Change tracking
  change_summary TEXT, -- what changed in this version
  content_hash TEXT, -- for deduplication

  -- Version metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(question_id, version)
);

CREATE INDEX idx_question_versions_question ON question_versions(question_id);
CREATE INDEX idx_question_versions_current ON question_versions(question_id, is_current);
CREATE INDEX idx_question_versions_hash ON question_versions(content_hash);

-- Function to create version on question update
CREATE OR REPLACE FUNCTION create_question_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark all previous versions as not current
  UPDATE question_versions
  SET is_current = false
  WHERE question_id = NEW.id;

  -- Create new version
  INSERT INTO question_versions (
    question_id, version, is_current,
    stem, stem_images, options, correct_answer,
    explanation, explanation_images,
    construct_weights, difficulty, cognitive_level,
    content_hash, created_by
  )
  SELECT
    NEW.id,
    COALESCE((SELECT MAX(version) FROM question_versions WHERE question_id = NEW.id), 0) + 1,
    true,
    NEW.stem, NEW.stem_images, NEW.options, NEW.correct_answer,
    NEW.explanation, NEW.explanation_images,
    NEW.construct_weights, NEW.difficulty, NEW.cognitive_level,
    md5(NEW.stem || NEW.options::text || NEW.correct_answer),
    NEW.updated_by
  WHERE NEW.status = 'published' OR TG_OP = 'INSERT';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create versions
CREATE TRIGGER question_version_trigger
AFTER INSERT OR UPDATE ON questions
FOR EACH ROW
EXECUTE FUNCTION create_question_version();

-- ============================================
-- CONTENT REVIEW QUEUE
-- ============================================

-- Review queue for content approval workflow
CREATE TABLE content_review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Item reference
  item_type TEXT NOT NULL CHECK (item_type IN ('question', 'flashcard', 'module', 'taxonomy_node')),
  item_id UUID NOT NULL, -- can reference different tables

  -- Review status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_revision')),
  priority INTEGER DEFAULT 0, -- higher = more urgent

  -- Issues (from QC or manual review)
  issues JSONB DEFAULT '[]', -- [{code: 'AMBIGUOUS', severity: 'high', note: '...'}]
  qc_passed BOOLEAN DEFAULT NULL, -- true/false/null if not run

  -- Review notes
  reviewer_notes TEXT,
  suggested_changes TEXT,

  -- Assignment
  assigned_to UUID REFERENCES profiles(id),
  reviewed_by UUID REFERENCES profiles(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX idx_review_queue_status ON content_review_queue(status);
CREATE INDEX idx_review_queue_type ON content_review_queue(item_type, status);
CREATE INDEX idx_review_queue_assigned ON content_review_queue(assigned_to, status);

-- ============================================
-- ENHANCED AI RUNS
-- ============================================

-- Add more fields to existing ai_runs table (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_runs' AND column_name = 'job_type') THEN
    ALTER TABLE ai_runs ADD COLUMN job_type TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_runs' AND column_name = 'prompt_version') THEN
    ALTER TABLE ai_runs ADD COLUMN prompt_version TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_runs' AND column_name = 'input_params') THEN
    ALTER TABLE ai_runs ADD COLUMN input_params JSONB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_runs' AND column_name = 'output_result') THEN
    ALTER TABLE ai_runs ADD COLUMN output_result JSONB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_runs' AND column_name = 'tokens_used') THEN
    ALTER TABLE ai_runs ADD COLUMN tokens_used INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_runs' AND column_name = 'duration_ms') THEN
    ALTER TABLE ai_runs ADD COLUMN duration_ms INTEGER;
  END IF;
END $$;

-- Rename columns only if they exist and target doesn't exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_runs' AND column_name = 'output_data')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_runs' AND column_name = 'legacy_output_data') THEN
    ALTER TABLE ai_runs RENAME COLUMN output_data TO legacy_output_data;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_runs' AND column_name = 'input_context')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_runs' AND column_name = 'legacy_input_context') THEN
    ALTER TABLE ai_runs RENAME COLUMN input_context TO legacy_input_context;
  END IF;
END $$;

-- Drop old constraint if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_runs_operation_type_check') THEN
    ALTER TABLE ai_runs DROP CONSTRAINT ai_runs_operation_type_check;
  END IF;
END $$;

-- Add new constraint only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_runs_job_type_check') THEN
    ALTER TABLE ai_runs
    ADD CONSTRAINT ai_runs_job_type_check
    CHECK (job_type IN ('exam_research', 'taxonomy_builder', 'item_generation', 'auto_tag', 'qc', 'module_compose', 'session_summary'));
  END IF;
END $$;

-- ============================================
-- OPTION-LEVEL METADATA
-- ============================================

-- Store metadata about each option (for distractor analysis)
CREATE TABLE question_option_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,

  -- Option identification
  option_key TEXT NOT NULL, -- 'A', 'B', 'C', etc.

  -- Metadata
  misconception TEXT, -- what mistake does this represent
  tag_id TEXT REFERENCES tags(id), -- option tag
  difficulty_weight DECIMAL(3,2), -- how difficult is this distractor

  -- Analytics
  selection_count INTEGER DEFAULT 0, -- how many students selected this

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(question_id, option_key)
);

CREATE INDEX idx_option_metadata_question ON question_option_metadata(question_id);

-- ============================================
-- ADMIN SETTINGS
-- ============================================

-- Admin configuration and settings
CREATE TABLE admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Setting identification
  category TEXT NOT NULL, -- 'ai', 'content', 'generation', etc.
  key TEXT NOT NULL,

  -- Value
  value JSONB NOT NULL,
  value_type TEXT NOT NULL CHECK (value_type IN ('string', 'number', 'boolean', 'json')),

  -- Metadata
  description TEXT,
  is_public BOOLEAN DEFAULT false, -- can students see this?

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(category, key)
);

-- Insert default settings
INSERT INTO admin_settings (category, key, value, value_type, description) VALUES
  ('ai', 'default_model', '"claude-3-5-sonnet-20241022"', 'string', 'Default AI model for content generation'),
  ('ai', 'item_generation_temperature', '0.7', 'number', 'Temperature for question generation'),
  ('ai', 'max_tokens_per_request', '4000', 'number', 'Maximum tokens per AI request'),
  ('content', 'auto_publish', 'false', 'boolean', 'Automatically publish after QC pass'),
  ('generation', 'default_questions_per_skill', '5', 'number', 'Default number of questions to generate per micro-skill');

-- ============================================
-- UPDATE TRIGGERS
-- ============================================

-- Add updated_at triggers to new tables
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_constructs_updated_at BEFORE UPDATE ON constructs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_queue_updated_at BEFORE UPDATE ON content_review_queue
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_option_metadata_updated_at BEFORE UPDATE ON question_option_metadata
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON admin_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
