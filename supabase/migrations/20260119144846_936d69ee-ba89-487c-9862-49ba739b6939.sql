-- Fix get_period_initial_balance to properly filter accounts by owner_user based on viewMode
CREATE OR REPLACE FUNCTION public.get_period_initial_balance(
    p_user_id UUID,
    p_start_date DATE,
    p_account_id UUID DEFAULT NULL,
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

    -- Sum balances from ALL financial accounts (not just cash)
    -- Filter by owner_user when viewMode is not 'both'
    SELECT COALESCE(SUM(a.balance), 0)
    INTO v_current_balance
    FROM accounts a
    WHERE a.user_id = ANY(v_user_ids)
      AND a.is_active = true
      AND a.deleted_at IS NULL
      AND (
          a.is_cash_account = true 
          OR a.account_type IN ('checking', 'savings')
      )
      AND (p_account_id IS NULL OR a.id = p_account_id)
      AND (p_view_mode = 'both' OR a.owner_user = p_view_mode);

    -- Subtract all movements from start date until today
    -- Filter by owner_user when viewMode is not 'both'
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
      AND (p_account_id IS NULL OR cfh.account_id = p_account_id)
      AND (p_view_mode = 'both' OR cfh.owner_user = p_view_mode);

    RETURN v_current_balance - v_period_changes;
END;
$$;