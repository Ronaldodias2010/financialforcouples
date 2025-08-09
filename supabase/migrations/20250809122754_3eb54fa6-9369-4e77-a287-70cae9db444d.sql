-- Function to update account balance on transaction changes
CREATE OR REPLACE FUNCTION public.update_account_balance_on_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  old_effect NUMERIC := 0;
  new_effect NUMERIC := 0;
BEGIN
  -- Handle DELETE: revert OLD effect
  IF TG_OP = 'DELETE' THEN
    IF OLD.account_id IS NOT NULL THEN
      -- For expenses, OLD reduced balance; revert by adding back
      IF OLD.type = 'expense' THEN
        UPDATE public.accounts
        SET balance = balance + COALESCE(OLD.amount, 0),
            updated_at = now()
        WHERE id = OLD.account_id;
      ELSIF OLD.type = 'income' THEN
        UPDATE public.accounts
        SET balance = balance - COALESCE(OLD.amount, 0),
            updated_at = now()
        WHERE id = OLD.account_id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  -- Compute OLD effect for UPDATE (if applicable)
  IF TG_OP = 'UPDATE' AND OLD.account_id IS NOT NULL THEN
    IF OLD.type = 'expense' THEN
      old_effect := -COALESCE(OLD.amount, 0); -- expense decreased balance
    ELSIF OLD.type = 'income' THEN
      old_effect := COALESCE(OLD.amount, 0); -- income increased balance
    END IF;
  END IF;

  -- Compute NEW effect for INSERT/UPDATE
  IF NEW.account_id IS NOT NULL THEN
    IF NEW.type = 'expense' THEN
      new_effect := -COALESCE(NEW.amount, 0);
    ELSIF NEW.type = 'income' THEN
      new_effect := COALESCE(NEW.amount, 0);
    END IF;
  END IF;

  -- Apply changes depending on operation
  IF TG_OP = 'INSERT' THEN
    IF NEW.account_id IS NOT NULL THEN
      UPDATE public.accounts
      SET balance = balance + new_effect,
          updated_at = now()
      WHERE id = NEW.account_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- If account changed, revert OLD to old account and apply NEW to new account
    IF OLD.account_id IS NOT NULL AND (OLD.account_id <> NEW.account_id OR OLD.type <> NEW.type OR OLD.amount <> NEW.amount) THEN
      -- Revert OLD on old account
      IF OLD.account_id IS NOT NULL THEN
        UPDATE public.accounts
        SET balance = balance - old_effect, -- subtracting negative is adding back
            updated_at = now()
        WHERE id = OLD.account_id;
      END IF;
    END IF;

    -- Apply NEW to the new/current account
    IF NEW.account_id IS NOT NULL THEN
      UPDATE public.accounts
      SET balance = balance + new_effect,
          updated_at = now()
      WHERE id = NEW.account_id;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

-- Create trigger on transactions
DROP TRIGGER IF EXISTS trg_update_account_balance_on_transaction ON public.transactions;
CREATE TRIGGER trg_update_account_balance_on_transaction
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_account_balance_on_transaction();