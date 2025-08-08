-- Set available limit on card insert/update and validate credit card limit on transactions

-- 1) Function + trigger to compute available limit (initial_balance) and current_balance on cards
CREATE OR REPLACE FUNCTION public.set_card_available_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  expense_sum NUMERIC;
BEGIN
  -- Sum of all expenses on this card
  SELECT COALESCE(SUM(amount), 0) INTO expense_sum
  FROM public.transactions
  WHERE card_id = NEW.id AND type = 'expense';

  -- Current invoice total
  NEW.current_balance := COALESCE(expense_sum, 0);

  -- Available limit: credit_limit - initial_balance_original - expenses
  NEW.initial_balance := GREATEST(
    0,
    COALESCE(NEW.credit_limit, 0) - COALESCE(NEW.initial_balance_original, 0) - COALESCE(expense_sum, 0)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_card_available ON public.cards;
CREATE TRIGGER trg_set_card_available
BEFORE INSERT OR UPDATE OF credit_limit, initial_balance_original
ON public.cards
FOR EACH ROW
EXECUTE FUNCTION public.set_card_available_fields();


-- 2) Function + trigger to validate card limit BEFORE inserting/updating expense transactions
CREATE OR REPLACE FUNCTION public.validate_transaction_card_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  expense_sum NUMERIC;
  available NUMERIC;
  card_credit_limit NUMERIC;
  card_initial_original NUMERIC;
  target_card_id UUID;
BEGIN
  IF NEW.type = 'expense' AND NEW.card_id IS NOT NULL THEN
    target_card_id := NEW.card_id;

    -- Get card data
    SELECT credit_limit, initial_balance_original
      INTO card_credit_limit, card_initial_original
    FROM public.cards
    WHERE id = target_card_id;

    IF card_credit_limit IS NULL THEN
      -- If no credit limit defined, treat as 0 available
      card_credit_limit := 0;
    END IF;

    -- Sum of other expenses (exclude current row on UPDATE)
    IF TG_OP = 'UPDATE' THEN
      SELECT COALESCE(SUM(amount), 0) INTO expense_sum
      FROM public.transactions
      WHERE card_id = target_card_id AND type = 'expense' AND id <> NEW.id;
    ELSE
      SELECT COALESCE(SUM(amount), 0) INTO expense_sum
      FROM public.transactions
      WHERE card_id = target_card_id AND type = 'expense';
    END IF;

    available := COALESCE(card_credit_limit, 0) - COALESCE(card_initial_original, 0) - COALESCE(expense_sum, 0);

    IF NEW.amount > GREATEST(available, 0) THEN
      RAISE EXCEPTION 'Limite do cartão insuficiente. Disponível: %, Tentativa: %', available, NEW.amount;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_card_limit_ins_upd ON public.transactions;
CREATE TRIGGER trg_validate_card_limit_ins_upd
BEFORE INSERT OR UPDATE
ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.validate_transaction_card_limit();

-- 3) Ensure card balances are kept in sync after transaction changes
DROP TRIGGER IF EXISTS trg_update_card_balance_ins_upd_del ON public.transactions;
CREATE TRIGGER trg_update_card_balance_ins_upd_del
AFTER INSERT OR UPDATE OR DELETE
ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_card_balance();