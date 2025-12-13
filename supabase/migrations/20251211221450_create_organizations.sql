CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug text UNIQUE NOT NULL,
  owner_id uuid REFERENCES auth.users(id) NOT NULL,
  organization_name text NOT NULL CHECK (length(organization_name) >= 2 AND length(organization_name) < 50),
  description text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT slug_url_safe CHECK (slug ~ '^[A-Za-z0-9](?:[A-Za-z0-9]|[-_](?=[A-Za-z0-9]))*[A-Za-z0-9]$' AND length(slug) >= 2 AND length(slug) < 50)
);

CREATE INDEX idx_owner_id ON public.organizations(owner_id);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;