-- Criar função unificada de pagamento de cartão de crédito
CREATE OR REPLACE FUNCTION public.process_card_payment(
  p_user_id uuid,
  p_card_id uuid,
  p_payment_amount numeric,
  p_payment_date date DEFAULT CURRENT_DATE,
  p_payment_method text DEFAULT 'cash'::text,
  p_account_id uuid DEFAULT NULL::uuid,
  p_notes text DEFAULT NULL::text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_transaction_id UUID;
  v_payment_id UUID;
  v_owner_user TEXT;
  v_card_name TEXT;
  v_category_id UUID;
  v_payment_category_name TEXT;
BEGIN
  -- Determine owner user
  v_owner_user := public.determine_owner_user(p_user_id);
  
  -- Get card name
  SELECT name INTO v_card_name
  FROM public.cards
  WHERE id = p_card_id AND user_id = p_user_id;
  
  IF v_card_name IS NULL THEN
    RAISE EXCEPTION 'Cartão não encontrado ou não pertence ao usuário';
  END IF;
  
  -- Get or create "Credit Card Payment" category
  SELECT id INTO v_category_id
  FROM public.categories
  WHERE user_id = p_user_id 
    AND category_type = 'expense'
    AND (
      LOWER(name) LIKE '%pagamento%cartao%' OR 
      LOWER(name) LIKE '%credit card payment%' OR
      LOWER(name) = 'pagamento de cartão de crédito'
    )
  LIMIT 1;
  
  -- If category doesn't exist, create it
  IF v_category_id IS NULL THEN
    v_payment_category_name := 'Pagamento de Cartão de Crédito';
    INSERT INTO public.categories (name, category_type, user_id, owner_user)
    VALUES (v_payment_category_name, 'expense', p_user_id, v_owner_user)
    RETURNING id INTO v_category_id;
  END IF;
  
  -- Create transaction record for the payment
  INSERT INTO public.transactions (
    user_id,
    type,
    amount,
    description,
    transaction_date,
    category_id,
    account_id,
    card_id,
    payment_method,
    owner_user
  ) VALUES (
    p_user_id,
    'expense',
    p_payment_amount,
    'Pagamento de Cartão de Crédito - ' || v_card_name,
    p_payment_date,
    v_category_id,
    p_account_id,
    p_card_id, -- Link to the card being paid
    p_payment_method,
    v_owner_user
  ) RETURNING id INTO v_transaction_id;
  
  -- Create payment history record
  INSERT INTO public.card_payment_history (
    user_id,
    card_id,
    payment_amount,
    payment_date,
    payment_method,
    account_id,
    notes
  ) VALUES (
    p_user_id,
    p_card_id,
    p_payment_amount,
    p_payment_date,
    p_payment_method,
    p_account_id,
    p_notes
  ) RETURNING id INTO v_payment_id;
  
  -- Create future expense payment record to link with the payment system
  INSERT INTO public.future_expense_payments (
    user_id,
    original_due_date,
    payment_date,
    amount,
    description,
    category_id,
    payment_method,
    account_id,
    card_id,
    transaction_id,
    owner_user,
    expense_source_type,
    card_payment_info
  ) VALUES (
    p_user_id,
    p_payment_date, -- original due date same as payment date for card payments
    p_payment_date,
    p_payment_amount,
    'Pagamento de Cartão de Crédito - ' || v_card_name,
    v_category_id,
    p_payment_method,
    p_account_id,
    p_card_id,
    v_transaction_id,
    v_owner_user,
    'card_payment',
    jsonb_build_object(
      'cardId', p_card_id,
      'cardName', v_card_name,
      'paymentHistoryId', v_payment_id
    )
  );
  
  -- Restore card limit by reducing the current balance (used amount)
  UPDATE public.cards
  SET 
    current_balance = GREATEST(0, COALESCE(current_balance, 0) - p_payment_amount),
    initial_balance = COALESCE(initial_balance, 0) + p_payment_amount,
    updated_at = now()
  WHERE id = p_card_id AND user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'payment_id', v_payment_id,
    'message', 'Pagamento processado com sucesso'
  );
END;
$function$;