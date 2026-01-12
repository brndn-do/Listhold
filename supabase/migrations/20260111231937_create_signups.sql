CREATE TYPE signup_status_enum AS ENUM ('confirmed', 'waitlisted', 'withdrawn');

CREATE TABLE public.signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

  status signup_status_enum NOT NULL,

  last_updated timestamptz NOT NULL DEFAULT now(),

  created_at timestamptz NOT NULL DEFAULT now(),

  -- Ensure no duplicate signups under one event
  UNIQUE (user_id, event_id)
);

CREATE INDEX signups_event_id_idx ON public.signups(event_id);
CREATE INDEX signups_user_id_idx ON public.signups(user_id);

CREATE OR REPLACE FUNCTION set_last_updated()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER signups_last_updated
BEFORE UPDATE ON public.signups
FOR EACH ROW
EXECUTE FUNCTION set_last_updated();

ALTER TABLE public.signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signups: public read access"
  ON public.signups
  FOR SELECT
  USING (true);

ALTER publication supabase_realtime ADD TABLE public.signups;

REVOKE ALL ON public.signups FROM PUBLIC;
GRANT SELECT ON public.signups TO PUBLIC;