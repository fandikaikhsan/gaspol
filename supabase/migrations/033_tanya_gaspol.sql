-- Migration 033: Tanya Gaspol AI Chat
-- Creates chat messages and token quota tables for the Tanya Gaspol feature.

-- Chat messages table
CREATE TABLE tanya_gaspol_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES taxonomy_nodes(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  message TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tanya_gaspol_user_skill ON tanya_gaspol_chats(user_id, skill_id);
CREATE INDEX idx_tanya_gaspol_created ON tanya_gaspol_chats(created_at);

-- Token quota table
CREATE TABLE tanya_gaspol_quota (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_tokens INTEGER NOT NULL DEFAULT 100,
  used_tokens INTEGER NOT NULL DEFAULT 0,
  remaining_tokens INTEGER GENERATED ALWAYS AS (total_tokens - used_tokens) STORED,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: tanya_gaspol_chats
ALTER TABLE tanya_gaspol_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_chats"
  ON tanya_gaspol_chats FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_chats"
  ON tanya_gaspol_chats FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS: tanya_gaspol_quota
ALTER TABLE tanya_gaspol_quota ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_quota"
  ON tanya_gaspol_quota FOR SELECT
  USING (user_id = auth.uid());
