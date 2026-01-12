-- ============================================
-- FASE 3: Correção do Pagamento de Cartão (V2)
-- ============================================

-- 1. Primeiro, adicionar 'card_payment' ao constraint de movement_type
ALTER TABLE public.cash_flow_history 
DROP CONSTRAINT IF EXISTS cash_flow_history_movement_type_check;

ALTER TABLE public.cash_flow_history 
ADD CONSTRAINT cash_flow_history_movement_type_check 
CHECK (movement_type IN ('income', 'expense', 'transfer', 'adjustment', 'card_payment'));

-- 2. Remover função antiga (se existir com assinatura diferente)
DROP FUNCTION IF EXISTS public.process_card_payment(uuid, uuid, uuid, numeric, timestamp with time zone, text);
DROP FUNCTION IF EXISTS public.process_card_payment(uuid, uuid, uuid, numeric, timestamp with time zone);

-- 3. Garantir existência da categoria "Pagamento de Cartão de Crédito"
INSERT INTO public.default_categories (
  id,
  name_pt, 
  name_en, 
  name_es, 
  category_type, 
  color, 
  icon
)
SELECT 
  'a0000000-0000-0000-0000-000000000001',
  'Pagamento de Cartão de Crédito',
  'Credit Card Payment',
  'Pago de Tarjeta de Crédito',
  'expense',
  '#6366f1',
  'credit-card'
WHERE NOT EXISTS (
  SELECT 1 FROM public.default_categories 
  WHERE name_pt = 'Pagamento de Cartão de Crédito'
);

-- 4. Recriar função process_card_payment com lógica corrigida
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
  
  -- Determinar método de pagamento e processar conta (usando ELSIF para evitar duplicação)
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
    
  ELSIF p_account_id IS NULL THEN
    -- Pagamento via dinheiro (cash/deposit)
    v_payment_method := 'card_payment';
  END IF;

  -- Calcular saldo atual antes do pagamento
  v_current_balance := COALESCE(v_card.current_balance, v_card.initial_balance, 0);
  
  -- Criar transação ÚNICA de despesa (pagamento de cartão)
  -- Marcada com card_transaction_type = 'card_payment' para identificação
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
    COALESCE(v_card.currency, 'BRL'),
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

  -- Registrar no fluxo de caixa como 'card_payment' (não expense)
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
    COALESCE(v_card.currency, 'BRL'),
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

-- 5. Limpar dados existentes - Marcar transações de pagamento de cartão
UPDATE public.transactions
SET 
  card_transaction_type = 'card_payment',
  payment_method = CASE 
    WHEN payment_method IS NULL OR payment_method = '' THEN 'card_payment'
    ELSE payment_method
  END
WHERE 
  type = 'expense'
  AND card_transaction_type IS DISTINCT FROM 'card_payment'
  AND (
    LOWER(description) LIKE '%pagamento de cartão%'
    OR LOWER(description) LIKE '%pagamento de cartao%'
    OR LOWER(description) LIKE '%pagamento cartão%'
    OR LOWER(description) LIKE '%pagamento cartao%'
    OR LOWER(description) LIKE '%credit card payment%'
    OR LOWER(description) LIKE '%card payment%'
    OR category_id IN (
      SELECT id FROM categories 
      WHERE LOWER(name) LIKE '%pagamento%cart%'
    )
  );

-- 6. Remover entradas duplicadas de 'income' relacionadas a pagamentos de cartão
DELETE FROM public.transactions
WHERE type = 'income'
  AND card_id IS NOT NULL
  AND (
    LOWER(description) LIKE '%pagamento%cart%'
    OR LOWER(description) LIKE '%credit card%'
    OR LOWER(description) LIKE '%liberação%limite%'
    OR LOWER(description) LIKE '%liberacao%limite%'
  );

-- 7. Corrigir cash_flow_history - atualizar movement_type para card_payment
UPDATE public.cash_flow_history
SET movement_type = 'card_payment'
WHERE 
  movement_type = 'expense'
  AND (
    LOWER(description) LIKE '%pagamento de cartão%'
    OR LOWER(description) LIKE '%pagamento de cartao%'
    OR LOWER(description) LIKE '%pagamento cartão%'
    OR LOWER(description) LIKE '%pagamento cartao%'
    OR LOWER(description) LIKE '%credit card payment%'
    OR category_name ILIKE '%pagamento%cart%'
  );

-- 8. Remover duplicatas de income no cash_flow_history
DELETE FROM public.cash_flow_history
WHERE movement_type = 'income'
  AND card_id IS NOT NULL
  AND (
    LOWER(description) LIKE '%pagamento%cart%'
    OR LOWER(description) LIKE '%credit card%'
    OR LOWER(description) LIKE '%liberação%limite%'
    OR LOWER(description) LIKE '%liberacao%limite%'
  );