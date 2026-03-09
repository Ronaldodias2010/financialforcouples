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
  -- Only validate expense transactions with an account
  IF NEW.type != 'expense' OR NEW.account_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- SKIP validation for card payment transactions (balance already handled by process_card_payment)
  IF NEW.card_transaction_type = 'card_payment' AND NEW.payment_method = 'account_transfer' THEN
    RETURN NEW;
  END IF;

  -- Get current account balance and overdraft limit
  SELECT balance, overdraft_limit 
  INTO v_account_balance, v_overdraft_limit
  FROM public.accounts 
  WHERE id = NEW.account_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Calculate the effect on balance
  IF TG_OP = 'INSERT' THEN
    v_delta := -NEW.amount;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.account_id IS DISTINCT FROM NEW.account_id THEN
      v_delta := -NEW.amount;
    ELSIF OLD.amount IS DISTINCT FROM NEW.amount OR OLD.type IS DISTINCT FROM NEW.type THEN
      IF OLD.type = 'expense' THEN
        v_old_effect := -OLD.amount;
      ELSE
        v_old_effect := OLD.amount;
      END IF;
      
      IF NEW.type = 'expense' THEN
        v_new_effect := -NEW.amount;
      ELSE
        v_new_effect := NEW.amount;
      END IF;
      
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