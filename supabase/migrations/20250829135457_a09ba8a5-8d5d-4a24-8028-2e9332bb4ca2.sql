-- Modificar função para permitir gastos acima do limite em cartões de crédito
CREATE OR REPLACE FUNCTION public.validate_transaction_card_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  expense_sum NUMERIC;
  available NUMERIC;
  card_credit_limit NUMERIC;
  card_initial_original NUMERIC;
  card_type_value text;
  target_card_id UUID;
BEGIN
  IF NEW.type = 'expense' AND NEW.card_id IS NOT NULL THEN
    target_card_id := NEW.card_id;

    -- Get card data including card_type
    SELECT credit_limit, initial_balance_original, card_type
      INTO card_credit_limit, card_initial_original, card_type_value
    FROM public.cards
    WHERE id = target_card_id;

    -- Skip validation for credit cards (allow over-limit spending like emergency credit)
    -- Only validate for debit cards which must respect account limits
    IF card_type_value = 'credit' THEN
      RETURN NEW;
    END IF;

    -- Continue with validation for debit cards
    IF card_credit_limit IS NULL THEN
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
$function$;

-- Modificar função para permitir saldo negativo em cartões de crédito
CREATE OR REPLACE FUNCTION public.handle_card_available_on_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  avail NUMERIC;
  card_type_value text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'expense' AND NEW.card_id IS NOT NULL THEN
      -- Get card type to determine validation behavior
      SELECT card_type INTO card_type_value FROM public.cards WHERE id = NEW.card_id;
      
      -- For credit cards, allow over-limit spending (emergency credit)
      IF card_type_value = 'credit' THEN
        UPDATE public.cards
        SET initial_balance = COALESCE(initial_balance,0) - COALESCE(NEW.amount,0),
            current_balance = COALESCE(current_balance,0) + COALESCE(NEW.amount,0),
            updated_at = now()
        WHERE id = NEW.card_id;
      ELSE
        -- For debit cards, maintain existing validation
        SELECT initial_balance INTO avail FROM public.cards WHERE id = NEW.card_id FOR UPDATE;
        IF avail IS NULL THEN
          avail := 0;
        END IF;
        IF NEW.amount > GREATEST(avail, 0) THEN
          RAISE EXCEPTION 'Limite do cartão insuficiente. Disponível: %, Tentativa: %', avail, NEW.amount;
        END IF;
        UPDATE public.cards
        SET initial_balance = GREATEST(0, COALESCE(initial_balance,0) - COALESCE(NEW.amount,0)),
            current_balance = COALESCE(current_balance,0) + COALESCE(NEW.amount,0),
            updated_at = now()
        WHERE id = NEW.card_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Revert OLD effect if it was an expense with a card
    IF OLD.type = 'expense' AND OLD.card_id IS NOT NULL THEN
      UPDATE public.cards
      SET initial_balance = COALESCE(initial_balance,0) + COALESCE(OLD.amount,0),
          current_balance = GREATEST(0, COALESCE(current_balance,0) - COALESCE(OLD.amount,0)),
          updated_at = now()
      WHERE id = OLD.card_id;
    END IF;

    -- Apply NEW effect if it is an expense with a card
    IF NEW.type = 'expense' AND NEW.card_id IS NOT NULL THEN
      -- Get card type to determine validation behavior
      SELECT card_type INTO card_type_value FROM public.cards WHERE id = NEW.card_id;
      
      -- For credit cards, allow over-limit spending
      IF card_type_value = 'credit' THEN
        UPDATE public.cards
        SET initial_balance = COALESCE(initial_balance,0) - COALESCE(NEW.amount,0),
            current_balance = COALESCE(current_balance,0) + COALESCE(NEW.amount,0),
            updated_at = now()
        WHERE id = NEW.card_id;
      ELSE
        -- For debit cards, maintain existing validation
        SELECT initial_balance INTO avail FROM public.cards WHERE id = NEW.card_id FOR UPDATE;
        IF avail IS NULL THEN
          avail := 0;
        END IF;
        IF NEW.amount > GREATEST(avail, 0) THEN
          RAISE EXCEPTION 'Limite do cartão insuficiente. Disponível: %, Tentativa: %', avail, NEW.amount;
        END IF;
        UPDATE public.cards
        SET initial_balance = GREATEST(0, COALESCE(initial_balance,0) - COALESCE(NEW.amount,0)),
            current_balance = COALESCE(current_balance,0) + COALESCE(NEW.amount,0),
            updated_at = now()
        WHERE id = NEW.card_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'expense' AND OLD.card_id IS NOT NULL THEN
      UPDATE public.cards
      SET initial_balance = COALESCE(initial_balance,0) + COALESCE(OLD.amount,0),
          current_balance = GREATEST(0, COALESCE(current_balance,0) - COALESCE(OLD.amount,0)),
          updated_at = now()
      WHERE id = OLD.card_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;