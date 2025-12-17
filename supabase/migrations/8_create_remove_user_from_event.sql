CREATE OR REPLACE FUNCTION remove_user_from_event(p_user_id uuid, p_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_capacity int;
  v_confirmed_count int;
  v_status signup_status_enum;
  v_signup_id uuid;
BEGIN
  -- Read the event capacity and lock the entire row
  -- event.capacity cannot change while this function is running.
  -- Other functinons that create/update/delete a signup for an event MUST start with this same lock.
  SELECT capacity INTO v_capacity FROM public.events
  WHERE id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event % not found', p_event_id;
  END IF;

  SELECT id, status INTO v_signup_id, v_status
  FROM public.signups
  WHERE user_id = p_user_id AND event_id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Do nothing and return
    RETURN '{}'::jsonb;
  END IF;
  -- if status is already withdrawn do nothing and return
  -- if status is waitlisted, set to withdrawn and return
  -- if status is confirmed, set to withdrawn, then promote next person on waitlist (if exist), then return
  -- Then, send email to that person (if exist)
