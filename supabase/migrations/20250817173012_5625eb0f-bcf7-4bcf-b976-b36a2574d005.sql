-- Ensure correct owner_user attribution for all writes and fix existing data

-- Helper function to determine owner_user based on user_couples
CREATE OR REPLACE FUNCTION public.determine_owner_user(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM public.user_couples uc
      WHERE uc.status = 'active' AND uc.user1_id = p_user_id
    ) THEN 'user1'
    WHEN EXISTS (
      SELECT 1 FROM public.user_couples uc
      WHERE uc.status = 'active' AND uc.user2_id = p_user_id
    ) THEN 'user2'
    ELSE 'user1'
  END;
$$;

-- Trigger function to set owner_user on insert if missing or incorrect
CREATE OR REPLACE FUNCTION public.set_owner_user_on_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW; -- let constraints handle it
  END IF;

  -- Always set to the correct value to avoid race conditions from clients
  NEW.owner_user := public.determine_owner_user(NEW.user_id);
  RETURN NEW;
END;
$$;

-- Create triggers on relevant tables (only those that have owner_user)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT unnest(ARRAY['accounts','cards','categories','investments','recurring_expenses','transactions']) AS tbl LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_set_owner_user_on_insert_%I ON public.%I;
      CREATE TRIGGER trg_set_owner_user_on_insert_%I
      BEFORE INSERT ON public.%I
      FOR EACH ROW
      EXECUTE FUNCTION public.set_owner_user_on_insert();
    ', r.tbl, r.tbl, r.tbl, r.tbl);
  END LOOP;
END $$;

-- One-time data correction to align existing rows
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT unnest(ARRAY['accounts','cards','categories','investments','recurring_expenses','transactions']) AS tbl LOOP
    EXECUTE format('
      UPDATE public.%I AS t
      SET owner_user = public.determine_owner_user(t.user_id)
      WHERE t.user_id IS NOT NULL
        AND (t.owner_user IS NULL OR t.owner_user NOT IN (''user1'',''user2'') OR t.owner_user <> public.determine_owner_user(t.user_id));
    ', r.tbl);
  END LOOP;
END $$;
