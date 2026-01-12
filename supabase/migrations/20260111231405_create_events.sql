CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- A (custom) slug (e.g. `example-event-name`). Used for URL of the event's page. Must be between 3 and 36 (length of a standard UUID string) characters inclusive. Must be URL safe; allow lowercase letters, numbers, and hyphens. Cannot have leading/trailing hyphens. Cannot have 2 or more consecutive hyphens.
  slug text UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9]))*[a-z0-9]$' AND slug = lower(slug) AND length(slug) BETWEEN 3 AND 36),

  -- The user ID of the creator of this event.
  owner_id uuid NOT NULL REFERENCES auth.users(id),

  -- The ID of the organization this event belongs to.
  organization_id uuid DEFAULT NULL REFERENCES public.organizations(id) ON DELETE SET NULL,

  -- The organization name. Must be between 1 and 50 characters inclusive.
  event_name text NOT NULL CHECK (length(event_name) BETWEEN 1 AND 50),

  -- The location of the event. Must be between 1 and 200 characters inclusive.
  location text NOT NULL CHECK (length(location) BETWEEN 1 AND 200),

  -- The maximum number of signups this event can have. Must be between 1 and 300 inclusive.
  capacity integer NOT NULL CHECK (capacity BETWEEN 1 AND 300),

  -- An optional description of the event. Must be between 1 and 1000 characters inclusive.
  description text CHECK (length(description) BETWEEN 1 AND 1000),

  -- The start time of the event.
  start_time timestamptz NOT NULL,

  -- An optional end time of the event. Must be after the start time.
  end_time timestamptz CHECK (end_time > start_time),

  -- An optional URL to a picture that represents this event. Must be at most 500 characters.
  photo_url text CHECK (photo_url IS NULL OR length(photo_url) <= 500),

  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX events_org_id_idx ON public.events(organization_id);
CREATE INDEX events_owner_id_idx ON public.events(owner_id);

-- Normalize to lower case
CREATE OR REPLACE FUNCTION normalize_event_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.slug := lower(NEW.slug);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_normalize_event_slug
BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION normalize_event_slug();

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events: read access for owner"
  ON public.events
  FOR SELECT
  USING((SELECT auth.uid()) = owner_id);

REVOKE ALL ON public.events FROM PUBLIC;
GRANT SELECT ON public.events TO authenticated;