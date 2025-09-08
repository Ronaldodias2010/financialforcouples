-- Fix the process_withdrawal function to use 'saque' instead of 'withdrawal'
CREATE OR REPLACE FUNCTION public.process_withdrawal(p_user_id uuid, p_amount numeric, p_currency currency_type DEFAULT 'BRL'::currency_type, p_source_account_id uuid DEFAULT NULL::uuid, p_source_card_id uuid DEFAULT NULL::uuid, p_description text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_cash_account_id uuid;
  v_withdrawal_id uuid;
  v_withdrawal_type withdrawal_type;
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
  
  -- Determinar tipo de saque
  IF p_source_account_id IS NOT NULL THEN
    v_withdrawal_type := 'bank_withdrawal';
  ELSE
    v_withdrawal_type := 'credit_advance';
  END IF;
  
  -- Criar registro de saque
  INSERT INTO public.withdrawals (
    user_id, source_account_id, source_card_id, cash_account_id,
    amount, currency, withdrawal_type, description
  ) VALUES (
    p_user_id, p_source_account_id, p_source_card_id, v_cash_account_id,
    p_amount, p_currency, v_withdrawal_type, p_description
  ) RETURNING id INTO v_withdrawal_id;
  
  -- Criar transação de saída da fonte usando 'saque' como payment_method
  IF p_source_account_id IS NOT NULL THEN
    INSERT INTO public.transactions (
      user_id, account_id, type, amount, currency, description,
      payment_method, owner_user
    ) VALUES (
      p_user_id, p_source_account_id, 'expense', p_amount, p_currency,
      COALESCE(p_description, 'Saque para dinheiro'),
      'saque', public.determine_owner_user(p_user_id)
    );
  ELSE
    INSERT INTO public.transactions (
      user_id, card_id, type, amount, currency, description,
      payment_method, owner_user
    ) VALUES (
      p_user_id, p_source_card_id, 'expense', p_amount, p_currency,
      COALESCE(p_description, 'Adiantamento em dinheiro'),
      'saque', public.determine_owner_user(p_user_id)
    );
  END IF;
  
  -- Criar transação de entrada na conta de dinheiro
  INSERT INTO public.transactions (
    user_id, account_id, type, amount, currency, description,
    payment_method, owner_user
  ) VALUES (
    p_user_id, v_cash_account_id, 'income', p_amount, p_currency,
    COALESCE(p_description, 'Dinheiro recebido de saque'),
    'cash', public.determine_owner_user(p_user_id)
  );
  
  RETURN v_withdrawal_id;
END;
$function$;