CREATE OR REPLACE FUNCTION remove_user_from_event(p_user_id uuid, p_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_capacity int;
  v_confirmed_count int;
  v_old_status signup_status_enum;
  v_signup_id uuid;
  v_promoted_user_id uuid;
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

  -- Get current signup status
  SELECT id, status INTO v_signup_id, v_old_status
  FROM public.signups
  WHERE user_id = p_user_id AND event_id = p_event_id
  FOR UPDATE; -- Lock this signup row

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Signup not found');
  END IF;

  -- Case where user is already withdrawn
  IF v_old_status = 'withdrawn' THEN
    RETURN jsonb_build_object(
      'signup_id', v_signup_id,
      'old_status', 'withdrawn',
      'new_status', 'withdrawn',
      'promoted_user_id', null
    );
  END IF;

  -- Mark user as withdrawn
  UPDATE public.signups
  SET status = 'withdrawn', updated_at = now()
  WHERE id = v_signup_id;

  -- Handle Waitlist Promotion only if they were on confirmed
  v_promoted_user_id := NULL;
  
  IF v_old_status = 'confirmed' THEN
    -- Double check current confirmed count to see if we have space
    SELECT COUNT(*) INTO v_confirmed_count
    FROM public.signups
    WHERE event_id = p_event_id AND status = 'confirmed';

    -- If capacity is unlimited (NULL) OR we are now below capacity
    IF v_capacity IS NULL OR v_confirmed_count < v_capacity THEN
      -- Find the next person on the waitlist (ordered by created_at)
      SELECT user_id INTO v_promoted_user_id
      FROM public.signups
      WHERE event_id = p_event_id AND status = 'waitlisted'
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE; -- Lock the row we are about to promote

      IF v_promoted_user_id IS NOT NULL THEN
        UPDATE public.signups
        SET status = 'confirmed', updated_at = now()
        WHERE user_id = v_promoted_user_id AND event_id = p_event_id;
      END IF;
    END IF;
  END IF;

  -- 5. Return result
  RETURN jsonb_build_object(
    'signup_id', v_signup_id,
    'old_status', v_old_status,
    'new_status', 'withdrawn',
    'promoted_user_id', v_promoted_user_id
  );
END;
$$;
