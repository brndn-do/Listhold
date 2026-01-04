CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- A (custom) slug (e.g. `example-event-name`). Used for URL of the event's page. Must be between 3 and 36 (length of a standard UUID string) characters inclusive. Must be URL safe; allow lowercase letters, numbers, and hyphens. Cannot have leading/trailing hyphens. Cannot have 2 or more consecutive hyphens.
  slug text UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9]))*[a-z0-9]$' AND slug = lower(slug) AND length(slug) BETWEEN 3 AND 36),

  -- The user ID of the creator of this event.
  creator_id uuid NOT NULL REFERENCES auth.users(id),

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

CREATE INDEX idx_org_id ON public.events(organization_id);
CREATE INDEX idx_creator_id ON public.events(creator_id);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

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

-- Reject reserved keywords as slugs (defined in public.reserved_slugs)
CREATE OR REPLACE FUNCTION reject_reserved_event_slugs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if the new slug exists in the reserved_slugs table
  IF EXISTS (
    SELECT 1
    FROM public.reserved_slugs
    WHERE slug = NEW.slug
  ) THEN
    RAISE EXCEPTION 'Slug "%" is reserved', NEW.slug
      USING ERRCODE = '23514';  -- check_violation
  END IF;

  RETURN NEW;
END;
$$;

-- Attach the trigger to events
CREATE TRIGGER trg_reject_reserved_event_slugs
BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION reject_reserved_event_slugs();