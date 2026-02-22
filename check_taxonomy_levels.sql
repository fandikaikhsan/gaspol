-- Check Taxonomy Levels in Database
-- Run this in Supabase SQL Editor to see what you have

-- 1. Count nodes by level
SELECT
  level,
  CASE
    WHEN level = 1 THEN 'Subject'
    WHEN level = 2 THEN 'Subtest'
    WHEN level = 3 THEN 'Topic'
    WHEN level = 4 THEN 'Subtopic'
    WHEN level = 5 THEN 'Micro-skill'
    ELSE 'Unknown'
  END as level_name,
  COUNT(*) as count,
  COUNT(CASE WHEN exam_id IS NULL THEN 1 END) as missing_exam_id
FROM taxonomy_nodes
GROUP BY level
ORDER BY level;

-- 2. Show sample nodes at each level
SELECT
  level,
  name,
  code,
  exam_id,
  CASE WHEN exam_id IS NULL THEN '❌ Missing' ELSE '✅ Has Exam' END as exam_status
FROM taxonomy_nodes
ORDER BY level, position
LIMIT 20;

-- 3. Check parent-child relationships
SELECT
  p.level as parent_level,
  p.name as parent_name,
  c.level as child_level,
  c.name as child_name,
  c.exam_id
FROM taxonomy_nodes c
LEFT JOIN taxonomy_nodes p ON c.parent_id = p.id
ORDER BY p.level, c.level
LIMIT 20;

-- 4. Check exams
SELECT
  id,
  name,
  exam_type,
  year,
  is_active,
  is_primary
FROM exams
ORDER BY year DESC;
