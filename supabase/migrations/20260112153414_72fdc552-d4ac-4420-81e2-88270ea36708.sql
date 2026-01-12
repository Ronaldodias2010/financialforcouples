-- =====================================================
-- REFORMULAÇÃO DO FLUXO DE CAIXA: ATIVOS vs PASSIVOS
-- =====================================================

-- 1. Criar função para obter posição financeira detalhada
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
    v_credit_limit NUMERIC := 0;
BEGIN
    -- Determinar quais usuários incluir
    IF p_view_mode = 'both' THEN
        SELECT ARRAY[uc.user1_id, uc.user2_id]
        INTO v_user_ids
        FROM user_couples uc
        WHERE uc.status = 'active'
          AND (uc.user1_id = p_user_id OR uc.user2_id = p_user_id);
        
        IF v_user_ids IS NULL THEN
            v_user_ids := ARRAY[p_user_id];
        END IF;
    ELSE
        v_user_ids := ARRAY[p_user_id];
    END IF;

    -- Calcular saldo em dinheiro (contas marcadas como is_cash_account)
    SELECT COALESCE(SUM(
        CASE 
            WHEN a.balance >= 0 THEN a.balance
            ELSE 0
        END
    ), 0)
    INTO v_cash
    FROM accounts a
    WHERE a.user_id = ANY(v_user_ids)
      AND a.is_active = true
      AND a.deleted_at IS NULL
      AND a.is_cash_account = true;

    -- Calcular saldo em bancos (contas correntes e poupança, apenas positivos)
    SELECT COALESCE(SUM(
        CASE 
            WHEN a.balance >= 0 THEN a.balance
            ELSE 0
        END
    ), 0)
    INTO v_bank
    FROM accounts a
    WHERE a.user_id = ANY(v_user_ids)
      AND a.is_active = true
      AND a.deleted_at IS NULL
      AND a.is_cash_account = false
      AND a.account_type IN ('checking', 'savings');

    -- Calcular limite de crédito utilizado (saldos negativos em contas bancárias)
    SELECT COALESCE(SUM(
        CASE 
            WHEN a.balance < 0 THEN a.balance
            ELSE 0
        END
    ), 0)
    INTO v_credit_limit
    FROM accounts a
    WHERE a.user_id = ANY(v_user_ids)
      AND a.is_active = true
      AND a.deleted_at IS NULL
      AND a.account_type IN ('checking', 'savings');

    -- Também incluir saldos negativos de contas de dinheiro como limite usado
    v_credit_limit := v_credit_limit + COALESCE((
        SELECT SUM(a.balance)
        FROM accounts a
        WHERE a.user_id = ANY(v_user_ids)
          AND a.is_active = true
          AND a.deleted_at IS NULL
          AND a.is_cash_account = true
          AND a.balance < 0
    ), 0);

    RETURN QUERY SELECT 
        v_cash AS cash_balance,
        v_bank AS bank_balance,
        v_credit_limit AS credit_limit_used,
        (v_cash + v_bank) AS available_cash,
        (v_cash + v_bank + v_credit_limit) AS net_position,
        (v_cash + v_bank) AS total_assets,
        ABS(v_credit_limit) AS total_liabilities;
END;
$$;

-- 2. Criar função para obter resumo financeiro completo do fluxo de caixa
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
    v_transaction_count BIGINT := 0;
    v_cash NUMERIC := 0;
    v_bank NUMERIC := 0;
    v_credit_limit NUMERIC := 0;
BEGIN
    -- Determinar quais usuários incluir
    IF p_view_mode = 'both' THEN
        SELECT ARRAY[uc.user1_id, uc.user2_id]
        INTO v_user_ids
        FROM user_couples uc
        WHERE uc.status = 'active'
          AND (uc.user1_id = p_user_id OR uc.user2_id = p_user_id);
        
        IF v_user_ids IS NULL THEN
            v_user_ids := ARRAY[p_user_id];
        END IF;
    ELSE
        v_user_ids := ARRAY[p_user_id];
    END IF;

    -- Calcular saldo inicial baseado em TODAS as contas financeiras (não apenas dinheiro)
    -- Somar saldos de contas ativas (checking, savings) e dinheiro
    SELECT COALESCE(SUM(a.balance), 0)
    INTO v_initial_balance
    FROM accounts a
    WHERE a.user_id = ANY(v_user_ids)
      AND a.is_active = true
      AND a.deleted_at IS NULL
      AND (
          a.is_cash_account = true 
          OR a.account_type IN ('checking', 'savings')
      )
      AND (p_account_id IS NULL OR a.id = p_account_id);

    -- Subtrair movimentações do período para obter saldo inicial real
    v_initial_balance := v_initial_balance - COALESCE((
        SELECT SUM(
            CASE 
                WHEN cfh.movement_type = 'income' THEN cfh.amount
                WHEN cfh.movement_type = 'expense' THEN -cfh.amount
                ELSE 0
            END
        )
        FROM cash_flow_history cfh
        WHERE cfh.user_id = ANY(v_user_ids)
          AND cfh.movement_date >= p_start_date
          AND cfh.movement_date <= p_end_date
          AND (p_account_id IS NULL OR cfh.account_id = p_account_id)
          AND (p_view_mode = 'both' OR cfh.owner_user = p_view_mode)
    ), 0);

    -- Calcular totais do período
    SELECT 
        COALESCE(SUM(CASE WHEN cfh.movement_type = 'income' THEN cfh.amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN cfh.movement_type = 'expense' THEN cfh.amount ELSE 0 END), 0),
        COUNT(CASE WHEN cfh.movement_type = 'income' THEN 1 END),
        COUNT(CASE WHEN cfh.movement_type = 'expense' THEN 1 END),
        COUNT(*)
    INTO v_total_income, v_total_expense, v_income_count, v_expense_count, v_transaction_count
    FROM cash_flow_history cfh
    WHERE cfh.user_id = ANY(v_user_ids)
      AND cfh.movement_date >= p_start_date
      AND cfh.movement_date <= p_end_date
      AND cfh.movement_type IN ('income', 'expense')
      AND (p_account_id IS NULL OR cfh.account_id = p_account_id)
      AND (p_view_mode = 'both' OR cfh.owner_user = p_view_mode);

    -- Obter posição financeira atual
    SELECT 
        fp.cash_balance,
        fp.bank_balance,
        fp.credit_limit_used
    INTO v_cash, v_bank, v_credit_limit
    FROM get_financial_position(p_user_id, p_end_date, p_view_mode) fp;

    RETURN QUERY SELECT 
        v_initial_balance AS initial_balance,
        v_total_income AS total_income,
        v_total_expense AS total_expense,
        (v_total_income - v_total_expense) AS net_result,
        (v_initial_balance + v_total_income - v_total_expense) AS final_balance,
        v_transaction_count AS transaction_count,
        v_income_count AS income_count,
        v_expense_count AS expense_count,
        (v_cash + v_bank) AS cash_available,
        ABS(v_credit_limit) AS total_debt,
        (v_cash + v_bank + v_credit_limit) AS net_position,
        v_cash AS assets_cash,
        v_bank AS assets_bank,
        ABS(v_credit_limit) AS liabilities_credit_limit;
END;
$$;

-- 3. Atualizar a função get_period_initial_balance para considerar todas as contas
CREATE OR REPLACE FUNCTION public.get_period_initial_balance(
    p_user_id UUID,
    p_start_date DATE,
    p_view_mode TEXT DEFAULT 'both'
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_ids UUID[];
    v_current_balance NUMERIC := 0;
    v_period_changes NUMERIC := 0;
BEGIN
    -- Determinar quais usuários incluir
    IF p_view_mode = 'both' THEN
        SELECT ARRAY[uc.user1_id, uc.user2_id]
        INTO v_user_ids
        FROM user_couples uc
        WHERE uc.status = 'active'
          AND (uc.user1_id = p_user_id OR uc.user2_id = p_user_id);
        
        IF v_user_ids IS NULL THEN
            v_user_ids := ARRAY[p_user_id];
        END IF;
    ELSE
        v_user_ids := ARRAY[p_user_id];
    END IF;

    -- Somar saldos de TODAS as contas financeiras (não apenas dinheiro)
    SELECT COALESCE(SUM(a.balance), 0)
    INTO v_current_balance
    FROM accounts a
    WHERE a.user_id = ANY(v_user_ids)
      AND a.is_active = true
      AND a.deleted_at IS NULL
      AND (
          a.is_cash_account = true 
          OR a.account_type IN ('checking', 'savings')
      );

    -- Subtrair todas as movimentações a partir da data inicial até hoje
    SELECT COALESCE(SUM(
        CASE 
            WHEN cfh.movement_type = 'income' THEN cfh.amount
            WHEN cfh.movement_type = 'expense' THEN -cfh.amount
            ELSE 0
        END
    ), 0)
    INTO v_period_changes
    FROM cash_flow_history cfh
    WHERE cfh.user_id = ANY(v_user_ids)
      AND cfh.movement_date >= p_start_date
      AND (p_view_mode = 'both' OR cfh.owner_user = p_view_mode);

    RETURN v_current_balance - v_period_changes;
END;
$$;

-- 4. Criar função para obter breakdown de contas por tipo
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
    -- Determinar quais usuários incluir
    IF p_view_mode = 'both' THEN
        SELECT ARRAY[uc.user1_id, uc.user2_id]
        INTO v_user_ids
        FROM user_couples uc
        WHERE uc.status = 'active'
          AND (uc.user1_id = p_user_id OR uc.user2_id = p_user_id);
        
        IF v_user_ids IS NULL THEN
            v_user_ids := ARRAY[p_user_id];
        END IF;
    ELSE
        v_user_ids := ARRAY[p_user_id];
    END IF;

    RETURN QUERY
    SELECT 
        a.id AS account_id,
        a.name AS account_name,
        a.account_type::TEXT AS account_type,
        a.is_cash_account,
        a.balance,
        (a.balance >= 0) AS is_asset,
        CASE 
            WHEN a.is_cash_account = true THEN 'cash'
            WHEN a.account_type IN ('checking', 'savings') AND a.balance >= 0 THEN 'bank'
            WHEN a.balance < 0 THEN 'credit_limit'
            ELSE 'other'
        END AS category
    FROM accounts a
    WHERE a.user_id = ANY(v_user_ids)
      AND a.is_active = true
      AND a.deleted_at IS NULL
      AND (
          a.is_cash_account = true 
          OR a.account_type IN ('checking', 'savings')
      )
    ORDER BY 
        CASE 
            WHEN a.is_cash_account = true THEN 1
            WHEN a.balance >= 0 THEN 2
            ELSE 3
        END,
        a.name;
END;
$$;