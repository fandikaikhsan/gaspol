-- Gaspol Tutor: per-topic AI chat history (UTBK tutor cards)

CREATE TABLE gaspol_tutor_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  message TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gaspol_tutor_user_topic ON gaspol_tutor_chats(user_id, topic_id);
CREATE INDEX idx_gaspol_tutor_created ON gaspol_tutor_chats(created_at);

ALTER TABLE gaspol_tutor_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_tutor_chats"
  ON gaspol_tutor_chats FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_tutor_chats"
  ON gaspol_tutor_chats FOR INSERT
  WITH CHECK (user_id = auth.uid());
