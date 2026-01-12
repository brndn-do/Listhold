CREATE TABLE public.answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  signup_id uuid NOT NULL REFERENCES public.signups(id) ON DELETE CASCADE,

  prompt_id uuid NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,

  answer jsonb NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  -- Ensure no duplicate answers
  UNIQUE (signup_id, prompt_id)
);

CREATE INDEX answers_signup_id_idx ON public.answers(signup_id);

ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Answers: select access policy"
  ON public.answers
  FOR SELECT
  USING(
    -- 1. User owns the signup (their own answer)
    EXISTS(
      SELECT 1 FROM public.signups
      WHERE public.signups.id = public.answers.signup_id
      AND public.signups.user_id = (SELECT auth.uid())
    )
    OR
    -- 2. Public prompt OR Event Owner (Optimized to share the prompts lookup)
    EXISTS(
      SELECT 1 FROM public.prompts
      LEFT JOIN public.events ON public.events.id = public.prompts.event_id
      WHERE public.prompts.id = public.answers.prompt_id
      AND (
        public.prompts.is_private = false
        OR
        public.events.owner_id = (SELECT auth.uid())
      )
    )
  );

REVOKE ALL ON public.answers FROM PUBLIC;
GRANT SELECT ON public.answers TO PUBLIC;
