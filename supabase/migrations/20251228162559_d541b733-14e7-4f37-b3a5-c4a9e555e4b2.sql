-- Atualizar get_consolidated_expenses para excluir categoria "Pagamento de Cartão de Crédito"
CREATE OR REPLACE FUNCTION public.get_consolidated_expenses(p_user_id uuid, p_start_date date, p_end_date date, p_view_mode text DEFAULT 'both'::text)
 RETURNS TABLE(category_id uuid, category_name text, category_color text, category_icon text, total_amount numeric, transaction_count bigint, percentage numeric, avg_amount numeric, min_amount numeric, max_amount numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_couple_user_id UUID;
  v_total_expenses NUMERIC;
BEGIN
  -- ALWAYS detect couple partner (regardless of view_mode)
  SELECT CASE 
    WHEN user1_id = p_user_id THEN user2_id 
    ELSE user1_id 
  END INTO v_couple_user_id
  FROM public.user_couples 
  WHERE status = 'active' 
  AND (user1_id = p_user_id OR user2_id = p_user_id);

  -- Calculate total expenses for percentages (filtered by view_mode)
  -- EXCLUDE credit card payment category to avoid double counting
  SELECT COALESCE(SUM(cfh.amount), 0) INTO v_total_expenses
  FROM public.cash_flow_history cfh
  LEFT JOIN public.categories c ON c.id = cfh.category_id
  WHERE cfh.movement_date BETWEEN p_start_date AND p_end_date
    AND cfh.movement_type IN ('expense', 'transfer_out')
    AND (
      cfh.user_id = p_user_id 
      OR (v_couple_user_id IS NOT NULL AND cfh.user_id = v_couple_user_id)
    )
    AND (
      p_view_mode = 'both' 
      OR (p_view_mode = 'user1' AND cfh.owner_user = 'user1')
      OR (p_view_mode = 'user2' AND cfh.owner_user = 'user2')
    )
    -- Exclude credit card payment categories
    AND COALESCE(c.name, cfh.category_name, '') NOT ILIKE '%pagamento%cartão%'
    AND COALESCE(c.name, cfh.category_name, '') NOT ILIKE '%pagamento%cartao%'
    AND COALESCE(c.name, cfh.category_name, '') NOT ILIKE '%credit card payment%';

  RETURN QUERY
  SELECT 
    cfh.category_id,
    COALESCE(c.name, cfh.category_name, 'Sem categoria') as category_name,
    COALESCE(c.color, '#6366f1') as category_color,
    c.icon as category_icon,
    SUM(cfh.amount) as total_amount,
    COUNT(*) as transaction_count,
    CASE WHEN v_total_expenses > 0 THEN ROUND((SUM(cfh.amount) / v_total_expenses) * 100, 2) ELSE 0 END as percentage,
    ROUND(AVG(cfh.amount), 2) as avg_amount,
    MIN(cfh.amount) as min_amount,
    MAX(cfh.amount) as max_amount
  FROM public.cash_flow_history cfh
  LEFT JOIN public.categories c ON c.id = cfh.category_id
  WHERE cfh.movement_date BETWEEN p_start_date AND p_end_date
    AND cfh.movement_type IN ('expense', 'transfer_out')
    AND (
      cfh.user_id = p_user_id 
      OR (v_couple_user_id IS NOT NULL AND cfh.user_id = v_couple_user_id)
    )
    AND (
      p_view_mode = 'both' 
      OR (p_view_mode = 'user1' AND cfh.owner_user = 'user1')
      OR (p_view_mode = 'user2' AND cfh.owner_user = 'user2')
    )
    -- Exclude credit card payment categories
    AND COALESCE(c.name, cfh.category_name, '') NOT ILIKE '%pagamento%cartão%'
    AND COALESCE(c.name, cfh.category_name, '') NOT ILIKE '%pagamento%cartao%'
    AND COALESCE(c.name, cfh.category_name, '') NOT ILIKE '%credit card payment%'
  GROUP BY cfh.category_id, c.name, cfh.category_name, c.color, c.icon
  ORDER BY total_amount DESC;
END;
$function$;

-- Atualizar get_cash_flow_summary para excluir categoria "Pagamento de Cartão de Crédito"
CREATE OR REPLACE FUNCTION public.get_cash_flow_summary(p_user_id uuid, p_start_date date, p_end_date date, p_view_mode text DEFAULT 'both'::text, p_account_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(initial_balance numeric, total_income numeric, total_expense numeric, net_result numeric, final_balance numeric, transaction_count bigint, income_count bigint, expense_count bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_couple_user_id UUID;
  v_initial_balance NUMERIC;
BEGIN
  -- ALWAYS detect couple partner (regardless of view_mode)
  SELECT CASE 
    WHEN user1_id = p_user_id THEN user2_id 
    ELSE user1_id 
  END INTO v_couple_user_id
  FROM public.user_couples 
  WHERE status = 'active' 
  AND (user1_id = p_user_id OR user2_id = p_user_id);

  -- Calculate initial balance for the view mode
  v_initial_balance := public.get_period_initial_balance(p_user_id, p_start_date, p_account_id, p_view_mode);

  RETURN QUERY
  SELECT 
    v_initial_balance as initial_balance,
    COALESCE(SUM(CASE WHEN cfh.movement_type IN ('income', 'transfer_in', 'initial_balance') THEN cfh.amount ELSE 0 END), 0) as total_income,
    -- Exclude credit card payment categories from expense total
    COALESCE(SUM(CASE 
      WHEN cfh.movement_type IN ('expense', 'transfer_out') 
        AND COALESCE(c.name, cfh.category_name, '') NOT ILIKE '%pagamento%cartão%'
        AND COALESCE(c.name, cfh.category_name, '') NOT ILIKE '%pagamento%cartao%'
        AND COALESCE(c.name, cfh.category_name, '') NOT ILIKE '%credit card payment%'
      THEN cfh.amount 
      ELSE 0 
    END), 0) as total_expense,
    -- Net result also excludes credit card payments
    COALESCE(SUM(CASE 
      WHEN cfh.movement_type IN ('income', 'transfer_in', 'initial_balance') THEN cfh.amount 
      WHEN cfh.movement_type IN ('expense', 'transfer_out') 
        AND COALESCE(c.name, cfh.category_name, '') NOT ILIKE '%pagamento%cartão%'
        AND COALESCE(c.name, cfh.category_name, '') NOT ILIKE '%pagamento%cartao%'
        AND COALESCE(c.name, cfh.category_name, '') NOT ILIKE '%credit card payment%'
      THEN -cfh.amount 
      ELSE 0
    END), 0) as net_result,
    v_initial_balance + COALESCE(SUM(CASE 
      WHEN cfh.movement_type IN ('income', 'transfer_in', 'initial_balance') THEN cfh.amount 
      WHEN cfh.movement_type IN ('expense', 'transfer_out') 
        AND COALESCE(c.name, cfh.category_name, '') NOT ILIKE '%pagamento%cartão%'
        AND COALESCE(c.name, cfh.category_name, '') NOT ILIKE '%pagamento%cartao%'
        AND COALESCE(c.name, cfh.category_name, '') NOT ILIKE '%credit card payment%'
      THEN -cfh.amount 
      ELSE 0
    END), 0) as final_balance,
    COUNT(*) as transaction_count,
    COUNT(*) FILTER (WHERE cfh.movement_type IN ('income', 'transfer_in')) as income_count,
    -- Expense count also excludes credit card payments
    COUNT(*) FILTER (WHERE cfh.movement_type IN ('expense', 'transfer_out') 
      AND COALESCE(c.name, cfh.category_name, '') NOT ILIKE '%pagamento%cartão%'
      AND COALESCE(c.name, cfh.category_name, '') NOT ILIKE '%pagamento%cartao%'
      AND COALESCE(c.name, cfh.category_name, '') NOT ILIKE '%credit card payment%') as expense_count
  FROM public.cash_flow_history cfh
  LEFT JOIN public.categories c ON c.id = cfh.category_id
  WHERE cfh.movement_date BETWEEN p_start_date AND p_end_date
    -- Always include both users if in a couple
    AND (
      cfh.user_id = p_user_id 
      OR (v_couple_user_id IS NOT NULL AND cfh.user_id = v_couple_user_id)
    )
    AND (p_account_id IS NULL OR cfh.account_id = p_account_id)
    -- Filter by owner_user based on view_mode
    AND (
      p_view_mode = 'both' 
      OR (p_view_mode = 'user1' AND cfh.owner_user = 'user1')
      OR (p_view_mode = 'user2' AND cfh.owner_user = 'user2')
    );
END;
$function$;

-- Atualizar generate_cash_flow_report para incluir flag de categoria de pagamento de cartão
CREATE OR REPLACE FUNCTION public.generate_cash_flow_report(p_user_id uuid, p_start_date date, p_end_date date, p_view_mode text DEFAULT 'both'::text, p_account_id uuid DEFAULT NULL::uuid, p_category_id uuid DEFAULT NULL::uuid, p_movement_type text DEFAULT NULL::text, p_exclude_card_payments boolean DEFAULT true)
 RETURNS TABLE(id uuid, movement_date date, description text, movement_type text, category_name text, amount numeric, payment_method text, account_name text, card_name text, balance_after numeric, owner_user text, is_reconciled boolean, transaction_id uuid)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_couple_user_id UUID;
BEGIN
  -- ALWAYS detect couple partner (regardless of view_mode)
  SELECT CASE 
    WHEN user1_id = p_user_id THEN user2_id 
    ELSE user1_id 
  END INTO v_couple_user_id
  FROM public.user_couples 
  WHERE status = 'active' 
  AND (user1_id = p_user_id OR user2_id = p_user_id);

  RETURN QUERY
  SELECT 
    cfh.id,
    cfh.movement_date,
    cfh.description,
    cfh.movement_type,
    COALESCE(cfh.category_name, c.name, 'Sem categoria') as category_name,
    cfh.amount,
    cfh.payment_method,
    COALESCE(cfh.account_name, a.name, 'N/A') as account_name,
    cfh.card_name,
    cfh.balance_after,
    cfh.owner_user,
    cfh.is_reconciled,
    cfh.transaction_id
  FROM public.cash_flow_history cfh
  LEFT JOIN public.categories c ON c.id = cfh.category_id
  LEFT JOIN public.accounts a ON a.id = cfh.account_id
  WHERE cfh.movement_date BETWEEN p_start_date AND p_end_date
    AND (
      cfh.user_id = p_user_id 
      OR (v_couple_user_id IS NOT NULL AND cfh.user_id = v_couple_user_id)
    )
    AND (p_account_id IS NULL OR cfh.account_id = p_account_id)
    AND (p_category_id IS NULL OR cfh.category_id = p_category_id)
    AND (p_movement_type IS NULL OR cfh.movement_type = p_movement_type)
    AND (
      p_view_mode = 'both' 
      OR (p_view_mode = 'user1' AND cfh.owner_user = 'user1')
      OR (p_view_mode = 'user2' AND cfh.owner_user = 'user2')
    )
    -- Exclude credit card payment categories if flag is true
    AND (
      p_exclude_card_payments = false
      OR (
        COALESCE(c.name, cfh.category_name, '') NOT ILIKE '%pagamento%cartão%'
        AND COALESCE(c.name, cfh.category_name, '') NOT ILIKE '%pagamento%cartao%'
        AND COALESCE(c.name, cfh.category_name, '') NOT ILIKE '%credit card payment%'
      )
    )
  ORDER BY cfh.movement_date ASC, cfh.created_at ASC;
END;
$function$;