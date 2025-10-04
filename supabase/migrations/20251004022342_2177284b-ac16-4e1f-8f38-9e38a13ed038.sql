-- Update the update_card_balance function to sum ALL installments for current_balance
CREATE OR REPLACE FUNCTION public.update_card_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  total_expenses NUMERIC;
  card_type_value text;
BEGIN
  -- Only process expense transactions with card
  IF (TG_OP = 'INSERT' AND NEW.type = 'expense' AND NEW.card_id IS NOT NULL) THEN
    -- Get card type
    SELECT card_type INTO card_type_value FROM public.cards WHERE id = NEW.card_id;
    
    -- Calculate total expenses for the card:
    -- - ALL installments (is_installment = true) regardless of due_date
    -- - Completed transactions (is_installment = false, status = completed)
    -- - Pending non-installment transactions with due_date in current month or before
    SELECT COALESCE(SUM(amount), 0) INTO total_expenses
    FROM public.transactions
    WHERE card_id = NEW.card_id 
      AND type = 'expense'
      AND (
        is_installment = true  -- Sum ALL installments
        OR 
        (is_installment = false AND (status = 'completed' OR (status = 'pending' AND due_date <= CURRENT_DATE)))
      );
    
    -- Update card
    UPDATE public.cards
    SET current_balance = total_expenses,
        initial_balance = GREATEST(0, COALESCE(credit_limit, 0) - COALESCE(initial_balance_original, 0) - total_expenses),
        updated_at = now()
    WHERE id = NEW.card_id;
    
    RETURN NEW;
    
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Recalculate for both cards (OLD and NEW if different)
    IF OLD.card_id IS NOT NULL THEN
      SELECT COALESCE(SUM(amount), 0) INTO total_expenses
      FROM public.transactions
      WHERE card_id = OLD.card_id 
        AND type = 'expense'
        AND (
          is_installment = true
          OR 
          (is_installment = false AND (status = 'completed' OR (status = 'pending' AND due_date <= CURRENT_DATE)))
        );
      
      UPDATE public.cards
      SET current_balance = total_expenses,
          initial_balance = GREATEST(0, COALESCE(credit_limit, 0) - COALESCE(initial_balance_original, 0) - total_expenses),
          updated_at = now()
      WHERE id = OLD.card_id;
    END IF;
    
    IF NEW.card_id IS NOT NULL AND NEW.card_id != OLD.card_id THEN
      SELECT COALESCE(SUM(amount), 0) INTO total_expenses
      FROM public.transactions
      WHERE card_id = NEW.card_id 
        AND type = 'expense'
        AND (
          is_installment = true
          OR 
          (is_installment = false AND (status = 'completed' OR (status = 'pending' AND due_date <= CURRENT_DATE)))
        );
      
      UPDATE public.cards
      SET current_balance = total_expenses,
          initial_balance = GREATEST(0, COALESCE(credit_limit, 0) - COALESCE(initial_balance_original, 0) - total_expenses),
          updated_at = now()
      WHERE id = NEW.card_id;
    END IF;
    
    RETURN NEW;
    
  ELSIF (TG_OP = 'DELETE' AND OLD.type = 'expense' AND OLD.card_id IS NOT NULL) THEN
    SELECT COALESCE(SUM(amount), 0) INTO total_expenses
    FROM public.transactions
    WHERE card_id = OLD.card_id 
      AND type = 'expense'
      AND (
        is_installment = true
        OR 
        (is_installment = false AND (status = 'completed' OR (status = 'pending' AND due_date <= CURRENT_DATE)))
      );
    
    UPDATE public.cards
    SET current_balance = total_expenses,
        initial_balance = GREATEST(0, COALESCE(credit_limit, 0) - COALESCE(initial_balance_original, 0) - total_expenses),
        updated_at = now()
    WHERE id = OLD.card_id;
    
    RETURN OLD;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;