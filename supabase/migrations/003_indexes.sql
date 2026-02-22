-- UTBK Last-Minute Prep Platform - Performance Indexes
-- Phase 0: Optimize query performance

-- ============================================
-- ADDITIONAL COMPOSITE INDEXES
-- ============================================

-- User state lookups by phase
CREATE INDEX idx_user_state_phase ON user_state(current_phase) WHERE current_phase != 'ONBOARDING';

-- Questions filtering
CREATE INDEX idx_questions_micro_skill_status ON questions(micro_skill_id, status);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);

-- Module lookups
CREATE INDEX idx_modules_type_status ON modules(module_type, status);

-- Attempts analytics queries
CREATE INDEX idx_attempts_user_date ON attempts(user_id, attempted_at DESC);
CREATE INDEX idx_attempts_correct ON attempts(user_id, is_correct);
CREATE INDEX idx_attempts_module ON attempts(module_id, user_id);

-- User skill state sorting
CREATE INDEX idx_user_skill_state_accuracy ON user_skill_state(user_id, accuracy DESC);
CREATE INDEX idx_user_skill_state_weak ON user_skill_state(user_id, mastery_level) WHERE mastery_level = 'weak';

-- Plan cycles ordering
CREATE INDEX idx_plan_cycles_number ON plan_cycles(user_id, cycle_number DESC);
CREATE INDEX idx_plan_cycles_active ON plan_cycles(user_id, is_complete) WHERE is_complete = false;

-- Plan tasks filtering
CREATE INDEX idx_plan_tasks_status ON plan_tasks(cycle_id, is_completed);
CREATE INDEX idx_plan_tasks_required ON plan_tasks(cycle_id, is_required) WHERE is_required = true;

-- Analytics snapshots timeline
CREATE INDEX idx_analytics_snapshots_timeline ON analytics_snapshots(user_id, created_at DESC);
CREATE INDEX idx_analytics_snapshots_context ON analytics_snapshots(snapshot_context_id) WHERE snapshot_context_id IS NOT NULL;

-- Flashcard reviews for spaced repetition
CREATE INDEX idx_flashcard_reviews_user_next ON flashcard_reviews(user_id, next_review_at) WHERE next_review_at IS NOT NULL;

-- AI runs for admin dashboard
CREATE INDEX idx_ai_runs_recent ON ai_runs(started_at DESC);
CREATE INDEX idx_ai_runs_status ON ai_runs(status) WHERE status = 'pending';

-- ============================================
-- PARTIAL INDEXES FOR COMMON QUERIES
-- ============================================

-- Active baseline modules only
CREATE INDEX idx_baseline_modules_active ON baseline_modules(checkpoint_order) WHERE is_active = true;

-- Published content only (students' queries)
CREATE INDEX idx_questions_published ON questions(micro_skill_id) WHERE status = 'published';
CREATE INDEX idx_modules_published ON modules(module_type) WHERE status = 'published';
CREATE INDEX idx_flashcards_published ON flashcards(micro_skill_id) WHERE status = 'published';

-- Incomplete tasks for current cycle
CREATE INDEX idx_plan_tasks_incomplete ON plan_tasks(user_id, task_order) WHERE is_completed = false;

-- Weak skills for plan generation
CREATE INDEX idx_user_skill_state_needs_work ON user_skill_state(user_id, accuracy) WHERE accuracy < 60;

-- ============================================
-- FULL TEXT SEARCH INDEXES (for admin)
-- ============================================

-- Search questions by stem
CREATE INDEX idx_questions_stem_search ON questions USING gin(to_tsvector('english', stem));

-- Search flashcards
CREATE INDEX idx_flashcards_search ON flashcards USING gin(
  to_tsvector('english', front_text || ' ' || back_text)
);

-- ============================================
-- STATISTICS & ANALYSIS
-- ============================================

-- Update table statistics
ANALYZE profiles;
ANALYZE user_state;
ANALYZE taxonomy_nodes;
ANALYZE questions;
ANALYZE modules;
ANALYZE baseline_modules;
ANALYZE attempts;
ANALYZE module_completions;
ANALYZE user_skill_state;
ANALYZE user_construct_state;
ANALYZE analytics_snapshots;
ANALYZE plan_cycles;
ANALYZE plan_tasks;
ANALYZE recycle_checkpoints;
ANALYZE flashcards;
ANALYZE flashcard_reviews;
ANALYZE ai_runs;

-- Comments
COMMENT ON INDEX idx_user_skill_state_weak IS 'Quick lookup for weak skills during plan generation';
COMMENT ON INDEX idx_plan_tasks_incomplete IS 'Find remaining tasks for current cycle';
COMMENT ON INDEX idx_questions_published IS 'Student-facing published questions only';
