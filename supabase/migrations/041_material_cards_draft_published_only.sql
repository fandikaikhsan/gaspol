-- Migration 041: Simplify material_cards status to draft and published only
-- Removes 'review' status; migrates existing 'review' rows to 'draft'

-- 1. Migrate any 'review' rows to 'draft'
UPDATE material_cards SET status = 'draft' WHERE status = 'review';

-- 2. Drop the old constraint and add new one
ALTER TABLE material_cards DROP CONSTRAINT IF EXISTS material_cards_status_check;
ALTER TABLE material_cards ADD CONSTRAINT material_cards_status_check
  CHECK (status IN ('draft', 'published'));
