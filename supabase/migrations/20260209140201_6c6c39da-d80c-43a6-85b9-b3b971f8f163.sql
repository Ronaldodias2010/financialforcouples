-- Fix the trigger function so that:
-- current_balance = initial_balance_original + expense_sum (total spent including pre-existing)
-- initial_balance = credit_limit (total limit of the card)
-- This way frontend calculates: available = initial_balance - current_balance = credit_limit - total_spent

CREATE OR REPLACE FUNCTION public.set_card_available_fields()
RETURNS TRIGGER AS $$
DECLARE
  expense_sum NUMERIC;
BEGIN
  -- Sum of all expenses on this card
  SELECT COALESCE(SUM(amount), 0) INTO expense_sum
  FROM public.transactions
  WHERE card_id = NEW.id AND type = 'expense';

  -- Current balance = pre-existing balance + tracked expenses (total spent)
  NEW.current_balance := COALESCE(NEW.initial_balance_original, 0) + COALESCE(expense_sum, 0);

  -- Initial balance = credit limit (total limit available)
  NEW.initial_balance := COALESCE(NEW.credit_limit, 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;