
-- Fix: Exclude card_payment transactions from balance calculations
-- These are payments TO the card, not spending ON the card

-- Fix trigger function: update_card_balance (on transactions table)
CREATE OR REPLACE FUNCTION public.update_card_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_expenses NUMERIC;
  card_type_value text;
  target_card_id uuid;
BEGIN
  -- Determine which card to update
  IF TG_OP = 'DELETE' THEN
    target_card_id := OLD.card_id;
  ELSE
    target_card_id := NEW.card_id;
  END IF;

  -- Skip if no card involved or if this IS a card payment (not a spend)
  IF target_card_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- For INSERT: skip card_payment transactions entirely
  IF TG_OP = 'INSERT' AND NEW.card_transaction_type = 'card_payment' THEN
    RETURN NEW;
  END IF;

  -- For UPDATE: skip if both old and new are card_payments
  IF TG_OP = 'UPDATE' AND NEW.card_transaction_type = 'card_payment' AND OLD.card_transaction_type = 'card_payment' THEN
    RETURN NEW;
  END IF;

  -- Recalculate for the affected card(s)
  IF TG_OP = 'DELETE' AND OLD.type = 'expense' AND OLD.card_id IS NOT NULL THEN
    SELECT COALESCE(SUM(amount), 0) INTO total_expenses
    FROM public.transactions
    WHERE card_id = OLD.card_id 
      AND type = 'expense'
      AND COALESCE(card_transaction_type, '') != 'card_payment'
      AND (
        is_installment = true
        OR 
        (is_installment = false AND (status = 'completed' OR (status = 'pending' AND due_date <= CURRENT_DATE)))
      );
    
    UPDATE public.cards
    SET current_balance = total_expenses,
        initial_balance = GREATEST(0, COALESCE(credit_limit, 0) - COALESCE(initial_balance_original, 0) - total_expenses),
        updated_at = now()
    WHERE id = OLD.card_id;
    
    RETURN OLD;
  END IF;

  IF TG_OP = 'INSERT' AND NEW.type = 'expense' AND NEW.card_id IS NOT NULL THEN
    SELECT COALESCE(SUM(amount), 0) INTO total_expenses
    FROM public.transactions
    WHERE card_id = NEW.card_id 
      AND type = 'expense'
      AND COALESCE(card_transaction_type, '') != 'card_payment'
      AND (
        is_installment = true
        OR 
        (is_installment = false AND (status = 'completed' OR (status = 'pending' AND due_date <= CURRENT_DATE)))
      );
    
    UPDATE public.cards
    SET current_balance = total_expenses,
        initial_balance = GREATEST(0, COALESCE(credit_limit, 0) - COALESCE(initial_balance_original, 0) - total_expenses),
        updated_at = now()
    WHERE id = NEW.card_id;
    
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.card_id IS NOT NULL THEN
      SELECT COALESCE(SUM(amount), 0) INTO total_expenses
      FROM public.transactions
      WHERE card_id = OLD.card_id 
        AND type = 'expense'
        AND COALESCE(card_transaction_type, '') != 'card_payment'
        AND (
          is_installment = true
          OR 
          (is_installment = false AND (status = 'completed' OR (status = 'pending' AND due_date <= CURRENT_DATE)))
        );
      
      UPDATE public.cards
      SET current_balance = total_expenses,
          initial_balance = GREATEST(0, COALESCE(credit_limit, 0) - COALESCE(initial_balance_original, 0) - total_expenses),
          updated_at = now()
      WHERE id = OLD.card_id;
    END IF;
    
    IF NEW.card_id IS NOT NULL AND (OLD.card_id IS NULL OR NEW.card_id != OLD.card_id) THEN
      SELECT COALESCE(SUM(amount), 0) INTO total_expenses
      FROM public.transactions
      WHERE card_id = NEW.card_id 
        AND type = 'expense'
        AND COALESCE(card_transaction_type, '') != 'card_payment'
        AND (
          is_installment = true
          OR 
          (is_installment = false AND (status = 'completed' OR (status = 'pending' AND due_date <= CURRENT_DATE)))
        );
      
      UPDATE public.cards
      SET current_balance = total_expenses,
          initial_balance = GREATEST(0, COALESCE(credit_limit, 0) - COALESCE(initial_balance_original, 0) - total_expenses),
          updated_at = now()
      WHERE id = NEW.card_id;
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Fix trigger function: set_card_available_fields (BEFORE trigger on cards)
CREATE OR REPLACE FUNCTION public.set_card_available_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expense_sum NUMERIC;
BEGIN
  -- Sum of all expenses on this card, EXCLUDING card payments
  SELECT COALESCE(SUM(amount), 0) INTO expense_sum
  FROM public.transactions
  WHERE card_id = NEW.id 
    AND type = 'expense'
    AND COALESCE(card_transaction_type, '') != 'card_payment';

  -- Current balance = pre-existing balance + tracked expenses (total spent, excluding payments)
  NEW.current_balance := COALESCE(NEW.initial_balance_original, 0) + COALESCE(expense_sum, 0);

  -- Initial balance = credit limit (total limit available)
  NEW.initial_balance := COALESCE(NEW.credit_limit, 0);

  RETURN NEW;
END;
$$;

-- Also fix process_card_payment to NOT set card_id on the payment transaction
-- This way the payment won't be counted as a card expense at all
CREATE OR REPLACE FUNCTION public.process_card_payment(
  p_user_id uuid,
  p_card_id uuid,
  p_payment_amount numeric,
  p_payment_date text,
  p_payment_method text DEFAULT 'card_payment',
  p_account_id uuid DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
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
  v_new_balance numeric;
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
    v_payment_method := 'card_payment';
  END IF;

  -- Calcular saldo atual (total gasto no cartão, excluindo pagamentos anteriores)
  SELECT COALESCE(SUM(amount), 0) INTO v_current_balance
  FROM public.transactions
  WHERE card_id = p_card_id 
    AND type = 'expense'
    AND COALESCE(card_transaction_type, '') != 'card_payment';

  v_current_balance := COALESCE(v_card.initial_balance_original, 0) + v_current_balance;

  -- Criar transação de pagamento (card_transaction_type = 'card_payment' para ser excluída dos cálculos)
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

  -- Calcular novo saldo: reduzir initial_balance_original pelo pagamento
  -- Isso efetivamente "libera" o limite do cartão
  v_new_balance := GREATEST(0, v_current_balance - p_payment_amount);
  
  UPDATE cards 
  SET 
    initial_balance_original = GREATEST(0, COALESCE(initial_balance_original, 0) - p_payment_amount),
    updated_at = now()
  WHERE id = p_card_id;
  
  v_available_credit := COALESCE(v_card.credit_limit, 0) - v_new_balance;

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
    v_new_balance,
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
    'new_balance', v_new_balance,
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
