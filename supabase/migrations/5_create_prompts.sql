CREATE TYPE prompt_type_enum AS ENUM ('yes/no', 'notice');

CREATE TABLE public.prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

  -- The order the prompt appears in the sign-up flow
  display_order integer NOT NULL CHECK (display_order > 0),

  -- The type of input to render.
  prompt_type prompt_type_enum NOT NULL,

  -- The prompt label (e.g. "Are you a new member?")
  prompt_text text NOT NULL CHECK (length(prompt_text) BETWEEN 1 AND 100),

  -- Whether the user must answer this prompt
  is_required boolean NOT NULL DEFAULT true,

  -- Whether user's answers should be hidden from public view (organizer only)
  is_private boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),

  -- Ensure no two prompts have the same position for the same event
  UNIQUE (event_id, display_order)
);

-- Enable RLS
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
