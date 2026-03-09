CREATE OR REPLACE FUNCTION public.mark_card_transactions_as_future()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Se é uma transação de despesa com cartão de crédito
  -- Mas NÃO sobrescrever se já tem card_transaction_type definido (ex: card_payment)
  IF NEW.type = 'expense' AND NEW.card_id IS NOT NULL 
     AND (NEW.card_transaction_type IS NULL OR NEW.card_transaction_type = '') THEN
    NEW.card_transaction_type := 'future_expense';
  END IF;
  
  RETURN NEW;
END;
$$;