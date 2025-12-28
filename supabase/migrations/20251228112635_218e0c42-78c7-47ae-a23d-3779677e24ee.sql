-- Fix all RPC functions to properly handle couple view modes
-- The issue: when p_view_mode is 'user1' or 'user2', functions need to:
-- 1. ALWAYS detect the couple partner
-- 2. Query data for BOTH users
-- 3. Filter by owner_user at the end

-- Fix get_cash_flow_summary
CREATE OR REPLACE FUNCTION public.get_cash_flow_summary(
  p_user_id uuid, 
  p_start_date date, 
  p_end_date date, 
  p_view_mode text DEFAULT 'both'::text, 
  p_account_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
  initial_balance numeric, 
  total_income numeric, 
  total_expense numeric, 
  net_result numeric, 
  final_balance numeric, 
  transaction_count bigint, 
  income_count bigint, 
  expense_count bigint
)
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
    COALESCE(SUM(CASE WHEN cfh.movement_type IN ('expense', 'transfer_out') THEN cfh.amount ELSE 0 END), 0) as total_expense,
    COALESCE(SUM(CASE WHEN cfh.movement_type IN ('income', 'transfer_in', 'initial_balance') THEN cfh.amount ELSE -cfh.amount END), 0) as net_result,
    v_initial_balance + COALESCE(SUM(CASE WHEN cfh.movement_type IN ('income', 'transfer_in', 'initial_balance') THEN cfh.amount ELSE -cfh.amount END), 0) as final_balance,
    COUNT(*) as transaction_count,
    COUNT(*) FILTER (WHERE cfh.movement_type IN ('income', 'transfer_in')) as income_count,
    COUNT(*) FILTER (WHERE cfh.movement_type IN ('expense', 'transfer_out')) as expense_count
  FROM public.cash_flow_history cfh
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

-- Fix get_period_initial_balance
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

  -- Calculate initial balance based on the last balance before the start date
  -- Filter by owner_user if view_mode is not 'both'
  SELECT COALESCE(balance_after, 0) INTO v_initial_balance
  FROM public.cash_flow_history
  WHERE movement_date < p_start_date
    AND (
      user_id = p_user_id 
      OR (v_couple_user_id IS NOT NULL AND user_id = v_couple_user_id)
    )
    AND (p_account_id IS NULL OR account_id = p_account_id)
    AND (
      p_view_mode = 'both' 
      OR (p_view_mode = 'user1' AND owner_user = 'user1')
      OR (p_view_mode = 'user2' AND owner_user = 'user2')
    )
  ORDER BY movement_date DESC, created_at DESC
  LIMIT 1;

  -- If no history, calculate based on accounts
  IF v_initial_balance IS NULL THEN
    SELECT COALESCE(SUM(balance), 0) INTO v_initial_balance
    FROM public.accounts
    WHERE (
      user_id = p_user_id 
      OR (v_couple_user_id IS NOT NULL AND user_id = v_couple_user_id)
    )
    AND (p_account_id IS NULL OR id = p_account_id)
    AND is_active = true
    AND (
      p_view_mode = 'both' 
      OR (p_view_mode = 'user1' AND owner_user = 'user1')
      OR (p_view_mode = 'user2' AND owner_user = 'user2')
    );
  END IF;

  RETURN COALESCE(v_initial_balance, 0);
END;
$function$;

-- Fix generate_cash_flow_report
CREATE OR REPLACE FUNCTION public.generate_cash_flow_report(
  p_user_id uuid, 
  p_start_date date, 
  p_end_date date, 
  p_view_mode text DEFAULT 'both'::text, 
  p_account_id uuid DEFAULT NULL::uuid, 
  p_category_id uuid DEFAULT NULL::uuid, 
  p_movement_type text DEFAULT NULL::text
)
RETURNS TABLE(
  id uuid, 
  movement_date date, 
  description text, 
  movement_type text, 
  category_name text, 
  amount numeric, 
  payment_method text, 
  account_name text, 
  card_name text, 
  balance_after numeric, 
  owner_user text, 
  is_reconciled boolean, 
  transaction_id uuid
)
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
  ORDER BY cfh.movement_date ASC, cfh.created_at ASC;
END;
$function$;

-- Fix get_consolidated_expenses
CREATE OR REPLACE FUNCTION public.get_consolidated_expenses(
  p_user_id uuid, 
  p_start_date date, 
  p_end_date date, 
  p_view_mode text DEFAULT 'both'::text
)
RETURNS TABLE(
  category_id uuid, 
  category_name text, 
  category_color text, 
  category_icon text, 
  total_amount numeric, 
  transaction_count bigint, 
  percentage numeric, 
  avg_amount numeric, 
  min_amount numeric, 
  max_amount numeric
)
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
  SELECT COALESCE(SUM(amount), 0) INTO v_total_expenses
  FROM public.cash_flow_history
  WHERE movement_date BETWEEN p_start_date AND p_end_date
    AND movement_type IN ('expense', 'transfer_out')
    AND (
      user_id = p_user_id 
      OR (v_couple_user_id IS NOT NULL AND user_id = v_couple_user_id)
    )
    AND (
      p_view_mode = 'both' 
      OR (p_view_mode = 'user1' AND owner_user = 'user1')
      OR (p_view_mode = 'user2' AND owner_user = 'user2')
    );

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
  GROUP BY cfh.category_id, c.name, cfh.category_name, c.color, c.icon
  ORDER BY total_amount DESC;
END;
$function$;

-- Fix get_consolidated_revenues
CREATE OR REPLACE FUNCTION public.get_consolidated_revenues(
  p_user_id uuid, 
  p_start_date date, 
  p_end_date date, 
  p_view_mode text DEFAULT 'both'::text
)
RETURNS TABLE(
  category_id uuid, 
  category_name text, 
  category_color text, 
  category_icon text, 
  total_amount numeric, 
  transaction_count bigint, 
  percentage numeric, 
  avg_amount numeric, 
  min_amount numeric, 
  max_amount numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_couple_user_id UUID;
  v_total_income NUMERIC;
BEGIN
  -- ALWAYS detect couple partner (regardless of view_mode)
  SELECT CASE 
    WHEN user1_id = p_user_id THEN user2_id 
    ELSE user1_id 
  END INTO v_couple_user_id
  FROM public.user_couples 
  WHERE status = 'active' 
  AND (user1_id = p_user_id OR user2_id = p_user_id);

  -- Calculate total income for percentages (filtered by view_mode)
  SELECT COALESCE(SUM(amount), 0) INTO v_total_income
  FROM public.cash_flow_history
  WHERE movement_date BETWEEN p_start_date AND p_end_date
    AND movement_type IN ('income', 'transfer_in')
    AND (
      user_id = p_user_id 
      OR (v_couple_user_id IS NOT NULL AND user_id = v_couple_user_id)
    )
    AND (
      p_view_mode = 'both' 
      OR (p_view_mode = 'user1' AND owner_user = 'user1')
      OR (p_view_mode = 'user2' AND owner_user = 'user2')
    );

  RETURN QUERY
  SELECT 
    cfh.category_id,
    COALESCE(c.name, cfh.category_name, 'Sem categoria') as category_name,
    COALESCE(c.color, '#22c55e') as category_color,
    c.icon as category_icon,
    SUM(cfh.amount) as total_amount,
    COUNT(*) as transaction_count,
    CASE WHEN v_total_income > 0 THEN ROUND((SUM(cfh.amount) / v_total_income) * 100, 2) ELSE 0 END as percentage,
    ROUND(AVG(cfh.amount), 2) as avg_amount,
    MIN(cfh.amount) as min_amount,
    MAX(cfh.amount) as max_amount
  FROM public.cash_flow_history cfh
  LEFT JOIN public.categories c ON c.id = cfh.category_id
  WHERE cfh.movement_date BETWEEN p_start_date AND p_end_date
    AND cfh.movement_type IN ('income', 'transfer_in')
    AND (
      cfh.user_id = p_user_id 
      OR (v_couple_user_id IS NOT NULL AND cfh.user_id = v_couple_user_id)
    )
    AND (
      p_view_mode = 'both' 
      OR (p_view_mode = 'user1' AND cfh.owner_user = 'user1')
      OR (p_view_mode = 'user2' AND cfh.owner_user = 'user2')
    )
  GROUP BY cfh.category_id, c.name, cfh.category_name, c.color, c.icon
  ORDER BY total_amount DESC;
END;
$function$;

-- Fix populate_initial_cash_flow_history to handle couples
CREATE OR REPLACE FUNCTION public.populate_initial_cash_flow_history(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  v_couple_user_id UUID;
  v_current_user_id UUID;
  v_running_balance numeric := 0;
  v_balance_before numeric := 0;
  v_balance_after numeric := 0;
  v_transaction RECORD;
  v_movement_type text;
  v_owner_user text;
BEGIN
  -- Detect couple partner
  SELECT CASE 
    WHEN user1_id = p_user_id THEN user2_id 
    ELSE user1_id 
  END INTO v_couple_user_id
  FROM public.user_couples 
  WHERE status = 'active' 
  AND (user1_id = p_user_id OR user2_id = p_user_id);

  -- Delete existing non-reconciled entries for primary user
  DELETE FROM public.cash_flow_history
  WHERE user_id = p_user_id AND is_reconciled = false;

  -- Also delete for partner if exists
  IF v_couple_user_id IS NOT NULL THEN
    DELETE FROM public.cash_flow_history
    WHERE user_id = v_couple_user_id AND is_reconciled = false;
  END IF;

  -- Process primary user's transactions
  v_running_balance := 0;
  FOR v_transaction IN 
    SELECT 
      t.id,
      t.user_id,
      t.description,
      t.amount,
      t.type as tx_type,
      t.transaction_date,
      t.category_id,
      c.name as category_name,
      t.account_id,
      a.name as account_name,
      t.card_id,
      cd.name as card_name,
      t.payment_method,
      t.owner_user,
      t.currency
    FROM public.transactions t
    LEFT JOIN public.categories c ON t.category_id = c.id
    LEFT JOIN public.accounts a ON t.account_id = a.id
    LEFT JOIN public.cards cd ON t.card_id = cd.id
    WHERE t.user_id = p_user_id
      AND t.status = 'completed'
      AND (t.payment_method IS NULL OR t.payment_method NOT IN ('account_transfer', 'account_investment'))
    ORDER BY t.transaction_date ASC, t.created_at ASC
  LOOP
    v_balance_before := v_running_balance;
    v_movement_type := CASE WHEN v_transaction.tx_type = 'income' THEN 'income' ELSE 'expense' END;

    v_running_balance := v_running_balance + CASE
      WHEN v_transaction.tx_type = 'income' THEN v_transaction.amount
      ELSE -v_transaction.amount
    END;

    v_balance_after := v_running_balance;
    
    -- Determine owner_user: use existing value or default based on user position in couple
    v_owner_user := COALESCE(v_transaction.owner_user, 'user1');

    INSERT INTO public.cash_flow_history (
      user_id,
      transaction_id,
      description,
      amount,
      movement_type,
      movement_date,
      category_id,
      category_name,
      account_id,
      account_name,
      card_id,
      card_name,
      payment_method,
      owner_user,
      currency,
      balance_before,
      balance_after
    ) VALUES (
      p_user_id,
      v_transaction.id,
      v_transaction.description,
      v_transaction.amount,
      v_movement_type,
      v_transaction.transaction_date,
      v_transaction.category_id,
      v_transaction.category_name,
      v_transaction.account_id,
      v_transaction.account_name,
      v_transaction.card_id,
      v_transaction.card_name,
      v_transaction.payment_method,
      v_owner_user,
      COALESCE(v_transaction.currency, 'BRL'),
      v_balance_before,
      v_balance_after
    );

    v_count := v_count + 1;
  END LOOP;

  -- Process partner's transactions if exists
  IF v_couple_user_id IS NOT NULL THEN
    v_running_balance := 0;
    FOR v_transaction IN 
      SELECT 
        t.id,
        t.user_id,
        t.description,
        t.amount,
        t.type as tx_type,
        t.transaction_date,
        t.category_id,
        c.name as category_name,
        t.account_id,
        a.name as account_name,
        t.card_id,
        cd.name as card_name,
        t.payment_method,
        t.owner_user,
        t.currency
      FROM public.transactions t
      LEFT JOIN public.categories c ON t.category_id = c.id
      LEFT JOIN public.accounts a ON t.account_id = a.id
      LEFT JOIN public.cards cd ON t.card_id = cd.id
      WHERE t.user_id = v_couple_user_id
        AND t.status = 'completed'
        AND (t.payment_method IS NULL OR t.payment_method NOT IN ('account_transfer', 'account_investment'))
      ORDER BY t.transaction_date ASC, t.created_at ASC
    LOOP
      v_balance_before := v_running_balance;
      v_movement_type := CASE WHEN v_transaction.tx_type = 'income' THEN 'income' ELSE 'expense' END;

      v_running_balance := v_running_balance + CASE
        WHEN v_transaction.tx_type = 'income' THEN v_transaction.amount
        ELSE -v_transaction.amount
      END;

      v_balance_after := v_running_balance;
      
      -- Partner is user2
      v_owner_user := COALESCE(v_transaction.owner_user, 'user2');

      INSERT INTO public.cash_flow_history (
        user_id,
        transaction_id,
        description,
        amount,
        movement_type,
        movement_date,
        category_id,
        category_name,
        account_id,
        account_name,
        card_id,
        card_name,
        payment_method,
        owner_user,
        currency,
        balance_before,
        balance_after
      ) VALUES (
        v_couple_user_id,
        v_transaction.id,
        v_transaction.description,
        v_transaction.amount,
        v_movement_type,
        v_transaction.transaction_date,
        v_transaction.category_id,
        v_transaction.category_name,
        v_transaction.account_id,
        v_transaction.account_name,
        v_transaction.card_id,
        v_transaction.card_name,
        v_transaction.payment_method,
        v_owner_user,
        COALESCE(v_transaction.currency, 'BRL'),
        v_balance_before,
        v_balance_after
      );

      v_count := v_count + 1;
    END LOOP;
  END IF;

  RETURN v_count;
END;
$$;