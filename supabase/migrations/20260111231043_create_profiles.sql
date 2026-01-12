CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- The display name of the user. Can be null/empty. Maximum 100 characters.
  display_name text CHECK (length(display_name) <= 100),

  -- An optional URL for the user's avatar. Must be at most 500 characters.
  avatar_url text CHECK (avatar_url IS NULL OR length(avatar_url) <= 500)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles: public read access"
  ON public.profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Profiles: users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Profiles: users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

REVOKE ALL ON public.profiles FROM PUBLIC;
GRANT SELECT ON public.profiles TO PUBLIC;