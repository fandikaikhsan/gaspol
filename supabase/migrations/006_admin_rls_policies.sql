-- RLS Policies for Admin Extensions

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is authenticated
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- EXAMS TABLE
-- ============================================

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view active exams
CREATE POLICY "Anyone can view active exams"
ON exams FOR SELECT
TO authenticated
USING (is_active = true);

-- Only admins can insert/update/delete exams
CREATE POLICY "Admins can manage exams"
ON exams FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- ============================================
-- CONSTRUCTS TABLE
-- ============================================

ALTER TABLE constructs ENABLE ROW LEVEL SECURITY;

-- Everyone can view active constructs
CREATE POLICY "Anyone can view constructs"
ON constructs FOR SELECT
TO authenticated
USING (is_active = true);

-- Only admins can manage constructs
CREATE POLICY "Admins can manage constructs"
ON constructs FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- ============================================
-- TAGS TABLE
-- ============================================

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Everyone can view active tags
CREATE POLICY "Anyone can view tags"
ON tags FOR SELECT
TO authenticated
USING (is_active = true);

-- Only admins can manage tags
CREATE POLICY "Admins can manage tags"
ON tags FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- ============================================
-- QUESTION_TAGS TABLE
-- ============================================

ALTER TABLE question_tags ENABLE ROW LEVEL SECURITY;

-- Everyone can view question tags for published questions
CREATE POLICY "Anyone can view question tags"
ON question_tags FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM questions q
    WHERE q.id = question_tags.question_id
    AND (q.status = 'published' OR is_admin(auth.uid()))
  )
);

-- Only admins can manage question tags
CREATE POLICY "Admins can manage question tags"
ON question_tags FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- ============================================
-- QUESTION_VERSIONS TABLE
-- ============================================

ALTER TABLE question_versions ENABLE ROW LEVEL SECURITY;

-- Everyone can view current versions of published questions
CREATE POLICY "Anyone can view published question versions"
ON question_versions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM questions q
    WHERE q.id = question_versions.question_id
    AND (q.status = 'published' OR is_admin(auth.uid()))
  )
);

-- Only admins can manage versions
CREATE POLICY "Admins can manage question versions"
ON question_versions FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- ============================================
-- CONTENT_REVIEW_QUEUE TABLE
-- ============================================

ALTER TABLE content_review_queue ENABLE ROW LEVEL SECURITY;

-- Only admins can view review queue
CREATE POLICY "Admins can view review queue"
ON content_review_queue FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Only admins can manage review queue
CREATE POLICY "Admins can manage review queue"
ON content_review_queue FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- ============================================
-- QUESTION_OPTION_METADATA TABLE
-- ============================================

ALTER TABLE question_option_metadata ENABLE ROW LEVEL SECURITY;

-- Everyone can view option metadata for published questions
CREATE POLICY "Anyone can view option metadata"
ON question_option_metadata FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM questions q
    WHERE q.id = question_option_metadata.question_id
    AND (q.status = 'published' OR is_admin(auth.uid()))
  )
);

-- Only admins can manage option metadata
CREATE POLICY "Admins can manage option metadata"
ON question_option_metadata FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- ============================================
-- ADMIN_SETTINGS TABLE
-- ============================================

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view public settings
CREATE POLICY "Anyone can view public settings"
ON admin_settings FOR SELECT
TO authenticated
USING (is_public = true OR is_admin(auth.uid()));

-- Only admins can manage settings
CREATE POLICY "Admins can manage settings"
ON admin_settings FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- ============================================
-- UPDATE EXISTING RLS POLICIES
-- ============================================

-- Update taxonomy_nodes policy to include exam filtering
DROP POLICY IF EXISTS "Anyone can view taxonomy nodes" ON taxonomy_nodes;
DROP POLICY IF EXISTS "Anyone can view active taxonomy nodes" ON taxonomy_nodes;
DROP POLICY IF EXISTS "Admins can manage taxonomy nodes" ON taxonomy_nodes;

CREATE POLICY "Anyone can view active taxonomy nodes"
ON taxonomy_nodes FOR SELECT
TO authenticated
USING (
  is_active = true
  AND (
    exam_id IS NULL
    OR EXISTS (
      SELECT 1 FROM exams e
      WHERE e.id = taxonomy_nodes.exam_id
      AND e.is_active = true
    )
  )
);

-- Admins can manage taxonomy nodes
CREATE POLICY "Admins can manage taxonomy nodes"
ON taxonomy_nodes FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant usage on helper functions
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_authenticated() TO authenticated;
