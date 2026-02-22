-- Fix signup trigger permissions
-- The handle_new_user() function needs to bypass RLS when creating initial profile

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Recreate function with proper permissions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert into profiles (bypasses RLS due to SECURITY DEFINER)
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'student');

  -- Insert into user_state (bypasses RLS due to SECURITY DEFINER)
  INSERT INTO public.user_state (user_id, current_phase)
  VALUES (NEW.id, 'ONBOARDING');

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail auth signup
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
