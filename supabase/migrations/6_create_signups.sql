CREATE TYPE signup_status_enum AS ENUM ('confirmed', 'waitlisted', 'withdrawn');

CREATE TABLE public.signups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

  status signup_status_enum NOT NULL,

  -- Stores answers to prompts.
  -- Keys are prompt IDs (uuid), Values are the answers.
  -- Example: { "uuid-1": "Yes", "uuid-2": ["A", "B"] }
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,

  last_updated timestamptz NOT NULL DEFAULT now(),

  created_at timestamptz NOT NULL DEFAULT now(),

  -- Ensure no duplicate signups under one event
  UNIQUE (user_id, event_id)
);

CREATE OR REPLACE FUNCTION set_last_updated()
RETURNS trigger AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER signups_last_updated
BEFORE UPDATE ON public.signups
FOR EACH ROW
EXECUTE FUNCTION set_last_updated();

CREATE INDEX signups_event_id_idx ON public.signups(event_id);
CREATE INDEX signups_user_id_idx ON public.signups(user_id);

ALTER TABLE public.signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signups: public read access"
  ON public.signups
  FOR SELECT
  USING(true);