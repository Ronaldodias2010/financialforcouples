
-- 1) Recalcular corretamente o saldo da fatura e o limite disponível considerando pagamentos

CREATE OR REPLACE FUNCTION public.update_card_balance()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    card_record RECORD;
    total_gastos NUMERIC := 0;
    total_pagamentos NUMERIC := 0;
    efetivo_em_aberto NUMERIC := 0;
BEGIN
    -- Recalcula para todos os cartões de crédito
    FOR card_record IN 
        SELECT DISTINCT c.id, c.credit_limit, c.initial_balance_original, c.card_type
        FROM public.cards c
        WHERE c.card_type = 'credit'
    LOOP
        -- Gastos no cartão (despesas)
        SELECT COALESCE(SUM(t.amount), 0) INTO total_gastos
        FROM public.transactions t
        WHERE t.card_id = card_record.id 
          AND t.type = 'expense';

        -- Pagamentos registrados no histórico
        SELECT COALESCE(SUM(p.payment_amount), 0) INTO total_pagamentos
        FROM public.card_payment_history p
        WHERE p.card_id = card_record.id;

        -- Saldo efetivo em aberto = saldo anterior carregado + gastos - pagamentos
        efetivo_em_aberto := COALESCE(card_record.initial_balance_original, 0) 
                           + COALESCE(total_gastos, 0)
                           - COALESCE(total_pagamentos, 0);

        -- Atualiza:
        -- current_balance: quanto ainda falta pagar (mín. 0 p/ não ficar negativo)
        -- initial_balance: limite disponível (pode ficar negativo se estourado; 
        --                  se ficar acima do limite, limita no teto do credit_limit)
        UPDATE public.cards
        SET 
            current_balance = GREATEST(0, efetivo_em_aberto),
            initial_balance = LEAST(
                                COALESCE(card_record.credit_limit, 0),
                                COALESCE(card_record.credit_limit, 0) - efetivo_em_aberto
                              ),
            updated_at = now()
        WHERE id = card_record.id;
    END LOOP;

    RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 2) Processar pagamento de cartão reduzindo o saldo carregado (initial_balance_original)
--    e não criando registros em gastos futuros

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
  -- Determinar owner_user
  v_owner_user := public.determine_owner_user(p_user_id);

  -- Validar cartão do usuário e obter nome
  SELECT name INTO v_card_name
  FROM public.cards
  WHERE id = p_card_id AND user_id = p_user_id;

  IF v_card_name IS NULL THEN
    RAISE EXCEPTION 'Cartão não encontrado ou não pertence ao usuário';
  END IF;

  -- Obter ou criar categoria "Pagamento de Cartão de Crédito"
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

  IF v_category_id IS NULL THEN
    v_payment_category_name := 'Pagamento de Cartão de Crédito';
    INSERT INTO public.categories (name, category_type, user_id, owner_user)
    VALUES (v_payment_category_name, 'expense', p_user_id, v_owner_user)
    RETURNING id INTO v_category_id;
  END IF;

  -- Registrar transação de saída NA CONTA (sem vincular ao cartão)
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
    NULL,                -- não vincular ao cartão para não acionar gatilhos de gasto no cartão
    p_payment_method,
    v_owner_user
  )
  RETURNING id INTO v_transaction_id;

  -- Histórico de pagamento de cartão
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
  )
  RETURNING id INTO v_payment_id;

  -- NÃO criar novo future_expense_payments.
  -- Regras de "Gastos Futuros" serão tratadas no app, abatendo do card existente.

  -- Abater o saldo carregado (initial_balance_original) com o pagamento
  UPDATE public.cards
  SET
    initial_balance_original = GREATEST(0, COALESCE(initial_balance_original, 0) - p_payment_amount),
    updated_at = now()
  WHERE id = p_card_id
    AND user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'payment_id', v_payment_id,
    'message', 'Pagamento processado com sucesso'
  );
END;
$function$;
