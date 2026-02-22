-- Create question_taxonomy junction table
-- Links questions to taxonomy nodes

CREATE TABLE question_taxonomy (
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  taxonomy_node_id UUID NOT NULL REFERENCES taxonomy_nodes(id) ON DELETE CASCADE,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (question_id, taxonomy_node_id)
);

-- Indexes for performance
CREATE INDEX idx_question_taxonomy_question ON question_taxonomy(question_id);
CREATE INDEX idx_question_taxonomy_node ON question_taxonomy(taxonomy_node_id);

-- RLS policies (inherit from questions and taxonomy_nodes)
ALTER TABLE question_taxonomy ENABLE ROW LEVEL SECURITY;

-- Admins can manage all links
CREATE POLICY question_taxonomy_admin_all ON question_taxonomy
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Students can view active question-taxonomy links
CREATE POLICY question_taxonomy_student_view ON question_taxonomy
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM questions
      WHERE questions.id = question_taxonomy.question_id
      AND questions.is_active = true
    )
  );

COMMENT ON TABLE question_taxonomy IS 'Junction table linking questions to taxonomy nodes for organization and filtering';
