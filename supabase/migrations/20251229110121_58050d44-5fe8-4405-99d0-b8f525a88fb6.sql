-- Corrigir função get_period_initial_balance para incluir contas de dinheiro (is_cash_account = true)
CREATE OR REPLACE FUNCTION public.get_period_initial_balance(
  p_user_id uuid, 
  p_start_date date, 
  p_account_id uuid DEFAULT NULL::uuid, 
  p_view_mode text DEFAULT 'both'::text
)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_initial_balance NUMERIC := 0;
  v_cash_accounts_balance NUMERIC := 0;
  v_history_adjustment NUMERIC := 0;
  v_couple_user_id UUID;
BEGIN
  -- Detectar parceiro do casal
  SELECT CASE 
    WHEN user1_id = p_user_id THEN user2_id 
    ELSE user1_id 
  END INTO v_couple_user_id
  FROM public.user_couples 
  WHERE status = 'active' 
  AND (user1_id = p_user_id OR user2_id = p_user_id);

  -- 1. Obter saldo ATUAL das contas de dinheiro (is_cash_account = true)
  -- Este é o "dinheiro em mãos" que deve sempre ser considerado
  SELECT COALESCE(SUM(balance), 0) INTO v_cash_accounts_balance
  FROM public.accounts
  WHERE (
    user_id = p_user_id 
    OR (v_couple_user_id IS NOT NULL AND user_id = v_couple_user_id)
  )
  AND is_active = true
  AND is_cash_account = true
  AND deleted_at IS NULL
  AND (p_account_id IS NULL OR id = p_account_id)
  AND (
    p_view_mode = 'both' 
    OR owner_user = p_view_mode
  );

  -- 2. Subtrair as movimentações de dinheiro que ocorreram A PARTIR do início do período
  -- Para calcular quanto tinha ANTES do período começar
  -- Entradas após o período: subtrair (voltando no tempo)
  -- Saídas após o período: somar (voltando no tempo)
  SELECT COALESCE(SUM(
    CASE 
      WHEN movement_type IN ('income', 'transfer_in') THEN -amount  -- Subtrair entradas
      WHEN movement_type IN ('expense', 'transfer_out') THEN amount  -- Somar saídas
      ELSE 0 
    END
  ), 0) INTO v_history_adjustment
  FROM public.cash_flow_history
  WHERE movement_date >= p_start_date
    AND account_id IS NOT NULL  -- Apenas movimentações de contas (não cartão de crédito)
    AND (
      user_id = p_user_id 
      OR (v_couple_user_id IS NOT NULL AND user_id = v_couple_user_id)
    )
    AND (p_account_id IS NULL OR account_id = p_account_id)
    AND (
      p_view_mode = 'both' 
      OR owner_user = p_view_mode
    );

  -- Saldo inicial = Saldo atual das contas + ajuste (voltando no tempo)
  v_initial_balance := v_cash_accounts_balance + v_history_adjustment;

  RETURN COALESCE(v_initial_balance, 0);
END;
$function$;