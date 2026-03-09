CREATE OR REPLACE FUNCTION public.update_account_balance_on_transaction()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  old_effect NUMERIC := 0;
  new_effect NUMERIC := 0;
BEGIN
  -- DELETE: reverter o efeito antigo
  IF TG_OP = 'DELETE' THEN
    IF OLD.account_id IS NOT NULL THEN
      -- Skip card_payment on delete too
      IF COALESCE(OLD.card_transaction_type, '') = 'card_payment' THEN
        RETURN OLD;
      END IF;
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

  -- SKIP card_payment transactions (balance handled by process_card_payment)
  IF COALESCE(NEW.card_transaction_type, '') = 'card_payment' THEN
    RETURN NEW;
  END IF;

  -- Pré-cálculo de efeitos
  IF TG_OP = 'UPDATE' AND OLD.account_id IS NOT NULL THEN
    IF OLD.type = 'expense' THEN
      old_effect := -COALESCE(OLD.amount, 0);
    ELSIF OLD.type = 'income' THEN
      old_effect := COALESCE(OLD.amount, 0);
    END IF;
  END IF;

  IF NEW.account_id IS NOT NULL THEN
    IF NEW.type = 'expense' THEN
      new_effect := -COALESCE(NEW.amount, 0);
    ELSIF NEW.type = 'income' THEN
      new_effect := COALESCE(NEW.amount, 0);
    END IF;
  END IF;

  -- INSERT: aplicar apenas uma vez
  IF TG_OP = 'INSERT' THEN
    IF NEW.account_id IS NOT NULL THEN
      UPDATE public.accounts
      SET balance = balance + new_effect,
          updated_at = now()
      WHERE id = NEW.account_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (OLD.account_id IS DISTINCT FROM NEW.account_id)
       OR (OLD.type IS DISTINCT FROM NEW.type)
       OR (OLD.amount IS DISTINCT FROM NEW.amount) THEN

      IF OLD.account_id IS NOT NULL THEN
        UPDATE public.accounts
        SET balance = balance - old_effect,
            updated_at = now()
        WHERE id = OLD.account_id;
      END IF;

      IF NEW.account_id IS NOT NULL THEN
        UPDATE public.accounts
        SET balance = balance + new_effect,
            updated_at = now()
        WHERE id = NEW.account_id;
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;