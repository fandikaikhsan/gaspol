-- Migration 034: Flashcard Spaced Repetition (SM-2)
-- Creates flashcard_user_state table for per-skill SR scheduling.

CREATE TABLE flashcard_user_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES taxonomy_nodes(id) ON DELETE CASCADE,
  ease_factor DECIMAL(4,2) NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  due_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  mastery_bucket TEXT NOT NULL DEFAULT 'forgot'
    CHECK (mastery_bucket IN ('forgot', 'hard', 'good', 'easy')),
  total_reviews INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);

-- Indexes for common query patterns
CREATE INDEX idx_flashcard_user_state_due
  ON flashcard_user_state(user_id, due_at);

CREATE INDEX idx_flashcard_user_state_bucket
  ON flashcard_user_state(user_id, mastery_bucket);

-- RLS
ALTER TABLE flashcard_user_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_flashcard_state"
  ON flashcard_user_state FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_flashcard_state"
  ON flashcard_user_state FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_update_own_flashcard_state"
  ON flashcard_user_state FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
