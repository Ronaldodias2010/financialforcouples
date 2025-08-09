-- Prevent duplicate account names per user (case-sensitive)
CREATE OR REPLACE FUNCTION public.prevent_duplicate_account_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF EXISTS (
      SELECT 1 FROM public.accounts
      WHERE user_id = NEW.user_id AND name = NEW.name
    ) THEN
      RAISE EXCEPTION 'duplicate_account_name' USING HINT = 'Já existe uma conta com este nome para este usuário.';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF EXISTS (
      SELECT 1 FROM public.accounts
      WHERE user_id = NEW.user_id AND name = NEW.name AND id <> NEW.id
    ) THEN
      RAISE EXCEPTION 'duplicate_account_name' USING HINT = 'Já existe uma conta com este nome para este usuário.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_duplicate_account_name ON public.accounts;
CREATE TRIGGER trg_prevent_duplicate_account_name
BEFORE INSERT OR UPDATE ON public.accounts
FOR EACH ROW EXECUTE FUNCTION public.prevent_duplicate_account_name();