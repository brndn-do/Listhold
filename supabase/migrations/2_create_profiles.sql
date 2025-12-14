CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- The display name of the user. Can be null/empty. Maximum 100 characters.
  display_name text CHECK (length(display_name) <= 100),

  -- An optional URL for the user's avatar. Must be between 10 and 500 characters inclusive.
  avatar_url text CHECK (avatar_url IS NULL OR length(avatar_url) BETWEEN 10 AND 500)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles: users can read their own profile"
  ON public.profiles
  FOR SELECT
  USING ((select auth.uid()) = id);

CREATE POLICY "Profiles: users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Profiles: users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);