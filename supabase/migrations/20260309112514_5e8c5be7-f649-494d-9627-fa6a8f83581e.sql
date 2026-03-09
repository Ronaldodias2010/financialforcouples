
-- Disable the sync trigger temporarily
ALTER TABLE transactions DISABLE TRIGGER trigger_sync_transaction_to_cash_flow;

-- 1. Migrate transactions from duplicate categories
UPDATE transactions SET category_id = 'bc458d8d-e650-4129-a631-9275fdcbd358'
WHERE category_id IN ('282d5d8b-e59b-4f50-91f0-ef833038ff7d', 'e6981328-1c63-414c-9a41-f076b5da0fd1')
AND user_id = 'fdc6cdb6-9478-4225-b450-93bfbaaf499a';

UPDATE transactions SET category_id = '74c13a7a-3090-4d96-a864-9afe1179e8ec'
WHERE category_id IN ('293cd92c-5502-4a49-8d77-acc2911f0be7', 'f1d6d3db-c6d8-4ac5-a299-45e7600611bf')
AND user_id = 'a46d7924-c398-4b18-a795-73e248fa10c2';

-- Re-enable the sync trigger
ALTER TABLE transactions ENABLE TRIGGER trigger_sync_transaction_to_cash_flow;

-- 2. Update cash_flow_history
UPDATE cash_flow_history SET category_id = 'bc458d8d-e650-4129-a631-9275fdcbd358',
  category_name = 'Pagamento de Cartão de Crédito'
WHERE category_id IN ('282d5d8b-e59b-4f50-91f0-ef833038ff7d', 'e6981328-1c63-414c-9a41-f076b5da0fd1')
AND user_id = 'fdc6cdb6-9478-4225-b450-93bfbaaf499a';

UPDATE cash_flow_history SET category_id = '74c13a7a-3090-4d96-a864-9afe1179e8ec',
  category_name = 'Pagamento de Cartão de Crédito'
WHERE category_id IN ('293cd92c-5502-4a49-8d77-acc2911f0be7', 'f1d6d3db-c6d8-4ac5-a299-45e7600611bf')
AND user_id = 'a46d7924-c398-4b18-a795-73e248fa10c2';

-- 3. Soft-delete duplicate categories
UPDATE categories SET deleted_at = now()
WHERE id IN (
  '282d5d8b-e59b-4f50-91f0-ef833038ff7d',
  '293cd92c-5502-4a49-8d77-acc2911f0be7',
  'e6981328-1c63-414c-9a41-f076b5da0fd1',
  'f1d6d3db-c6d8-4ac5-a299-45e7600611bf'
);

-- 4. Fix validate_account_overdraft - skip ALL card payment scenarios
CREATE OR REPLACE FUNCTION validate_account_overdraft()
RETURNS TRIGGER AS $$
DECLARE
  v_account_balance NUMERIC;
  v_overdraft_limit NUMERIC;
  v_old_effect NUMERIC := 0;
  v_new_effect NUMERIC := 0;
  v_delta NUMERIC := 0;
  v_projected_balance NUMERIC;
BEGIN
  IF NEW.type != 'expense' OR NEW.account_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- SKIP for card payments (balance handled by process_card_payment function)
  IF NEW.card_transaction_type = 'card_payment' THEN
    RETURN NEW;
  END IF;
  IF NEW.payment_method = 'card_payment' THEN
    RETURN NEW;
  END IF;
  -- Also skip account_transfer with card_id (card payment via transfer)
  IF NEW.payment_method = 'account_transfer' AND NEW.card_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT balance, overdraft_limit 
  INTO v_account_balance, v_overdraft_limit
  FROM public.accounts 
  WHERE id = NEW.account_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_delta := -NEW.amount;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.account_id IS DISTINCT FROM NEW.account_id THEN
      v_delta := -NEW.amount;
    ELSIF OLD.amount IS DISTINCT FROM NEW.amount OR OLD.type IS DISTINCT FROM NEW.type THEN
      IF OLD.type = 'expense' THEN v_old_effect := -OLD.amount; ELSE v_old_effect := OLD.amount; END IF;
      IF NEW.type = 'expense' THEN v_new_effect := -NEW.amount; ELSE v_new_effect := NEW.amount; END IF;
      v_delta := v_new_effect - v_old_effect;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  v_projected_balance := v_account_balance + v_delta;

  IF v_projected_balance < -v_overdraft_limit THEN
    RAISE EXCEPTION 'Saldo insuficiente na conta. Saldo atual: %, Limite de cheque especial: %, Valor da transação: %', 
      v_account_balance, v_overdraft_limit, NEW.amount;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
