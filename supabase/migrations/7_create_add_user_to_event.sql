CREATE OR REPLACE FUNCTION add_user_to_event(p_user_id uuid, p_event_id uuid, p_answers jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_capacity int;
  v_confirmed_count int;
  v_status signup_status_enum;
  v_old_status signup_status_enum;
  v_signup_id uuid;
BEGIN
  -- Read the event capacity and lock the entire row
  -- event.capacity cannot change while this function is running.
  -- Other functions that create/update/delete a signup for an event MUST start with this same lock.
  SELECT capacity INTO v_capacity FROM public.events
  WHERE id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event % not found', p_event_id;
  END IF;

  -- Check if user is already signed up
  SELECT id, status INTO v_signup_id, v_old_status
  FROM public.signups
  WHERE user_id = p_user_id AND event_id = p_event_id;

  -- If they are already signed up and NOT withdrawn, just return their current status
  IF FOUND AND v_old_status <> 'withdrawn' THEN
    RETURN jsonb_build_object('id', v_signup_id, 'status', v_old_status);
  END IF;

  IF v_capacity IS NULL THEN
    -- assume unlimited capacity
    v_status := 'confirmed';
  ELSE
    -- count how many signups under this event are confirmed.
    -- Under READ COMMITED isolation level, this will be the most updated state.
    -- Other transactions cannot start counting confirmed signups until THIS transaction finishes (assuming they all start by reading event.capacity, which we locked).
    SELECT COUNT(*) INTO v_confirmed_count FROM public.signups
    WHERE event_id = p_event_id AND status = 'confirmed';
    IF v_confirmed_count < v_capacity THEN
      -- there is a free spot!
      v_status := 'confirmed';
    ELSE
      -- capacity is filled
      v_status := 'waitlisted';
    END IF;
  END IF;
  
  -- Other transactions cannot make insert/delete/update signups until THIS transaction finishes (assuming they all start by reading event.capacity, which we locked).
  
  IF v_signup_id IS NOT NULL THEN
    -- User was previously withdrawn, so update their record.
    -- Reset created_at to now() so they go to the back of the waitlist if applicable.
    UPDATE public.signups
    SET status = v_status,
        answers = COALESCE(p_answers, '{}'::jsonb),
        created_at = now(),
        last_updated = now()
    WHERE id = v_signup_id;
  ELSE
    -- New signup
    INSERT INTO public.signups (user_id, event_id, status, answers)
    VALUES (p_user_id, p_event_id, v_status, COALESCE(p_answers, '{}'::jsonb))
    RETURNING id INTO v_signup_id;
  END IF;

  RETURN jsonb_build_object('id', v_signup_id, 'status', v_status);
END;
$$;