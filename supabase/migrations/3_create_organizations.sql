CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- A (custom) slug (e.g. `example-organization-name`). Used for URL of the organization's page. Must be between 3 and 36 (length of a standard UUID string) characters inclusive. Must be URL safe; allow lowercase letters, numbers, and hyphens. Cannot have leading/trailing hyphens. Cannot have 2 or more consecutive hyphens.
  slug text UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9]))*[a-z0-9]$' AND slug = lower(slug) AND length(slug) BETWEEN 3 AND 36),

  -- The user ID of the owner of this organization.
  owner_id uuid NOT NULL REFERENCES auth.users(id),

  -- The organization name. Must be between 1 and 50 characters inclusive.
  organization_name text NOT NULL CHECK (length(organization_name) BETWEEN 1 AND 50),

  -- An optional description of the organization. Must be between 1 and 1000 characters inclusive.
  description text CHECK (length(description) BETWEEN 1 AND 1000),

  -- An optional URL to the avatar of the organization. Must be at most 500 characters.
  avatar_url text CHECK (avatar_url IS NULL OR length(avatar_url) <= 500),

  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_owner_id ON public.organizations(owner_id);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Normalize to lower case
CREATE OR REPLACE FUNCTION normalize_org_slug()
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

CREATE TRIGGER trg_normalize_org_slug
BEFORE INSERT OR UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION normalize_org_slug();

-- Reject reserved keywords as slugs (defined in public.reserved_slugs)
CREATE OR REPLACE FUNCTION reject_reserved_organization_slugs()
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

-- Attach the trigger to organizations
CREATE TRIGGER trg_reject_reserved_org_slugs
BEFORE INSERT OR UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION reject_reserved_organization_slugs();