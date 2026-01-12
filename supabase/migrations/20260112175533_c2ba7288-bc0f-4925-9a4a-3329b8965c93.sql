-- Etapa 2: Alterar a função sync_transaction_to_cash_flow para NÃO processar pagamentos de cartão
CREATE OR REPLACE FUNCTION public.sync_transaction_to_cash_flow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_name TEXT;
  v_card_name TEXT;
  v_category_name TEXT;
  v_balance_before NUMERIC;
  v_balance_after NUMERIC;
  v_movement_type TEXT;
  v_owner_user UUID;
BEGIN
  -- VERIFICAÇÃO: Ignorar transações de pagamento de cartão
  -- A função process_card_payment já insere no cash_flow_history
  IF NEW.card_transaction_type = 'card_payment' OR NEW.payment_method = 'card_payment' THEN
    RETURN NEW;
  END IF;

  -- Get account name if exists
  IF NEW.account_id IS NOT NULL THEN
    SELECT name INTO v_account_name FROM accounts WHERE id = NEW.account_id;
    SELECT balance INTO v_balance_before FROM accounts WHERE id = NEW.account_id;
    v_balance_after := v_balance_before;
  ELSE
    v_balance_before := 0;
    v_balance_after := 0;
  END IF;

  -- Get card name if exists
  IF NEW.card_id IS NOT NULL THEN
    SELECT name INTO v_card_name FROM cards WHERE id = NEW.card_id;
  END IF;

  -- Get category name if exists
  IF NEW.category_id IS NOT NULL THEN
    SELECT name INTO v_category_name FROM categories WHERE id = NEW.category_id;
  END IF;

  v_owner_user := NEW.owner_user;

  CASE NEW.type
    WHEN 'income' THEN v_movement_type := 'income';
    WHEN 'expense' THEN v_movement_type := 'expense';
    WHEN 'transfer' THEN v_movement_type := 'transfer';
    ELSE v_movement_type := NEW.type;
  END CASE;

  INSERT INTO cash_flow_history (
    user_id, transaction_id, movement_date, movement_type, description, amount,
    balance_before, balance_after, account_id, account_name, card_id, card_name,
    category_id, category_name, payment_method, currency, owner_user,
    period_year, period_month, period_quarter
  ) VALUES (
    NEW.user_id, NEW.id, COALESCE(NEW.transaction_date, NEW.created_at)::DATE, v_movement_type,
    NEW.description, NEW.amount, v_balance_before, v_balance_after, NEW.account_id, v_account_name,
    NEW.card_id, v_card_name, NEW.category_id, v_category_name, NEW.payment_method, NEW.currency,
    v_owner_user, EXTRACT(YEAR FROM COALESCE(NEW.transaction_date, NEW.created_at)),
    EXTRACT(MONTH FROM COALESCE(NEW.transaction_date, NEW.created_at)),
    EXTRACT(QUARTER FROM COALESCE(NEW.transaction_date, NEW.created_at))
  );

  RETURN NEW;
END;
$$;

-- Etapa 3: Remover duplicatas existentes no cash_flow_history para pagamentos de cartão
WITH duplicates AS (
  SELECT id, 
         ROW_NUMBER() OVER (
           PARTITION BY user_id, card_id, ABS(amount), movement_date 
           ORDER BY created_at DESC
         ) as rn
  FROM cash_flow_history
  WHERE movement_type = 'card_payment'
)
DELETE FROM cash_flow_history
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Etapa 4: Corrigir payment_method para registros existentes de pagamento de cartão no cash_flow_history
UPDATE cash_flow_history
SET payment_method = 'card_payment'
WHERE movement_type = 'card_payment'
  AND (payment_method IS NULL OR payment_method NOT IN ('card_payment'));