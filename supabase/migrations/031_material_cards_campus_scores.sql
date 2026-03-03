-- Migration 031: Create material_cards and campus_scores tables
-- Tasks: T-009, T-010
-- Part of Milestone A: Stabilize & Align Foundations

-- ============================================
-- T-009: Create material_cards table
-- One Material Card per micro-skill (level 5 taxonomy node)
-- Content: Core Idea, Key Facts, Common Mistakes, Examples
-- ============================================

CREATE TABLE IF NOT EXISTS material_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to micro-skill (level 5 taxonomy node)
  skill_id UUID NOT NULL REFERENCES taxonomy_nodes(id) ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL,
  core_idea TEXT NOT NULL,
  key_facts JSONB NOT NULL DEFAULT '[]',        -- array of fact strings
  common_mistakes JSONB NOT NULL DEFAULT '[]',   -- array of mistake strings
  examples JSONB NOT NULL DEFAULT '[]',          -- array of example objects

  -- Publishing workflow
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published')),

  -- Admin metadata
  created_by UUID REFERENCES profiles(id),
  reviewed_by UUID REFERENCES profiles(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One card per skill
  UNIQUE(skill_id)
);

CREATE INDEX IF NOT EXISTS idx_material_cards_skill ON material_cards(skill_id);
CREATE INDEX IF NOT EXISTS idx_material_cards_status ON material_cards(status);

COMMENT ON TABLE material_cards IS 'Structured learning content per micro-skill (level 5). Core Idea + Key Facts + Common Mistakes + Examples.';

-- ============================================
-- T-010: Create campus_scores table
-- Admin-managed university/program passing scores
-- ============================================

CREATE TABLE IF NOT EXISTS campus_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- University info
  university_name TEXT NOT NULL,
  major TEXT,

  -- Score data
  min_score DECIMAL(6,2) NOT NULL,  -- minimum passing score
  year INTEGER NOT NULL,            -- academic year the data applies to

  -- Verification
  source_url TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate entries
  UNIQUE(university_name, major, year)
);

CREATE INDEX IF NOT EXISTS idx_campus_scores_university ON campus_scores(university_name);
CREATE INDEX IF NOT EXISTS idx_campus_scores_verified ON campus_scores(verified);

COMMENT ON TABLE campus_scores IS 'Admin-managed university passing scores for campus-targeted readiness comparison.';
