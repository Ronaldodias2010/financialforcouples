-- Update the process_withdrawal function to use account_transfer instead of saque
-- This prevents the withdrawal transactions from appearing in dashboard totals
CREATE OR REPLACE FUNCTION public.process_withdrawal(
  p_user_id uuid, 
  p_amount numeric, 
  p_currency currency_type DEFAULT 'BRL'::currency_type, 
  p_source_account_id uuid DEFAULT NULL::uuid, 
  p_source_card_id uuid DEFAULT NULL::uuid, 
  p_description text DEFAULT NULL::text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_cash_account_id uuid;
  v_transaction_id uuid;
BEGIN
  -- Validar que apenas uma fonte foi especificada
  IF (p_source_account_id IS NOT NULL AND p_source_card_id IS NOT NULL) OR
     (p_source_account_id IS NULL AND p_source_card_id IS NULL) THEN
    RAISE EXCEPTION 'Especifique apenas uma fonte: conta bancária OU cartão de crédito';
  END IF;
  
  -- Encontrar conta de dinheiro do usuário na moeda especificada
  SELECT id INTO v_cash_account_id
  FROM public.accounts
  WHERE user_id = p_user_id 
    AND is_cash_account = true 
    AND currency = p_currency
  LIMIT 1;
  
  IF v_cash_account_id IS NULL THEN
    RAISE EXCEPTION 'Conta de dinheiro não encontrada para a moeda %', p_currency;
  END IF;
  
  -- Criar transação de saída da fonte usando 'account_transfer' para não aparecer no dashboard
  IF p_source_account_id IS NOT NULL THEN
    INSERT INTO public.transactions (
      user_id, account_id, type, amount, currency, description,
      payment_method, owner_user
    ) VALUES (
      p_user_id, p_source_account_id, 'expense', p_amount, p_currency,
      COALESCE(p_description, 'Saque para dinheiro'),
      'account_transfer', public.determine_owner_user(p_user_id)
    ) RETURNING id INTO v_transaction_id;
  ELSE
    INSERT INTO public.transactions (
      user_id, card_id, type, amount, currency, description,
      payment_method, owner_user
    ) VALUES (
      p_user_id, p_source_card_id, 'expense', p_amount, p_currency,
      COALESCE(p_description, 'Adiantamento em dinheiro'),
      'account_transfer', public.determine_owner_user(p_user_id)
    ) RETURNING id INTO v_transaction_id;
  END IF;
  
  -- Criar transação de entrada na conta de dinheiro usando 'account_transfer'
  INSERT INTO public.transactions (
    user_id, account_id, type, amount, currency, description,
    payment_method, owner_user
  ) VALUES (
    p_user_id, v_cash_account_id, 'income', p_amount, p_currency,
    COALESCE(p_description, 'Dinheiro recebido de saque'),
    'account_transfer', public.determine_owner_user(p_user_id)
  );
  
  RETURN v_transaction_id;
END;
$function$;