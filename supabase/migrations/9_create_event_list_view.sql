CREATE OR REPLACE VIEW public.event_list
WITH (security_invoker = on)
AS
SELECT
  s.id AS signup_id,
  s.user_id,
  s.event_id,
  s.status,
  s.last_updated,
  s.created_at,
  p.display_name,
  p.avatar_url
FROM public.signups s
JOIN public.profiles p ON s.user_id = p.id