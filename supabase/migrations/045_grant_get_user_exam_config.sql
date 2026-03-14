-- Grant execute permission so authenticated users (students) can call get_user_exam_config
GRANT EXECUTE ON FUNCTION get_user_exam_config(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_exam_config(UUID) TO service_role;
