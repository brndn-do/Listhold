ALTER TABLE public.signups
  ADD COLUMN position numeric(20,10);

-- Backfill existing rows deterministically and leave large gaps for in-between inserts
WITH ordered AS (
  SELECT
    id,
    (row_number() OVER (PARTITION BY event_id ORDER BY created_at, id) * 100000)::numeric(20,10) AS new_position
  FROM public.signups
)
UPDATE public.signups AS s
SET position = o.new_position
FROM ordered AS o
WHERE s.id = o.id;

-- Make position required for all rows
ALTER TABLE public.signups
  ALTER COLUMN position SET NOT NULL;

-- Add positive constraint
ALTER TABLE public.signups
  ADD CONSTRAINT signups_position_positive CHECK (position > 0);

-- No duplicate positions in an event
CREATE UNIQUE INDEX signups_event_position_uidx
  ON public.signups (event_id, position);

CREATE OR REPLACE FUNCTION public.assign_signup_position()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  max_position numeric(20,10);
BEGIN
  IF NEW.position IS NULL THEN
    -- Serialize appends per event to avoid duplicate max+step during concurrent inserts
    PERFORM pg_advisory_xact_lock(hashtext(NEW.event_id::text));

    SELECT s.position
    INTO max_position
    FROM public.signups AS s
    WHERE s.event_id = NEW.event_id
    ORDER BY s.position DESC
    LIMIT 1;

    NEW.position := COALESCE(max_position, 0) + 100000;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER signups_assign_position
BEFORE INSERT ON public.signups
FOR EACH ROW
EXECUTE FUNCTION public.assign_signup_position();
