-- Drop trigger that calls update_user_constructs_v2.
-- That function expects user_construct_state to have columns (constructs, sample_size),
-- but the table was created in 001 with (construct_name, score, data_points, ...).
-- The submit-attempt API already updates user_construct_state and user_skill_state
-- using the correct schema, so this trigger is redundant and causes 42703.

DROP TRIGGER IF EXISTS attempt_analytics_trigger ON attempts;

COMMENT ON TABLE attempts IS 'User attempt records. Analytics updated by submit-attempt API.';
