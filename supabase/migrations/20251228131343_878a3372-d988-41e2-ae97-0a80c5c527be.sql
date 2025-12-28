-- =====================================================
-- MIGRATION 5 v3: Fix validate_account_overdraft + Add business_at columns
-- =====================================================

-- STEP 1: Fix the validate_account_overdraft function to handle UPDATE correctly
-- The issue: UPDATE that only changes non-financial fields (like business_at)
-- was incorrectly failing because it didn't calculate the delta properly.

CREATE OR REPLACE FUNCTION public.validate_account_overdraft()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  -- Get current account balance and overdraft limit
  SELECT balance, overdraft_limit 
  INTO v_account_balance, v_overdraft_limit
  FROM public.accounts 
  WHERE id = NEW.account_id;

  IF NOT FOUND THEN
    RETURN NEW; -- Account doesn't exist, let other validations handle
  END IF;

  -- Calculate the effect on balance
  -- For expenses: negative effect (reduces balance)
  IF TG_OP = 'INSERT' THEN
    -- New expense: full amount as negative effect
    v_delta := -NEW.amount;
  ELSIF TG_OP = 'UPDATE' THEN
    -- For UPDATE: calculate the difference between old and new effect
    -- Only consider financial changes (amount, type, account_id changes)
    
    -- If account changed, this is complex - treat as new expense on new account
    IF OLD.account_id IS DISTINCT FROM NEW.account_id THEN
      v_delta := -NEW.amount;
    ELSIF OLD.amount IS DISTINCT FROM NEW.amount OR OLD.type IS DISTINCT FROM NEW.type THEN
      -- Same account but amount or type changed
      -- Old effect (what was already applied)
      IF OLD.type = 'expense' THEN
        v_old_effect := -OLD.amount;
      ELSE
        v_old_effect := OLD.amount;
      END IF;
      
      -- New effect (what will be applied)
      IF NEW.type = 'expense' THEN
        v_new_effect := -NEW.amount;
      ELSE
        v_new_effect := NEW.amount;
      END IF;
      
      -- Delta is the difference
      v_delta := v_new_effect - v_old_effect;
    ELSE
      -- No financial change (e.g., only business_at, description, etc.)
      -- No validation needed
      RETURN NEW;
    END IF;
  END IF;

  -- Calculate projected balance after this transaction
  v_projected_balance := v_account_balance + v_delta;

  -- Check if projected balance violates overdraft limit
  IF v_projected_balance < -v_overdraft_limit THEN
    RAISE EXCEPTION 'Saldo insuficiente na conta. Saldo atual: %, Limite de cheque especial: %, Valor da transação: %', 
      v_account_balance, v_overdraft_limit, NEW.amount;
  END IF;

  RETURN NEW;
END;
$$;

-- STEP 2: Ensure trigger exists (recreate to be safe)
DROP TRIGGER IF EXISTS validate_account_overdraft_trigger ON public.transactions;

CREATE TRIGGER validate_account_overdraft_trigger
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_account_overdraft();

-- STEP 3: Add business_at columns (with IF NOT EXISTS logic via DO block)
DO $$
BEGIN
  -- Add to transactions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'business_at'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN business_at TIMESTAMPTZ;
    RAISE NOTICE 'Added business_at column to transactions';
  ELSE
    RAISE NOTICE 'business_at column already exists in transactions';
  END IF;

  -- Add to cash_flow_history
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'cash_flow_history' 
    AND column_name = 'business_at'
  ) THEN
    ALTER TABLE public.cash_flow_history ADD COLUMN business_at TIMESTAMPTZ;
    RAISE NOTICE 'Added business_at column to cash_flow_history';
  ELSE
    RAISE NOTICE 'business_at column already exists in cash_flow_history';
  END IF;
END $$;

-- STEP 4: Backfill existing rows (now safe because trigger handles non-financial updates)
UPDATE public.transactions 
SET business_at = created_at 
WHERE business_at IS NULL;

UPDATE public.cash_flow_history 
SET business_at = created_at 
WHERE business_at IS NULL;

-- STEP 5: Create function to auto-set business_at on INSERT
CREATE OR REPLACE FUNCTION public.set_business_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.business_at IS NULL THEN
    NEW.business_at := COALESCE(NEW.created_at, now());
  END IF;
  RETURN NEW;
END;
$$;

-- STEP 6: Create triggers for auto-setting business_at
DROP TRIGGER IF EXISTS set_business_at_trigger ON public.transactions;
CREATE TRIGGER set_business_at_trigger
  BEFORE INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_business_at();

DROP TRIGGER IF EXISTS set_business_at_trigger ON public.cash_flow_history;
CREATE TRIGGER set_business_at_trigger
  BEFORE INSERT ON public.cash_flow_history
  FOR EACH ROW
  EXECUTE FUNCTION public.set_business_at();

-- STEP 7: Add comments for documentation
COMMENT ON COLUMN public.transactions.business_at IS 'Timestamp when the transaction was created in the system (immutable audit field)';
COMMENT ON COLUMN public.cash_flow_history.business_at IS 'Timestamp when the cash flow entry was created in the system (immutable audit field)';