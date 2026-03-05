-- Migration 032: RLS policies for material_cards and campus_scores
-- Task: T-012
-- Part of Milestone A: Stabilize & Align Foundations
--
-- Rules:
-- material_cards: students read-only (published only); admin full CRUD
-- campus_scores: public read (verified only); admin full CRUD

-- ============================================
-- material_cards RLS
-- ============================================

ALTER TABLE material_cards ENABLE ROW LEVEL SECURITY;

-- Students can only read published material cards
CREATE POLICY "Students can read published material cards"
  ON material_cards
  FOR SELECT
  TO authenticated
  USING (
    status = 'published'
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can insert material cards
CREATE POLICY "Admins can insert material cards"
  ON material_cards
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can update material cards
CREATE POLICY "Admins can update material cards"
  ON material_cards
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can delete material cards
CREATE POLICY "Admins can delete material cards"
  ON material_cards
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- campus_scores RLS
-- ============================================

ALTER TABLE campus_scores ENABLE ROW LEVEL SECURITY;

-- Everyone can read verified campus scores (public read)
CREATE POLICY "Anyone can read verified campus scores"
  ON campus_scores
  FOR SELECT
  TO authenticated
  USING (
    verified = true
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can insert campus scores
CREATE POLICY "Admins can insert campus scores"
  ON campus_scores
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can update campus scores
CREATE POLICY "Admins can update campus scores"
  ON campus_scores
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can delete campus scores
CREATE POLICY "Admins can delete campus scores"
  ON campus_scores
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
