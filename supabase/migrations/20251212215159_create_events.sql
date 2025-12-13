CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug text UNIQUE NOT NULL,
  creator_id uuid REFERENCES auth.users(id) NOT NULL,
  event_name text NOT NULL CHECK (length(event_name) >= 2 AND length(event_name) < 50),
  location text NOT NULL CHECK (length(location) >= 2 AND length(location) < 300),
  description text CHECK (length(description) >= 2 AND length(description) <= 1000),
  organization_id uuid REFERENCES public.organizations(id) NOT NULL,
  capacity integer NOT NULL CHECK (capacity > 0 AND capacity < 300),
  start_time timestamptz NOT NULL,
  end_time timestamptz CHECK (end_time > start_time),
  signupsCount integer NOT NULL DEFAULT 0,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT slug_url_safe CHECK (slug ~ '^[A-Za-z0-9](?:[A-Za-z0-9]|[-_](?=[A-Za-z0-9]))*[A-Za-z0-9]$' AND length(slug) >= 2 AND length(slug) < 50)
);

CREATE INDEX idx_organization ON public.events(organization_id);
CREATE INDEX idx_creator_id ON public.events(creator_id);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;