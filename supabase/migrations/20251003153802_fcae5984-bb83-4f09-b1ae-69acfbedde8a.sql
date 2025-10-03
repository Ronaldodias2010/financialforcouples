-- Criar função para processar parcelas automaticamente
CREATE OR REPLACE FUNCTION public.process_installment_payment(p_future_payment_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_payment RECORD;
  v_transaction_id UUID;
  v_owner_user TEXT;
  v_category_id UUID;
BEGIN
  -- Buscar dados da parcela futura
  SELECT * INTO v_payment
  FROM public.future_expense_payments
  WHERE id = p_future_payment_id
    AND transaction_id IS NULL; -- Só processar se ainda não foi processada
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Future payment not found or already processed';
  END IF;
  
  -- Determinar owner_user
  v_owner_user := COALESCE(v_payment.owner_user, public.determine_owner_user(v_payment.user_id));
  
  -- Usar category_id do payment ou buscar categoria padrão
  v_category_id := v_payment.category_id;
  
  -- Criar transação no mês correspondente
  INSERT INTO public.transactions (
    user_id,
    type,
    amount,
    description,
    transaction_date,
    purchase_date,
    category_id,
    account_id,
    card_id,
    payment_method,
    owner_user,
    is_installment,
    installment_number,
    total_installments,
    created_at
  ) VALUES (
    v_payment.user_id,
    'expense',
    v_payment.amount,
    v_payment.description,
    v_payment.original_due_date, -- Data de vencimento
    v_payment.original_due_date, -- Data de compra = data original
    v_category_id,
    v_payment.account_id,
    v_payment.card_id,
    COALESCE(v_payment.payment_method, 'credit_card'),
    v_owner_user,
    CASE 
      WHEN v_payment.expense_source_type = 'installment' THEN true
      ELSE false
    END,
    CASE 
      WHEN v_payment.expense_source_type = 'installment' 
        AND v_payment.card_payment_info IS NOT NULL 
        AND v_payment.card_payment_info->>'installment_number' IS NOT NULL
      THEN (v_payment.card_payment_info->>'installment_number')::integer
      ELSE NULL
    END,
    CASE 
      WHEN v_payment.expense_source_type = 'installment' 
        AND v_payment.card_payment_info IS NOT NULL 
        AND v_payment.card_payment_info->>'total_installments' IS NOT NULL
      THEN (v_payment.card_payment_info->>'total_installments')::integer
      ELSE NULL
    END,
    now()
  ) RETURNING id INTO v_transaction_id;
  
  -- Atualizar registro em future_expense_payments
  UPDATE public.future_expense_payments
  SET transaction_id = v_transaction_id,
      updated_at = now()
  WHERE id = p_future_payment_id;
  
  -- Log da ação
  RAISE NOTICE 'Processed installment payment % -> transaction %', p_future_payment_id, v_transaction_id;
  
  RETURN v_transaction_id;
END;
$$;

-- Adicionar comentário
COMMENT ON FUNCTION public.process_installment_payment(UUID) IS 
'Processa uma parcela futura, criando uma transação no mês correspondente e preservando a data original de compra';
