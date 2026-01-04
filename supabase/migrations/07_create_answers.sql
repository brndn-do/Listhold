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