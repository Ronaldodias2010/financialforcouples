-- Atualizar a função process_card_payment para ajustar corretamente o cartão após pagamento
CREATE OR REPLACE FUNCTION public.process_card_payment(
  p_user_id uuid, 
  p_card_id uuid, 
  p_payment_amount numeric, 
  p_payment_date date DEFAULT CURRENT_DATE, 
  p_payment_method text DEFAULT 'cash'::text, 
  p_account_id uuid DEFAULT NULL::uuid, 
  p_notes text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_payment_id UUID;
  v_card_name TEXT;
BEGIN
  -- Validar cartão do usuário e obter nome
  SELECT name INTO v_card_name
  FROM public.cards
  WHERE id = p_card_id AND user_id = p_user_id;

  IF v_card_name IS NULL THEN
    RAISE EXCEPTION 'Cartão não encontrado ou não pertence ao usuário';
  END IF;

  -- Registrar no histórico de pagamentos
  INSERT INTO public.card_payment_history (
    user_id, card_id, payment_amount, payment_date, 
    payment_method, account_id, notes
  ) VALUES (
    p_user_id, p_card_id, p_payment_amount, p_payment_date,
    p_payment_method, p_account_id, p_notes
  )
  RETURNING id INTO v_payment_id;

  -- Atualizar o cartão: reduzir dívida e aumentar limite disponível
  UPDATE public.cards
  SET 
    initial_balance_original = GREATEST(0, COALESCE(initial_balance_original, 0) - p_payment_amount),
    initial_balance = COALESCE(initial_balance, 0) + p_payment_amount,
    updated_at = now()
  WHERE id = p_card_id AND user_id = p_user_id;

  -- Se pago via conta bancária, debitar o saldo diretamente
  IF p_account_id IS NOT NULL THEN
    UPDATE public.accounts 
    SET balance = balance - p_payment_amount,
        updated_at = now()
    WHERE id = p_account_id AND user_id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'message', 'Pagamento processado com sucesso'
  );
END;
$function$;