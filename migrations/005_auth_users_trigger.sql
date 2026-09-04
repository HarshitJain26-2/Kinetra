-- ==============================================================================
-- Kinetra User Synchronization Trigger - Migration 005
-- Automatically provisions public.users profile when auth.users is created
-- and backfills any un-provisioned existing auth users.
-- ==============================================================================

-- 1. Automatic Provisioning Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, display_name, fitness_level, onboarding_done)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'display_name', 'Athlete'),
    'beginner',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill existing auth.users who lack a row in public.users
INSERT INTO public.users (id, display_name, fitness_level, onboarding_done)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'display_name', 'Athlete'),
  'beginner',
  false
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 4. RLS Policy: Allow authenticated users to INSERT their own profile row
DROP POLICY IF EXISTS users_insert_own ON public.users;
CREATE POLICY users_insert_own ON public.users
  FOR INSERT
  WITH CHECK (id = auth.uid());

