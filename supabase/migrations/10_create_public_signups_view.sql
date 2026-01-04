CREATE OR REPLACE VIEW public.public_signups_view
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
      JOIN public.prompts pr ON a.prompt_id = pr.id
      WHERE a.signup_id = s.id
      AND pr.is_private = false
    ),
  '{}'::jsonb
  ) AS public_answers
FROM public.signups s
JOIN public.profiles p ON s.user_id = p.id;