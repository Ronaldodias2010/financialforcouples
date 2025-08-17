-- Ensure user_id is always attributed to the authenticated user for client writes
-- without breaking internal SECURITY DEFINER operations

CREATE OR REPLACE FUNCTION public.set_user_id_on_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If user_id is not provided by client, set it from auth context
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- Attach the trigger to tables where user_id identifies the owner
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT unnest(ARRAY[
    'accounts',
    'cards',
    'categories',
    'investments',
    'recurring_expenses',
    'transactions',
    'card_mileage_rules',
    'mileage_goals',
    'mileage_history'
  ]) AS tbl LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_set_user_id_on_insert_%I ON public.%I;
      CREATE TRIGGER trg_set_user_id_on_insert_%I
      BEFORE INSERT ON public.%I
      FOR EACH ROW
      EXECUTE FUNCTION public.set_user_id_on_insert();
    ', r.tbl, r.tbl, r.tbl, r.tbl);
  END LOOP;
END $$;
