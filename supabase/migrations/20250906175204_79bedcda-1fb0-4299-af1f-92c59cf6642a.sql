
-- 1) Recriar process_card_payment para NÃO atualizar o cartão diretamente
--    Apenas registrar transaction (na conta) e histórico (card_payment_history)
DROP FUNCTION IF EXISTS public.process_card_payment(
  uuid, uuid, numeric, date, text, uuid, text
);

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

  -- Registrar transação de saída NA CONTA (sem card_id para não acionar lógica de gasto no cartão)
  INSERT INTO public.transactions (
    user_id, type, amount, description, transaction_date,
    category_id, account_id, card_id, payment_method, owner_user
  ) VALUES (
    p_user_id, 'expense', p_payment_amount,
    'Pagamento de Cartão de Crédito - ' || v_card_name,
    p_payment_date, v_category_id,
    p_account_id, NULL,
    p_payment_method, v_owner_user
  )
  RETURNING id INTO v_transaction_id;

  -- Registrar histórico do pagamento de cartão
  INSERT INTO public.card_payment_history (
    user_id, card_id, payment_amount, payment_date, payment_method, account_id, notes
  ) VALUES (
    p_user_id, p_card_id, p_payment_amount, p_payment_date, p_payment_method, p_account_id, p_notes
  )
  RETURNING id INTO v_payment_id;

  -- Não atualizar campos do cartão aqui.
  -- O recálculo do limite/fatura ficará a cargo de public.update_card_balance,
  -- que considera transações e o histórico de pagamentos.

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'payment_id', v_payment_id,
    'message', 'Pagamento processado com sucesso'
  );
END;
$function$;

-- 2) Garantir triggers para recálculo imediato

-- Drop triggers antigos (variações de nomes) e recriar em transactions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgrelid = 'public.transactions'::regclass 
      AND tgname = 'update_card_balance_trigger'
  ) THEN
    EXECUTE 'DROP TRIGGER update_card_balance_trigger ON public.transactions';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgrelid = 'public.transactions'::regclass 
      AND tgname = 'trg_update_card_balance_ins_upd_del'
  ) THEN
    EXECUTE 'DROP TRIGGER trg_update_card_balance_ins_upd_del ON public.transactions';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgrelid = 'public.transactions'::regclass 
      AND tgname = 'trigger_update_card_balance'
  ) THEN
    EXECUTE 'DROP TRIGGER trigger_update_card_balance ON public.transactions';
  END IF;
END$$;

-- Recriar trigger de recálculo em transactions
CREATE TRIGGER update_card_balance_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.update_card_balance();

-- Criar trigger de recálculo também em card_payment_history
DROP TRIGGER IF EXISTS trg_update_card_balance_on_payment ON public.card_payment_history;
CREATE TRIGGER trg_update_card_balance_on_payment
AFTER INSERT OR UPDATE OR DELETE ON public.card_payment_history
FOR EACH ROW EXECUTE FUNCTION public.update_card_balance();

-- 3) Limpeza dos itens antigos que causam duplicidade em "Gastos Futuros"
-- Usamos normalização para evitar problemas de acento e garantir o match
DELETE FROM public.manual_future_expenses
WHERE is_paid = false
  AND public.normalize_text_simple(description) LIKE '%pagamento de cartao de credito%inter black%'
  AND amount IN (600, 1000);

DELETE FROM public.future_expense_payments
WHERE public.normalize_text_simple(description) LIKE '%pagamento de cartao de credito%inter black%'
  AND amount IN (600, 1000);
