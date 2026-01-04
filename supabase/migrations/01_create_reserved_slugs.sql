-- List of slugs that are reserved.
-- Example: `new` should be reserved since `/organizations/new` is the organization creation page.

CREATE TABLE public.reserved_slugs (
  -- The reserved keyword (must match slug rules)
  slug text PRIMARY KEY
    CHECK (
      slug ~ '^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9]))*[a-z0-9]$'
      AND slug = lower(slug)
      AND length(slug) BETWEEN 3 AND 36
    ),

  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seeds
INSERT INTO public.reserved_slugs (slug) VALUES
  -- Auth / identity
  ('login'),
  ('logout'),
  ('signin'),
  ('signup'),
  ('signout'),
  ('register'),
  ('auth'),
  ('oauth'),
  ('callback'),
  ('verify'),
  ('reset'),
  ('password'),

  -- System / admin
  ('admin'),
  ('root'),
  ('system'),
  ('internal'),
  ('staff'),
  ('support'),

  -- API / technical
  ('api'),
  ('graphql'),
  ('rpc'),
  ('webhook'),
  ('hooks'),

  -- User & account
  ('self'),
  ('account'),
  ('accounts'),
  ('user'),
  ('users'),
  ('profile'),

  -- App pages
  ('dashboard'),
  ('home'),
  ('index'),
  ('app'),
  ('apps'),
  ('console'),
  ('portal'),
  ('workspace'),
  ('workspaces'),

  -- Settings & billing
  ('settings'),
  ('preferences'),
  ('billing'),
  ('payments'),
  ('plans'),
  ('pricing'),
  ('subscription'),
  ('subscriptions'),

  -- CRUD / actions
  ('new'),
  ('create'),
  ('edit'),
  ('update'),
  ('delete'),
  ('remove'),

  -- Marketing / public
  ('about'),
  ('contact'),
  ('help'),
  ('docs'),
  ('documentation'),
  ('blog'),
  ('news'),
  ('press'),
  ('careers'),
  ('jobs'),
  ('status'),

  -- Assets / misc
  ('assets'),
  ('static'),
  ('public'),
  ('uploads'),
  ('media'),
  ('files'),
  ('cdn'),

  -- Discovery
  ('search'),
  ('explore'),
  ('browse'),
  ('categories'),
  ('tags')

ON CONFLICT (slug) DO NOTHING;

-- RLS
ALTER TABLE public.reserved_slugs ENABLE ROW LEVEL SECURITY;
