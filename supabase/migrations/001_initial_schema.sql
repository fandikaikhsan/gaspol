-- UTBK Last-Minute Prep Platform - Initial Schema
-- Phase 0: Foundation & Infrastructure
-- 20+ tables with comprehensive structure

-- gen_random_uuid() is built into PostgreSQL 13+ (no extension needed)

-- ============================================
-- CORE TABLES
-- ============================================

-- User profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),

  -- Student-specific fields
  package_days INTEGER CHECK (package_days IN (7, 14, 21, 30)),
  time_budget_min INTEGER, -- daily time budget in minutes
  target_university TEXT,
  target_major TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User state machine
CREATE TABLE user_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,

  -- Phase tracking
  current_phase TEXT NOT NULL DEFAULT 'ONBOARDING' CHECK (
    current_phase IN (
      'ONBOARDING',
      'BASELINE_ASSESSMENT_IN_PROGRESS',
      'BASELINE_COMPLETE',
      'PLAN_ACTIVE',
      'RECYCLE_UNLOCKED',
      'RECYCLE_ASSESSMENT_IN_PROGRESS'
    )
  ),

  -- Onboarding
  onboarding_completed_at TIMESTAMPTZ,

  -- Baseline assessment
  baseline_started_at TIMESTAMPTZ,
  baseline_completed_at TIMESTAMPTZ,
  current_baseline_module_id UUID, -- references baseline_modules

  -- Plan cycle
  current_cycle_id UUID, -- references plan_cycles
  cycle_start_date TIMESTAMPTZ,

  -- Re-cycle checkpoint
  recycle_unlocked_at TIMESTAMPTZ,
  current_checkpoint_id UUID, -- references recycle_checkpoints

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TAXONOMY & CONTENT
-- ============================================

-- Hierarchical taxonomy: subject → subtest → topic → subtopic → micro-skill
CREATE TABLE taxonomy_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES taxonomy_nodes(id) ON DELETE CASCADE,

  -- Node data
  level INTEGER NOT NULL CHECK (level IN (1, 2, 3, 4, 5)), -- 1=subject, 5=micro-skill
  code TEXT NOT NULL, -- e.g., "PU", "PU-MAT", "PU-MAT-ALG"
  name TEXT NOT NULL,
  description TEXT,

  -- Metadata
  position INTEGER DEFAULT 0, -- for ordering siblings
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(parent_id, code)
);

-- Create index for hierarchical queries
CREATE INDEX idx_taxonomy_parent ON taxonomy_nodes(parent_id);
CREATE INDEX idx_taxonomy_level ON taxonomy_nodes(level);

-- Questions bank
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Classification
  micro_skill_id UUID NOT NULL REFERENCES taxonomy_nodes(id),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  cognitive_level TEXT NOT NULL CHECK (cognitive_level IN ('L1', 'L2', 'L3')), -- L1=recall, L2=apply, L3=analyze

  -- Question content
  question_format TEXT NOT NULL CHECK (question_format IN ('MCQ5', 'MCK-Table', 'Fill-in')),
  stem TEXT NOT NULL, -- question text
  stem_images JSONB DEFAULT '[]', -- array of image URLs

  -- Answer options (for MCQ/MCK formats)
  options JSONB DEFAULT '{}', -- {"A": "text", "B": "text", ...} or table structure
  correct_answer TEXT NOT NULL, -- "A", "C", "1,3,5", or exact numeric

  -- Explanation
  explanation TEXT,
  explanation_images JSONB DEFAULT '[]',

  -- Construct weights (for analytics)
  construct_weights JSONB NOT NULL DEFAULT '{}', -- {"teliti": 0.3, "speed": 0.2, ...}

  -- Admin metadata
  version INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
  created_by UUID REFERENCES profiles(id),
  reviewed_by UUID REFERENCES profiles(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX idx_questions_micro_skill ON questions(micro_skill_id);
CREATE INDEX idx_questions_status ON questions(status);

-- Modules (reusable question collections)
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Module metadata
  name TEXT NOT NULL,
  description TEXT,
  module_type TEXT NOT NULL CHECK (module_type IN ('baseline', 'drill_focus', 'drill_mixed', 'mock', 'flashcard', 'swipe')),

  -- Target taxonomy node (optional - for focused drills)
  target_node_id UUID REFERENCES taxonomy_nodes(id),

  -- Configuration
  question_count INTEGER NOT NULL,
  time_limit_min INTEGER, -- null = untimed
  passing_threshold DECIMAL(3,2), -- e.g., 0.65 = 65%

  -- Questions (ordered array of question IDs)
  question_ids JSONB NOT NULL DEFAULT '[]', -- [uuid, uuid, ...]

  -- Admin metadata
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID REFERENCES profiles(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Baseline modules (specific to baseline assessment flow)
CREATE TABLE baseline_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,

  -- Baseline checkpoint configuration
  checkpoint_order INTEGER NOT NULL, -- 1, 2, 3... for sequencing
  is_required BOOLEAN DEFAULT true,

  -- Display
  title TEXT NOT NULL,
  subtitle TEXT,
  estimated_duration_min INTEGER,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(checkpoint_order)
);

-- ============================================
-- ASSESSMENT & ATTEMPTS
-- ============================================

-- User attempts on questions
CREATE TABLE attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,

  -- Context
  context_type TEXT NOT NULL CHECK (context_type IN ('baseline', 'drill', 'mock', 'recycle', 'flashcard', 'swipe')),
  context_id UUID, -- module_id, task_id, or checkpoint_id
  module_id UUID REFERENCES modules(id),

  -- Attempt data
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_sec INTEGER NOT NULL,

  -- Derived analytics
  error_tags JSONB DEFAULT '[]', -- ["ceroboh", "konsep_lemah", ...]
  construct_impacts JSONB DEFAULT '{}', -- {"teliti": -0.15, "speed": 0.05}

  -- Timestamps
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexes for performance
  CONSTRAINT unique_attempt_per_question_context UNIQUE(user_id, question_id, context_id)
);

CREATE INDEX idx_attempts_user ON attempts(user_id);
CREATE INDEX idx_attempts_question ON attempts(question_id);
CREATE INDEX idx_attempts_context ON attempts(context_type, context_id);
CREATE INDEX idx_attempts_date ON attempts(attempted_at);

-- User module completions
CREATE TABLE module_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,

  -- Completion data
  context_type TEXT NOT NULL CHECK (context_type IN ('baseline', 'drill', 'mock', 'recycle')),
  score DECIMAL(5,2) NOT NULL, -- e.g., 75.50
  total_questions INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  total_time_sec INTEGER NOT NULL,

  -- Analytics snapshot
  readiness_score DECIMAL(5,2), -- computed at completion
  construct_profile JSONB, -- {"teliti": 0.75, "speed": 0.60, ...}

  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, module_id, context_type, completed_at)
);

CREATE INDEX idx_module_completions_user ON module_completions(user_id);

-- ============================================
-- ANALYTICS STATE
-- ============================================

-- Per-micro-skill performance tracking
CREATE TABLE user_skill_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  micro_skill_id UUID NOT NULL REFERENCES taxonomy_nodes(id) ON DELETE CASCADE,

  -- Performance metrics
  accuracy DECIMAL(5,2) DEFAULT 0, -- 0-100
  avg_speed_index DECIMAL(5,2) DEFAULT 0, -- 0-100, normalized
  stability DECIMAL(5,2) DEFAULT 0, -- variance measure, 0-100
  attempt_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,

  -- Time tracking
  total_time_sec INTEGER DEFAULT 0,
  avg_time_sec INTEGER DEFAULT 0,

  -- Status
  mastery_level TEXT DEFAULT 'untested' CHECK (mastery_level IN ('untested', 'weak', 'developing', 'strong')),
  last_attempted_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, micro_skill_id)
);

CREATE INDEX idx_user_skill_state_user ON user_skill_state(user_id);
CREATE INDEX idx_user_skill_state_mastery ON user_skill_state(mastery_level);

-- Per-construct performance tracking
CREATE TABLE user_construct_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Five core constructs
  construct_name TEXT NOT NULL CHECK (construct_name IN ('teliti', 'speed', 'reasoning', 'computation', 'reading')),

  -- Metrics
  score DECIMAL(5,2) DEFAULT 50, -- 0-100, starts at 50 (neutral)
  confidence DECIMAL(5,2) DEFAULT 0, -- confidence interval width
  trend TEXT DEFAULT 'stable' CHECK (trend IN ('improving', 'stable', 'declining')),

  -- Sample size
  data_points INTEGER DEFAULT 0,
  last_updated_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, construct_name)
);

CREATE INDEX idx_user_construct_state_user ON user_construct_state(user_id);

-- Analytics snapshots (for delta comparisons)
CREATE TABLE analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Snapshot metadata
  snapshot_type TEXT NOT NULL CHECK (snapshot_type IN ('baseline_start', 'baseline_complete', 'cycle_start', 'cycle_end', 'recycle_before', 'recycle_after')),
  snapshot_context_id UUID, -- cycle_id or checkpoint_id

  -- Global metrics
  readiness_score DECIMAL(5,2),

  -- Construct profile at this point
  teliti_score DECIMAL(5,2),
  speed_score DECIMAL(5,2),
  reasoning_score DECIMAL(5,2),
  computation_score DECIMAL(5,2),
  reading_score DECIMAL(5,2),

  -- Coverage metrics
  skills_tested INTEGER DEFAULT 0,
  skills_strong INTEGER DEFAULT 0,
  skills_weak INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_snapshots_user ON analytics_snapshots(user_id);
CREATE INDEX idx_analytics_snapshots_type ON analytics_snapshots(snapshot_type);

-- ============================================
-- PLAN & TASKS
-- ============================================

-- Plan cycles
CREATE TABLE plan_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Cycle metadata
  cycle_number INTEGER NOT NULL, -- 1, 2, 3...
  start_date DATE NOT NULL,
  target_days_remaining INTEGER NOT NULL,

  -- Generation context
  generated_from_snapshot_id UUID REFERENCES analytics_snapshots(id),
  weak_skills JSONB DEFAULT '[]', -- array of micro_skill_ids to target

  -- Task mix
  task_count INTEGER NOT NULL,
  drill_focus_count INTEGER DEFAULT 0,
  drill_mixed_count INTEGER DEFAULT 0,
  mock_count INTEGER DEFAULT 0,
  flashcard_count INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,

  -- Completion tracking
  required_task_count INTEGER NOT NULL, -- subset of task_count that must be done
  completed_task_count INTEGER DEFAULT 0,
  is_complete BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plan_cycles_user ON plan_cycles(user_id);

-- Individual plan tasks
CREATE TABLE plan_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES plan_cycles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Task definition
  task_type TEXT NOT NULL CHECK (task_type IN ('drill_focus', 'drill_mixed', 'mock', 'flashcard', 'review')),
  task_order INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT true,

  -- Target
  target_node_id UUID REFERENCES taxonomy_nodes(id), -- for focused drills
  module_id UUID REFERENCES modules(id), -- generated module for this task

  -- Display
  title TEXT NOT NULL,
  subtitle TEXT,
  estimated_duration_min INTEGER,

  -- Completion
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completion_score DECIMAL(5,2),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plan_tasks_cycle ON plan_tasks(cycle_id);
CREATE INDEX idx_plan_tasks_user ON plan_tasks(user_id);

-- ============================================
-- RE-CYCLE CHECKPOINTS
-- ============================================

-- Re-cycle targeted checkpoints
CREATE TABLE recycle_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL REFERENCES plan_cycles(id) ON DELETE CASCADE,

  -- Checkpoint config
  checkpoint_number INTEGER NOT NULL, -- 1, 2, 3... per cycle
  target_weak_skills JSONB NOT NULL DEFAULT '[]', -- micro_skill_ids from red zone

  -- Generated module
  module_id UUID REFERENCES modules(id),
  question_count INTEGER NOT NULL,

  -- Before/after snapshots
  before_snapshot_id UUID REFERENCES analytics_snapshots(id),
  after_snapshot_id UUID REFERENCES analytics_snapshots(id),

  -- Completion
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,

  -- Delta analytics
  delta_readiness DECIMAL(5,2),
  delta_constructs JSONB, -- {"teliti": +0.15, "speed": -0.05}
  skills_improved INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recycle_checkpoints_user ON recycle_checkpoints(user_id);
CREATE INDEX idx_recycle_checkpoints_cycle ON recycle_checkpoints(cycle_id);

-- ============================================
-- TAKTIS MODE CONTENT
-- ============================================

-- Flashcards
CREATE TABLE flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Classification
  micro_skill_id UUID NOT NULL REFERENCES taxonomy_nodes(id),

  -- Card content
  front_text TEXT NOT NULL,
  front_image TEXT,
  back_text TEXT NOT NULL,
  back_image TEXT,

  -- Additional info
  mnemonic TEXT,
  example TEXT,

  -- Admin metadata
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID REFERENCES profiles(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_flashcards_micro_skill ON flashcards(micro_skill_id);

-- User flashcard interactions
CREATE TABLE flashcard_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  flashcard_id UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,

  -- Review result
  confidence_level TEXT NOT NULL CHECK (confidence_level IN ('easy', 'medium', 'hard', 'forgot')),

  -- Spaced repetition
  next_review_at TIMESTAMPTZ,
  review_count INTEGER DEFAULT 1,

  -- Timestamp
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_flashcard_reviews_user ON flashcard_reviews(user_id);
CREATE INDEX idx_flashcard_reviews_next ON flashcard_reviews(next_review_at);

-- ============================================
-- ADMIN & AI OPERATIONS
-- ============================================

-- AI operation logs
CREATE TABLE ai_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Operation metadata
  operation_type TEXT NOT NULL CHECK (operation_type IN ('item_generation', 'auto_tag', 'qc', 'session_summary')),
  initiated_by UUID REFERENCES profiles(id),

  -- Request
  prompt TEXT NOT NULL,
  input_context JSONB, -- additional context data

  -- Response
  output_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'error')),
  error_message TEXT,

  -- Usage tracking
  model TEXT DEFAULT 'claude-3-5-sonnet-20241022',
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_cost_usd DECIMAL(10,4),

  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_ai_runs_initiated_by ON ai_runs(initiated_by);
CREATE INDEX idx_ai_runs_operation_type ON ai_runs(operation_type);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_state_updated_at BEFORE UPDATE ON user_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_taxonomy_nodes_updated_at BEFORE UPDATE ON taxonomy_nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_baseline_modules_updated_at BEFORE UPDATE ON baseline_modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_skill_state_updated_at BEFORE UPDATE ON user_skill_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_construct_state_updated_at BEFORE UPDATE ON user_construct_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plan_cycles_updated_at BEFORE UPDATE ON plan_cycles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plan_tasks_updated_at BEFORE UPDATE ON plan_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recycle_checkpoints_updated_at BEFORE UPDATE ON recycle_checkpoints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flashcards_updated_at BEFORE UPDATE ON flashcards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'student');

  INSERT INTO user_state (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Comments for documentation
COMMENT ON TABLE profiles IS 'User profiles extending auth.users with student/admin data';
COMMENT ON TABLE user_state IS 'State machine tracking user progress through assessment phases';
COMMENT ON TABLE taxonomy_nodes IS 'Hierarchical taxonomy: subject → subtest → topic → subtopic → micro-skill';
COMMENT ON TABLE questions IS 'Question bank with multi-format support (MCQ5, MCK-Table, Fill-in)';
COMMENT ON TABLE modules IS 'Reusable question collections for various contexts';
COMMENT ON TABLE baseline_modules IS 'Baseline assessment checkpoint definitions';
COMMENT ON TABLE attempts IS 'User attempt records with error tag derivation';
COMMENT ON TABLE user_skill_state IS 'Per-micro-skill performance tracking';
COMMENT ON TABLE user_construct_state IS 'Five-construct profile (teliti, speed, reasoning, computation, reading)';
COMMENT ON TABLE analytics_snapshots IS 'Point-in-time analytics for delta comparisons';
COMMENT ON TABLE plan_cycles IS 'Generated study plans based on analytics';
COMMENT ON TABLE plan_tasks IS 'Individual tasks within plan cycles';
COMMENT ON TABLE recycle_checkpoints IS 'Targeted re-assessment checkpoints';
COMMENT ON TABLE flashcards IS 'Flashcard content for Taktis mode';
COMMENT ON TABLE ai_runs IS 'AI operation logs with token tracking';
