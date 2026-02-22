-- UTBK Last-Minute Prep Platform - RLS Policies
-- Phase 0: Row Level Security for all tables
-- Enterprise-grade security with student/admin role separation

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE baseline_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skill_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_construct_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE recycle_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_runs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get current user's role
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- PROFILES
-- ============================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin());

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (public.is_admin());

-- ============================================
-- USER STATE
-- ============================================

-- Users can view their own state
CREATE POLICY "Users can view own state"
  ON user_state FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own state
CREATE POLICY "Users can update own state"
  ON user_state FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can insert (via trigger)
CREATE POLICY "Service can insert user state"
  ON user_state FOR INSERT
  WITH CHECK (true);

-- Admins have full access
CREATE POLICY "Admins can view all user states"
  ON user_state FOR SELECT
  USING (public.is_admin());

-- ============================================
-- TAXONOMY NODES
-- ============================================

-- Everyone (authenticated) can read taxonomy
CREATE POLICY "Authenticated users can view taxonomy"
  ON taxonomy_nodes FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can modify taxonomy
CREATE POLICY "Admins can insert taxonomy"
  ON taxonomy_nodes FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update taxonomy"
  ON taxonomy_nodes FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete taxonomy"
  ON taxonomy_nodes FOR DELETE
  USING (public.is_admin());

-- ============================================
-- QUESTIONS
-- ============================================

-- Students can only view published questions
CREATE POLICY "Students can view published questions"
  ON questions FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND status = 'published'
  );

-- Admins can view all questions
CREATE POLICY "Admins can view all questions"
  ON questions FOR SELECT
  USING (public.is_admin());

-- Admins can manage questions
CREATE POLICY "Admins can insert questions"
  ON questions FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update questions"
  ON questions FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete questions"
  ON questions FOR DELETE
  USING (public.is_admin());

-- ============================================
-- MODULES
-- ============================================

-- Students can view published modules
CREATE POLICY "Students can view published modules"
  ON modules FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND status = 'published'
  );

-- Admins can view all modules
CREATE POLICY "Admins can view all modules"
  ON modules FOR SELECT
  USING (public.is_admin());

-- Admins can manage modules
CREATE POLICY "Admins can insert modules"
  ON modules FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update modules"
  ON modules FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete modules"
  ON modules FOR DELETE
  USING (public.is_admin());

-- ============================================
-- BASELINE MODULES
-- ============================================

-- Students can view active baseline modules
CREATE POLICY "Students can view baseline modules"
  ON baseline_modules FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND is_active = true
  );

-- Admins have full access
CREATE POLICY "Admins can view all baseline modules"
  ON baseline_modules FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage baseline modules"
  ON baseline_modules FOR ALL
  USING (public.is_admin());

-- ============================================
-- ATTEMPTS
-- ============================================

-- Users can view their own attempts
CREATE POLICY "Users can view own attempts"
  ON attempts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own attempts
CREATE POLICY "Users can insert own attempts"
  ON attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all attempts
CREATE POLICY "Admins can view all attempts"
  ON attempts FOR SELECT
  USING (public.is_admin());

-- ============================================
-- MODULE COMPLETIONS
-- ============================================

-- Users can view their own completions
CREATE POLICY "Users can view own completions"
  ON module_completions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own completions
CREATE POLICY "Users can insert own completions"
  ON module_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all completions
CREATE POLICY "Admins can view all completions"
  ON module_completions FOR SELECT
  USING (public.is_admin());

-- ============================================
-- USER SKILL STATE
-- ============================================

-- Users can view their own skill state
CREATE POLICY "Users can view own skill state"
  ON user_skill_state FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert/update their own skill state
CREATE POLICY "Users can manage own skill state"
  ON user_skill_state FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all skill states
CREATE POLICY "Admins can view all skill states"
  ON user_skill_state FOR SELECT
  USING (public.is_admin());

-- ============================================
-- USER CONSTRUCT STATE
-- ============================================

-- Users can view their own construct state
CREATE POLICY "Users can view own construct state"
  ON user_construct_state FOR SELECT
  USING (auth.uid() = user_id);

-- Users can manage their own construct state
CREATE POLICY "Users can manage own construct state"
  ON user_construct_state FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all construct states
CREATE POLICY "Admins can view all construct states"
  ON user_construct_state FOR SELECT
  USING (public.is_admin());

-- ============================================
-- ANALYTICS SNAPSHOTS
-- ============================================

-- Users can view their own snapshots
CREATE POLICY "Users can view own snapshots"
  ON analytics_snapshots FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own snapshots
CREATE POLICY "Users can insert own snapshots"
  ON analytics_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all snapshots
CREATE POLICY "Admins can view all snapshots"
  ON analytics_snapshots FOR SELECT
  USING (public.is_admin());

-- ============================================
-- PLAN CYCLES
-- ============================================

-- Users can view their own plan cycles
CREATE POLICY "Users can view own plan cycles"
  ON plan_cycles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert/update their own plan cycles
CREATE POLICY "Users can manage own plan cycles"
  ON plan_cycles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all plan cycles
CREATE POLICY "Admins can view all plan cycles"
  ON plan_cycles FOR SELECT
  USING (public.is_admin());

-- ============================================
-- PLAN TASKS
-- ============================================

-- Users can view their own tasks
CREATE POLICY "Users can view own tasks"
  ON plan_tasks FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own tasks (completion)
CREATE POLICY "Users can update own tasks"
  ON plan_tasks FOR UPDATE
  USING (auth.uid() = user_id);

-- Service can insert tasks (via generate_plan function)
CREATE POLICY "Service can insert tasks"
  ON plan_tasks FOR INSERT
  WITH CHECK (true);

-- Admins can view all tasks
CREATE POLICY "Admins can view all tasks"
  ON plan_tasks FOR SELECT
  USING (public.is_admin());

-- ============================================
-- RECYCLE CHECKPOINTS
-- ============================================

-- Users can view their own checkpoints
CREATE POLICY "Users can view own checkpoints"
  ON recycle_checkpoints FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert/update their own checkpoints
CREATE POLICY "Users can manage own checkpoints"
  ON recycle_checkpoints FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all checkpoints
CREATE POLICY "Admins can view all checkpoints"
  ON recycle_checkpoints FOR SELECT
  USING (public.is_admin());

-- ============================================
-- FLASHCARDS
-- ============================================

-- Students can view published flashcards
CREATE POLICY "Students can view published flashcards"
  ON flashcards FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND status = 'published'
  );

-- Admins can manage flashcards
CREATE POLICY "Admins can view all flashcards"
  ON flashcards FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage flashcards"
  ON flashcards FOR ALL
  USING (public.is_admin());

-- ============================================
-- FLASHCARD REVIEWS
-- ============================================

-- Users can view their own reviews
CREATE POLICY "Users can view own reviews"
  ON flashcard_reviews FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own reviews
CREATE POLICY "Users can insert own reviews"
  ON flashcard_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all reviews
CREATE POLICY "Admins can view all reviews"
  ON flashcard_reviews FOR SELECT
  USING (public.is_admin());

-- ============================================
-- AI RUNS
-- ============================================

-- Only admins can view AI runs
CREATE POLICY "Admins can view AI runs"
  ON ai_runs FOR SELECT
  USING (public.is_admin());

-- Admins can insert AI runs
CREATE POLICY "Admins can insert AI runs"
  ON ai_runs FOR INSERT
  WITH CHECK (public.is_admin());

-- Admins can update AI runs (status, results)
CREATE POLICY "Admins can update AI runs"
  ON ai_runs FOR UPDATE
  USING (public.is_admin());

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant usage on sequences (for auto-increment IDs if any)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Comments
COMMENT ON POLICY "Users can view own profile" ON profiles IS 'Students can only access their own profile data';
COMMENT ON POLICY "Admins can view all profiles" ON profiles IS 'Admins have read access to all user profiles';
COMMENT ON FUNCTION public.is_admin() IS 'Helper function to check if current user has admin role';
