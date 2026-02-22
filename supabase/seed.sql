-- UTBK Last-Minute Prep Platform - Seed Data
-- Phase 10: Testing & Documentation

-- ============================================
-- ADMIN USER
-- ============================================

-- Create admin user (password: admin123)
-- Run this after creating user via Supabase Auth Dashboard
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@gaspol.com';

-- ============================================
-- TAXONOMY - Sample Structure
-- ============================================

-- Subject: Penalaran Umum (PU)
INSERT INTO taxonomy_nodes (id, parent_id, level, code, name, description, position) VALUES
('a1111111-1111-1111-1111-111111111111', NULL, 1, 'PU', 'Penalaran Umum', 'General Reasoning', 1);

-- Subtest: Matematika
INSERT INTO taxonomy_nodes (id, parent_id, level, code, name, description, position) VALUES
('a2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 2, 'PU-MAT', 'Matematika', 'Mathematics', 1);

-- Topic: Aljabar
INSERT INTO taxonomy_nodes (id, parent_id, level, code, name, description, position) VALUES
('a3333333-3333-3333-3333-333333333333', 'a2222222-2222-2222-2222-222222222222', 3, 'PU-MAT-ALG', 'Aljabar', 'Algebra', 1);

-- Subtopic: Persamaan Linear
INSERT INTO taxonomy_nodes (id, parent_id, level, code, name, description, position) VALUES
('a4444444-4444-4444-4444-444444444444', 'a3333333-3333-3333-3333-333333333333', 4, 'PU-MAT-ALG-LIN', 'Persamaan Linear', 'Linear Equations', 1);

-- Micro-skill: Solving Linear Equations
INSERT INTO taxonomy_nodes (id, parent_id, level, code, name, description, position) VALUES
('a5555555-5555-5555-5555-555555555555', 'a4444444-4444-4444-4444-444444444444', 5, 'PU-MAT-ALG-LIN-SOLVE', 'Solving Linear Equations', 'Solve ax + b = c', 1);

-- More micro-skills
INSERT INTO taxonomy_nodes (id, parent_id, level, code, name, description, position) VALUES
('a5555555-5555-5555-5555-555555555556', 'a4444444-4444-4444-4444-444444444444', 5, 'PU-MAT-ALG-LIN-WORD', 'Linear Word Problems', 'Apply linear equations to real scenarios', 2);

-- ============================================
-- SAMPLE QUESTIONS
-- ============================================

-- Question 1: Easy MCQ5
INSERT INTO questions (
  id,
  micro_skill_id,
  difficulty,
  cognitive_level,
  question_format,
  stem,
  options,
  correct_answer,
  explanation,
  construct_weights,
  status
) VALUES (
  'q1111111-1111-1111-1111-111111111111',
  'a5555555-5555-5555-5555-555555555555',
  'easy',
  'L1',
  'MCQ5',
  'Solve for x: 2x + 5 = 15',
  '{"A": "5", "B": "10", "C": "7.5", "D": "20", "E": "2.5"}',
  'A',
  'Subtract 5 from both sides: 2x = 10, then divide by 2: x = 5',
  '{"teliti": 0.3, "speed": 0.2, "reasoning": 0.2, "computation": 0.2, "reading": 0.1}',
  'published'
);

-- Question 2: Medium MCQ5
INSERT INTO questions (
  id,
  micro_skill_id,
  difficulty,
  cognitive_level,
  question_format,
  stem,
  options,
  correct_answer,
  explanation,
  construct_weights,
  status
) VALUES (
  'q2222222-2222-2222-2222-222222222222',
  'a5555555-5555-5555-5555-555555555555',
  'medium',
  'L2',
  'MCQ5',
  'If 3(x - 2) + 4 = 19, what is the value of x?',
  '{"A": "7", "B": "5", "C": "9", "D": "11", "E": "3"}',
  'A',
  'Expand: 3x - 6 + 4 = 19, simplify: 3x - 2 = 19, then 3x = 21, so x = 7',
  '{"teliti": 0.3, "speed": 0.15, "reasoning": 0.3, "computation": 0.15, "reading": 0.1}',
  'published'
);

-- Question 3: Word Problem
INSERT INTO questions (
  id,
  micro_skill_id,
  difficulty,
  cognitive_level,
  question_format,
  stem,
  options,
  correct_answer,
  explanation,
  construct_weights,
  status
) VALUES (
  'q3333333-3333-3333-3333-333333333333',
  'a5555555-5555-5555-5555-555555555556',
  'medium',
  'L3',
  'MCQ5',
  'A store sells pens for Rp 2,500 each. If Budi has Rp 20,000 and wants to buy as many pens as possible while having at least Rp 5,000 left, how many pens can he buy?',
  '{"A": "6", "B": "5", "C": "7", "D": "8", "E": "4"}',
  'A',
  'Money available for pens: 20,000 - 5,000 = 15,000. Number of pens: 15,000 / 2,500 = 6',
  '{"teliti": 0.2, "speed": 0.1, "reasoning": 0.4, "computation": 0.2, "reading": 0.1}',
  'published'
);

-- ============================================
-- MODULE
-- ============================================

-- Sample baseline module
INSERT INTO modules (
  id,
  name,
  description,
  module_type,
  question_count,
  time_limit_min,
  question_ids,
  status
) VALUES (
  'm1111111-1111-1111-1111-111111111111',
  'Baseline Math - Linear Equations',
  'Quick assessment of linear equation skills',
  'baseline',
  3,
  10,
  '["q1111111-1111-1111-1111-111111111111", "q2222222-2222-2222-2222-222222222222", "q3333333-3333-3333-3333-333333333333"]',
  'published'
);

-- ============================================
-- BASELINE MODULE
-- ============================================

INSERT INTO baseline_modules (
  module_id,
  checkpoint_order,
  title,
  subtitle,
  estimated_duration_min,
  is_active
) VALUES (
  'm1111111-1111-1111-1111-111111111111',
  1,
  'Math Fundamentals',
  'Linear equations and basic algebra',
  10,
  true
);

-- ============================================
-- SAMPLE FLASHCARDS
-- ============================================

INSERT INTO flashcards (
  micro_skill_id,
  front_text,
  back_text,
  status
) VALUES
(
  'a5555555-5555-5555-5555-555555555555',
  'What is the first step to solve: 2x + 5 = 15?',
  'Subtract 5 from both sides to isolate the term with x',
  'published'
),
(
  'a5555555-5555-5555-5555-555555555555',
  'In ax + b = c, what operation removes b?',
  'Subtract b from both sides',
  'published'
);

-- ============================================
-- NOTES
-- ============================================

-- To use this seed data:
-- 1. Run supabase db reset (will clear all data)
-- 2. Run migrations: supabase db push
-- 3. Run this seed file: psql -h ... -f supabase/seed.sql
--
-- Or manually copy sections into Supabase SQL Editor

-- Create test student:
-- 1. Sign up via app with test@student.com
-- 2. The profile and user_state will be created automatically via trigger
