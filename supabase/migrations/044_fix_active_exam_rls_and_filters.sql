-- Fix: get_user_exam_config needs SECURITY DEFINER so students can always get active exam
-- (RLS on exams table can block reads in some edge cases; function should reliably return active exam)

CREATE OR REPLACE FUNCTION get_user_exam_config(p_user_id UUID)
RETURNS TABLE (
  exam_id UUID,
  exam_type TEXT,
  exam_name TEXT,
  construct_count INTEGER,
  error_tag_count INTEGER
) AS $$
DECLARE
  v_exam_id UUID;
BEGIN
  SELECT us.current_exam_id INTO v_exam_id
  FROM user_state us
  WHERE us.user_id = p_user_id;

  IF v_exam_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM exams e WHERE e.id = v_exam_id AND e.is_active = true) THEN
      v_exam_id := NULL;
    END IF;
  END IF;

  IF v_exam_id IS NULL THEN
    SELECT id INTO v_exam_id
    FROM exams
    WHERE is_active = true
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  IF v_exam_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    e.id as exam_id,
    e.exam_type,
    e.name as exam_name,
    (SELECT COUNT(*)::INTEGER FROM exam_constructs WHERE exam_id = e.id AND is_active = true) as construct_count,
    (SELECT COUNT(*)::INTEGER FROM tags WHERE exam_id = e.id AND tag_type = 'error' AND is_active = true) as error_tag_count
  FROM exams e
  WHERE e.id = v_exam_id AND e.is_active = true;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_user_exam_config IS 'Get exam config for a user. SECURITY DEFINER ensures reliable access to active exam.';
