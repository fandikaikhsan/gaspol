-- UTBK Last-Minute Prep Platform - Complete Seed Data
-- Updated with Exam Configuration

-- ============================================
-- EXAM CONFIGURATION
-- ============================================

-- Create UTBK 2026 exam
INSERT INTO exams (id, name, exam_type, year, research_summary, structure_metadata, is_active, is_primary) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'UTBK 2026',
  'UTBK',
  2026,
  'UTBK (Ujian Tulis Berbasis Komputer) 2026 consists of three main test sections: Tes Potensi Skolastik (TPS), Literasi Bahasa Indonesia dan Bahasa Inggris, and Penalaran Matematika. Total test duration is approximately 195 minutes with 183 questions across all sections.',
  '{
    "sections": [
      {
        "name": "Tes Potensi Skolastik",
        "code": "TPS",
        "time_limit_min": 65,
        "question_count": 60,
        "subsections": ["Penalaran Umum", "Pengetahuan Kuantitatif", "Pengetahuan & Pemahaman Umum", "Memahami Bacaan & Menulis"]
      },
      {
        "name": "Literasi Bahasa Indonesia",
        "code": "LBI",
        "time_limit_min": 45,
        "question_count": 30
      },
      {
        "name": "Literasi Bahasa Inggris",
        "code": "LBE",
        "time_limit_min": 45,
        "question_count": 20
      },
      {
        "name": "Penalaran Matematika",
        "code": "PM",
        "time_limit_min": 40,
        "question_count": 20
      }
    ],
    "scoring": {
      "type": "IRT",
      "range": "0-1000"
    }
  }',
  true,
  true
);

-- ============================================
-- TAXONOMY - Complete 5-Level Structure
-- ============================================

-- LEVEL 1: Subject - Penalaran Umum (PU)
INSERT INTO taxonomy_nodes (id, exam_id, parent_id, level, code, name, description, position, is_active) VALUES
('a1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', NULL, 1, 'PU', 'Penalaran Umum', 'General Reasoning - measures logical thinking and analytical skills', 1, true);

-- LEVEL 2: Subtest - Matematika
INSERT INTO taxonomy_nodes (id, exam_id, parent_id, level, code, name, description, position, is_active) VALUES
('a2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'a1111111-1111-1111-1111-111111111111', 2, 'PU-MAT', 'Matematika', 'Mathematics reasoning and quantitative analysis', 1, true);

-- LEVEL 3: Topic - Aljabar
INSERT INTO taxonomy_nodes (id, exam_id, parent_id, level, code, name, description, position, is_active) VALUES
('a3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'a2222222-2222-2222-2222-222222222222', 3, 'PU-MAT-ALG', 'Aljabar', 'Algebra - equations, inequalities, and algebraic expressions', 1, true);

-- LEVEL 4: Subtopic - Persamaan Linear
INSERT INTO taxonomy_nodes (id, exam_id, parent_id, level, code, name, description, position, is_active) VALUES
('a4444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001', 'a3333333-3333-3333-3333-333333333333', 4, 'PU-MAT-ALG-LIN', 'Persamaan Linear', 'Linear equations and systems', 1, true);

-- LEVEL 5: Micro-skills
INSERT INTO taxonomy_nodes (id, exam_id, parent_id, level, code, name, description, position, is_active) VALUES
('a5555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000001', 'a4444444-4444-4444-4444-444444444444', 5, 'PU-MAT-ALG-LIN-SOLVE', 'Solving Linear Equations', 'Solve ax + b = c and similar forms', 1, true),
('a5555555-5555-5555-5555-555555555556', '00000000-0000-0000-0000-000000000001', 'a4444444-4444-4444-4444-444444444444', 5, 'PU-MAT-ALG-LIN-WORD', 'Linear Word Problems', 'Apply linear equations to real-world scenarios', 2, true);

-- Add more subtopics and micro-skills for complete coverage
-- Subtopic: Sistem Persamaan Linear
INSERT INTO taxonomy_nodes (id, exam_id, parent_id, level, code, name, description, position, is_active) VALUES
('a4444444-4444-4444-4444-444444444445', '00000000-0000-0000-0000-000000000001', 'a3333333-3333-3333-3333-333333333333', 4, 'PU-MAT-ALG-SYS', 'Sistem Persamaan Linear', 'Systems of linear equations', 2, true);

INSERT INTO taxonomy_nodes (id, exam_id, parent_id, level, code, name, description, position, is_active) VALUES
('a5555555-5555-5555-5555-555555555557', '00000000-0000-0000-0000-000000000001', 'a4444444-4444-4444-4444-444444444445', 5, 'PU-MAT-ALG-SYS-2VAR', 'Solving 2-Variable Systems', 'Solve systems with 2 variables using substitution or elimination', 1, true);

-- Topic: Geometri
INSERT INTO taxonomy_nodes (id, exam_id, parent_id, level, code, name, description, position, is_active) VALUES
('a3333333-3333-3333-3333-333333333334', '00000000-0000-0000-0000-000000000001', 'a2222222-2222-2222-2222-222222222222', 3, 'PU-MAT-GEO', 'Geometri', 'Geometry - shapes, area, volume, and spatial reasoning', 2, true);

-- Subtopic: Bangun Datar
INSERT INTO taxonomy_nodes (id, exam_id, parent_id, level, code, name, description, position, is_active) VALUES
('a4444444-4444-4444-4444-444444444446', '00000000-0000-0000-0000-000000000001', 'a3333333-3333-3333-3333-333333333334', 4, 'PU-MAT-GEO-2D', 'Bangun Datar', '2D shapes and their properties', 1, true);

INSERT INTO taxonomy_nodes (id, exam_id, parent_id, level, code, name, description, position, is_active) VALUES
('a5555555-5555-5555-5555-555555555558', '00000000-0000-0000-0000-000000000001', 'a4444444-4444-4444-4444-444444444446', 5, 'PU-MAT-GEO-2D-AREA', 'Area Calculations', 'Calculate area of triangles, rectangles, circles, etc.', 1, true);

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
-- 1. Make sure migrations 001-006 are applied
-- 2. Run this file in Supabase SQL Editor
-- 3. Verify data in admin/debug page

-- This seed includes:
-- ✓ 1 Exam (UTBK 2026)
-- ✓ Complete 5-level taxonomy (Subject → Subtest → Topic → Subtopic → Micro-skill)
-- ✓ 3 Sample questions
-- ✓ 1 Module
-- ✓ 1 Baseline checkpoint
-- ✓ 2 Flashcards
