CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles: public read access"
  ON public.profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Profiles: users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Profiles: users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);