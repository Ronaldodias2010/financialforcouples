-- Add is_cash_account field to accounts table
ALTER TABLE public.accounts ADD COLUMN is_cash_account boolean DEFAULT false;

-- Create function to create cash accounts for users
CREATE OR REPLACE FUNCTION public.create_cash_accounts_for_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  cash_currencies text[] := ARRAY['BRL', 'USD', 'EUR'];
  currency_code text;
  currency_names jsonb := '{
    "BRL": {"pt": "Dinheiro", "en": "Cash", "es": "Efectivo"},
    "USD": {"pt": "Dinheiro (USD)", "en": "Cash (USD)", "es": "Efectivo (USD)"},
    "EUR": {"pt": "Dinheiro (EUR)", "en": "Cash (EUR)", "es": "Efectivo (EUR)"}
  }'::jsonb;
  user_lang text;
  account_name text;
BEGIN
  -- Get user language preference
  SELECT 
    COALESCE(
      CASE 
        WHEN raw_user_meta_data->>'preferred_language' IS NOT NULL 
        THEN raw_user_meta_data->>'preferred_language'
        ELSE 'pt'
      END, 'pt'
    ) INTO user_lang
  FROM auth.users 
  WHERE id = p_user_id;
  
  -- Create cash account for each currency
  FOREACH currency_code IN ARRAY cash_currencies
  LOOP
    -- Check if cash account already exists for this currency
    IF NOT EXISTS (
      SELECT 1 FROM public.accounts 
      WHERE user_id = p_user_id 
        AND is_cash_account = true 
        AND currency::text = currency_code
    ) THEN
      -- Get localized name
      account_name := currency_names->currency_code->>user_lang;
      
      -- Create cash account
      INSERT INTO public.accounts (
        user_id,
        name,
        account_type,
        currency,
        balance,
        overdraft_limit,
        is_cash_account,
        owner_user
      ) VALUES (
        p_user_id,
        account_name,
        'cash',
        currency_code::currency_type,
        0,
        0,
        true,
        public.determine_owner_user(p_user_id)
      );
    END IF;
  END LOOP;
END;
$function$;

-- Create function to calculate historical cash balance
CREATE OR REPLACE FUNCTION public.calculate_historical_cash_balance(p_user_id uuid, p_currency text)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  cash_balance numeric := 0;
BEGIN
  -- Calculate balance from historical cash transactions
  SELECT COALESCE(
    SUM(CASE 
      WHEN type = 'income' THEN amount 
      WHEN type = 'expense' THEN -amount 
      ELSE 0 
    END), 0
  ) INTO cash_balance
  FROM public.transactions
  WHERE user_id = p_user_id 
    AND payment_method = 'cash'
    AND currency::text = p_currency;
  
  RETURN cash_balance;
END;
$function$;

-- Create function to link cash transactions to cash accounts
CREATE OR REPLACE FUNCTION public.link_cash_transaction_to_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  cash_account_id uuid;
BEGIN
  -- Only process cash transactions
  IF NEW.payment_method = 'cash' THEN
    -- Find the cash account for this user and currency
    SELECT id INTO cash_account_id
    FROM public.accounts
    WHERE user_id = NEW.user_id
      AND is_cash_account = true
      AND currency::text = NEW.currency::text
    LIMIT 1;
    
    -- If no cash account exists, create it
    IF cash_account_id IS NULL THEN
      PERFORM public.create_cash_accounts_for_user(NEW.user_id);
      
      -- Try to find it again
      SELECT id INTO cash_account_id
      FROM public.accounts
      WHERE user_id = NEW.user_id
        AND is_cash_account = true
        AND currency::text = NEW.currency::text
      LIMIT 1;
    END IF;
    
    -- Link transaction to cash account
    NEW.account_id := cash_account_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for cash transactions
CREATE TRIGGER link_cash_transactions_trigger
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.link_cash_transaction_to_account();

-- Create function to validate cash spending
CREATE OR REPLACE FUNCTION public.validate_cash_spending()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  cash_account_balance numeric;
  cash_account_id uuid;
BEGIN
  -- Only validate cash expense transactions
  IF NEW.payment_method = 'cash' AND NEW.type = 'expense' THEN
    -- Find cash account
    SELECT id, balance INTO cash_account_id, cash_account_balance
    FROM public.accounts
    WHERE user_id = NEW.user_id
      AND is_cash_account = true
      AND currency::text = NEW.currency::text
    LIMIT 1;
    
    -- Check if we have sufficient cash balance
    IF cash_account_balance IS NOT NULL AND cash_account_balance < NEW.amount THEN
      RAISE EXCEPTION 'insufficient_cash_balance' 
        USING HINT = 'Saldo insuficiente em dinheiro para esta transação. Saldo disponível: %', cash_account_balance;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for cash spending validation
CREATE TRIGGER validate_cash_spending_trigger
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_cash_spending();

-- Create cash accounts for all existing users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT DISTINCT user_id FROM public.profiles
  LOOP
    PERFORM public.create_cash_accounts_for_user(user_record.user_id);
  END LOOP;
END $$;

-- Update existing cash account balances based on historical transactions
DO $$
DECLARE
  account_record RECORD;
  historical_balance numeric;
BEGIN
  FOR account_record IN 
    SELECT id, user_id, currency FROM public.accounts WHERE is_cash_account = true
  LOOP
    historical_balance := public.calculate_historical_cash_balance(
      account_record.user_id, 
      account_record.currency::text
    );
    
    UPDATE public.accounts 
    SET balance = historical_balance
    WHERE id = account_record.id;
  END LOOP;
END $$;