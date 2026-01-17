-- Correção do erro: operator does not exist: text <> currency_type
-- Problema: COALESCE(v_card.currency, 'BRL') retorna texto, mas transactions.currency é currency_type

CREATE OR REPLACE FUNCTION public.process_card_payment(
  p_card_id uuid,
  p_user_id uuid,
  p_account_id uuid,
  p_payment_amount numeric,
  p_payment_date timestamp with time zone,
  p_notes text DEFAULT NULL::text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_card RECORD;
  v_account RECORD;
  v_category_id uuid;
  v_transaction_id uuid;
  v_cash_flow_id uuid;
  v_owner_user text;
  v_description text;
  v_payment_method text;
  v_current_balance numeric;
  v_available_credit numeric;
  v_currency currency_type;
BEGIN
  -- Validações básicas
  IF p_payment_amount IS NULL OR p_payment_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Valor de pagamento inválido');
  END IF;

  -- Buscar dados do cartão
  SELECT * INTO v_card FROM cards WHERE id = p_card_id AND user_id = p_user_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cartão não encontrado');
  END IF;

  v_owner_user := COALESCE(v_card.owner_user, 'user1');
  -- Fazer cast explícito para currency_type
  v_currency := COALESCE(v_card.currency, 'BRL'::currency_type);
  
  -- Buscar ou criar categoria de pagamento de cartão
  SELECT c.id INTO v_category_id
  FROM categories c
  WHERE c.user_id = p_user_id 
    AND LOWER(c.name) LIKE '%pagamento%cart%'
  LIMIT 1;
  
  IF v_category_id IS NULL THEN
    INSERT INTO categories (user_id, name, category_type, color, owner_user)
    VALUES (p_user_id, 'Pagamento de Cartão de Crédito', 'expense', '#6366f1', v_owner_user)
    RETURNING id INTO v_category_id;
  END IF;

  v_description := 'Pagamento de Cartão - ' || v_card.name;
  
  -- Determinar método de pagamento e processar conta
  IF p_account_id IS NOT NULL THEN
    -- Pagamento via conta bancária
    SELECT * INTO v_account FROM accounts WHERE id = p_account_id AND user_id = p_user_id AND deleted_at IS NULL;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Conta não encontrada');
    END IF;
    
    IF v_account.balance < p_payment_amount THEN
      RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente na conta');
    END IF;
    
    v_payment_method := 'card_payment';
    
    -- Debitar da conta
    UPDATE accounts 
    SET balance = balance - p_payment_amount, updated_at = now()
    WHERE id = p_account_id;
    
  ELSE
    -- Pagamento via dinheiro (cash/deposit)
    v_payment_method := 'card_payment';
  END IF;

  -- Calcular saldo atual antes do pagamento
  v_current_balance := COALESCE(v_card.current_balance, v_card.initial_balance, 0);
  
  -- Criar transação ÚNICA de despesa (pagamento de cartão)
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    currency,
    description,
    category_id,
    account_id,
    card_id,
    payment_method,
    transaction_date,
    owner_user,
    status,
    card_transaction_type
  ) VALUES (
    p_user_id,
    'expense',
    p_payment_amount,
    v_currency,
    v_description,
    v_category_id,
    p_account_id,
    p_card_id,
    v_payment_method,
    p_payment_date,
    v_owner_user,
    'completed',
    'card_payment'
  )
  RETURNING id INTO v_transaction_id;

  -- Atualizar saldo do cartão (reduzir dívida)
  UPDATE cards 
  SET 
    current_balance = GREATEST(0, v_current_balance - p_payment_amount),
    updated_at = now()
  WHERE id = p_card_id;
  
  v_available_credit := COALESCE(v_card.credit_limit, 0) - GREATEST(0, v_current_balance - p_payment_amount);

  -- Registrar no histórico de pagamentos
  INSERT INTO card_payment_history (
    user_id,
    card_id,
    account_id,
    payment_amount,
    payment_date,
    payment_method,
    notes
  ) VALUES (
    p_user_id,
    p_card_id,
    p_account_id,
    p_payment_amount,
    p_payment_date,
    v_payment_method,
    p_notes
  );

  -- Registrar no fluxo de caixa como 'card_payment'
  INSERT INTO cash_flow_history (
    user_id,
    movement_date,
    movement_type,
    description,
    amount,
    balance_before,
    balance_after,
    category_id,
    category_name,
    card_id,
    card_name,
    account_id,
    account_name,
    payment_method,
    owner_user,
    currency,
    transaction_id
  ) VALUES (
    p_user_id,
    p_payment_date::date,
    'card_payment',
    v_description,
    p_payment_amount,
    v_current_balance,
    GREATEST(0, v_current_balance - p_payment_amount),
    v_category_id,
    'Pagamento de Cartão de Crédito',
    p_card_id,
    v_card.name,
    p_account_id,
    v_account.name,
    v_payment_method,
    v_owner_user,
    v_currency,
    v_transaction_id
  )
  RETURNING id INTO v_cash_flow_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'cash_flow_id', v_cash_flow_id,
    'new_balance', GREATEST(0, v_current_balance - p_payment_amount),
    'available_credit', v_available_credit,
    'message', 'Pagamento processado com sucesso'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false, 
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;