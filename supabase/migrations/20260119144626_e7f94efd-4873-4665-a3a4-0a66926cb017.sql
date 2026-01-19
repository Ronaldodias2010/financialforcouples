-- Fix get_financial_position to properly filter by owner_user based on viewMode
CREATE OR REPLACE FUNCTION public.get_financial_position(
    p_user_id UUID,
    p_date DATE DEFAULT CURRENT_DATE,
    p_view_mode TEXT DEFAULT 'both'
)
RETURNS TABLE (
    cash_balance NUMERIC,
    bank_balance NUMERIC,
    credit_limit_used NUMERIC,
    available_cash NUMERIC,
    net_position NUMERIC,
    total_assets NUMERIC,
    total_liabilities NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_ids UUID[];
    v_cash NUMERIC := 0;
    v_bank NUMERIC := 0;
    v_credit NUMERIC := 0;
BEGIN
    -- ALWAYS get both user_ids from the couple (if exists)
    SELECT ARRAY[uc.user1_id, uc.user2_id]
    INTO v_user_ids
    FROM user_couples uc
    WHERE uc.status = 'active'
      AND (uc.user1_id = p_user_id OR uc.user2_id = p_user_id);

    -- If no couple found, use only the current user
    IF v_user_ids IS NULL THEN
        v_user_ids := ARRAY[p_user_id];
    END IF;

    -- Calculate cash balance (is_cash_account = true)
    SELECT COALESCE(SUM(a.balance), 0)
    INTO v_cash
    FROM accounts a
    WHERE a.user_id = ANY(v_user_ids)
      AND a.is_active = true
      AND a.deleted_at IS NULL
      AND a.is_cash_account = true
      AND (p_view_mode = 'both' OR a.owner_user = p_view_mode);

    -- Calculate bank balance (account_type = 'checking' or 'savings', not cash)
    SELECT COALESCE(SUM(a.balance), 0)
    INTO v_bank
    FROM accounts a
    WHERE a.user_id = ANY(v_user_ids)
      AND a.is_active = true
      AND a.deleted_at IS NULL
      AND a.is_cash_account = false
      AND a.account_type IN ('checking', 'savings')
      AND (p_view_mode = 'both' OR a.owner_user = p_view_mode);

    -- Calculate credit limit used (from cards)
    SELECT COALESCE(SUM(COALESCE(c.current_balance, 0)), 0)
    INTO v_credit
    FROM cards c
    WHERE c.user_id = ANY(v_user_ids)
      AND c.deleted_at IS NULL
      AND c.card_type = 'credit'
      AND (p_view_mode = 'both' OR c.owner_user = p_view_mode);

    RETURN QUERY SELECT
        v_cash AS cash_balance,
        v_bank AS bank_balance,
        v_credit AS credit_limit_used,
        (v_cash + v_bank) AS available_cash,
        (v_cash + v_bank - v_credit) AS net_position,
        (v_cash + v_bank) AS total_assets,
        v_credit AS total_liabilities;
END;
$$;

-- Fix get_accounts_breakdown to properly filter by owner_user based on viewMode
CREATE OR REPLACE FUNCTION public.get_accounts_breakdown(
    p_user_id UUID,
    p_view_mode TEXT DEFAULT 'both'
)
RETURNS TABLE (
    account_id UUID,
    account_name TEXT,
    account_type TEXT,
    is_cash_account BOOLEAN,
    balance NUMERIC,
    is_asset BOOLEAN,
    category TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_ids UUID[];
BEGIN
    -- ALWAYS get both user_ids from the couple (if exists)
    SELECT ARRAY[uc.user1_id, uc.user2_id]
    INTO v_user_ids
    FROM user_couples uc
    WHERE uc.status = 'active'
      AND (uc.user1_id = p_user_id OR uc.user2_id = p_user_id);

    -- If no couple found, use only the current user
    IF v_user_ids IS NULL THEN
        v_user_ids := ARRAY[p_user_id];
    END IF;

    RETURN QUERY
    SELECT
        a.id AS account_id,
        a.name AS account_name,
        a.account_type::TEXT AS account_type,
        COALESCE(a.is_cash_account, false) AS is_cash_account,
        a.balance,
        true AS is_asset,
        CASE
            WHEN a.is_cash_account = true THEN 'cash'
            WHEN a.account_type IN ('checking', 'savings') THEN 'bank'
            ELSE 'other'
        END AS category
    FROM accounts a
    WHERE a.user_id = ANY(v_user_ids)
      AND a.is_active = true
      AND a.deleted_at IS NULL
      AND (p_view_mode = 'both' OR a.owner_user = p_view_mode)
    ORDER BY a.name;
END;
$$;

-- Fix get_cash_flow_summary_v2 to properly filter by owner_user based on viewMode
CREATE OR REPLACE FUNCTION public.get_cash_flow_summary_v2(
    p_user_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_view_mode TEXT DEFAULT 'both',
    p_account_id UUID DEFAULT NULL
)
RETURNS TABLE (
    initial_balance NUMERIC,
    total_income NUMERIC,
    total_expense NUMERIC,
    net_result NUMERIC,
    final_balance NUMERIC,
    transaction_count BIGINT,
    income_count BIGINT,
    expense_count BIGINT,
    cash_available NUMERIC,
    total_debt NUMERIC,
    net_position NUMERIC,
    assets_cash NUMERIC,
    assets_bank NUMERIC,
    liabilities_credit_limit NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_ids UUID[];
    v_initial_balance NUMERIC := 0;
    v_total_income NUMERIC := 0;
    v_total_expense NUMERIC := 0;
    v_income_count BIGINT := 0;
    v_expense_count BIGINT := 0;
    v_cash NUMERIC := 0;
    v_bank NUMERIC := 0;
    v_credit NUMERIC := 0;
BEGIN
    -- ALWAYS get both user_ids from the couple (if exists)
    SELECT ARRAY[uc.user1_id, uc.user2_id]
    INTO v_user_ids
    FROM user_couples uc
    WHERE uc.status = 'active'
      AND (uc.user1_id = p_user_id OR uc.user2_id = p_user_id);

    -- If no couple found, use only the current user
    IF v_user_ids IS NULL THEN
        v_user_ids := ARRAY[p_user_id];
    END IF;

    -- Calculate initial balance from accounts
    SELECT COALESCE(SUM(a.balance), 0)
    INTO v_initial_balance
    FROM accounts a
    WHERE a.user_id = ANY(v_user_ids)
      AND a.is_active = true
      AND a.deleted_at IS NULL
      AND (p_view_mode = 'both' OR a.owner_user = p_view_mode)
      AND (p_account_id IS NULL OR a.id = p_account_id);

    -- Calculate income from cash_flow_history
    SELECT COALESCE(SUM(cfh.amount), 0), COUNT(*)
    INTO v_total_income, v_income_count
    FROM cash_flow_history cfh
    WHERE cfh.user_id = ANY(v_user_ids)
      AND cfh.movement_date BETWEEN p_start_date AND p_end_date
      AND cfh.movement_type = 'income'
      AND (p_view_mode = 'both' OR cfh.owner_user = p_view_mode)
      AND (p_account_id IS NULL OR cfh.account_id = p_account_id);

    -- Calculate expenses from cash_flow_history
    SELECT COALESCE(SUM(cfh.amount), 0), COUNT(*)
    INTO v_total_expense, v_expense_count
    FROM cash_flow_history cfh
    WHERE cfh.user_id = ANY(v_user_ids)
      AND cfh.movement_date BETWEEN p_start_date AND p_end_date
      AND cfh.movement_type = 'expense'
      AND (p_view_mode = 'both' OR cfh.owner_user = p_view_mode)
      AND (p_account_id IS NULL OR cfh.account_id = p_account_id);

    -- Calculate cash balance
    SELECT COALESCE(SUM(a.balance), 0)
    INTO v_cash
    FROM accounts a
    WHERE a.user_id = ANY(v_user_ids)
      AND a.is_active = true
      AND a.deleted_at IS NULL
      AND a.is_cash_account = true
      AND (p_view_mode = 'both' OR a.owner_user = p_view_mode);

    -- Calculate bank balance
    SELECT COALESCE(SUM(a.balance), 0)
    INTO v_bank
    FROM accounts a
    WHERE a.user_id = ANY(v_user_ids)
      AND a.is_active = true
      AND a.deleted_at IS NULL
      AND a.is_cash_account = false
      AND a.account_type IN ('checking', 'savings')
      AND (p_view_mode = 'both' OR a.owner_user = p_view_mode);

    -- Calculate credit limit used
    SELECT COALESCE(SUM(COALESCE(c.current_balance, 0)), 0)
    INTO v_credit
    FROM cards c
    WHERE c.user_id = ANY(v_user_ids)
      AND c.deleted_at IS NULL
      AND c.card_type = 'credit'
      AND (p_view_mode = 'both' OR c.owner_user = p_view_mode);

    RETURN QUERY SELECT
        v_initial_balance AS initial_balance,
        v_total_income AS total_income,
        v_total_expense AS total_expense,
        (v_total_income - v_total_expense) AS net_result,
        (v_initial_balance + v_total_income - v_total_expense) AS final_balance,
        (v_income_count + v_expense_count) AS transaction_count,
        v_income_count AS income_count,
        v_expense_count AS expense_count,
        (v_cash + v_bank) AS cash_available,
        v_credit AS total_debt,
        (v_cash + v_bank - v_credit) AS net_position,
        v_cash AS assets_cash,
        v_bank AS assets_bank,
        v_credit AS liabilities_credit_limit;
END;
$$;