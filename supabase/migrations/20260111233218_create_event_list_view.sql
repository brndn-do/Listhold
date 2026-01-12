CREATE OR REPLACE VIEW public.event_list_view
WITH (security_invoker = true)
AS
SELECT
  s.id AS signup_id,
  s.user_id,
  s.event_id,
  s.status,
  s.last_updated,
  s.created_at,
  p.display_name,
  p.avatar_url,
  COALESCE(
    (
      SELECT jsonb_object_agg(a.prompt_id, a.answer)
      FROM public.answers a
      WHERE a.signup_id = s.id
    ),
  '{}'::jsonb
  ) AS answers
FROM public.signups s
JOIN public.profiles p ON s.user_id = p.id;