-- Fix get_period_initial_balance to correctly sum both users' balances for 'both' view mode
CREATE OR REPLACE FUNCTION public.get_period_initial_balance(p_user_id uuid, p_start_date date, p_account_id uuid DEFAULT NULL::uuid, p_view_mode text DEFAULT 'both'::text)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_initial_balance NUMERIC := 0;
  v_user1_balance NUMERIC := 0;
  v_user2_balance NUMERIC := 0;
  v_couple_user_id UUID;
BEGIN
  -- ALWAYS detect couple partner
  SELECT CASE 
    WHEN user1_id = p_user_id THEN user2_id 
    ELSE user1_id 
  END INTO v_couple_user_id
  FROM public.user_couples 
  WHERE status = 'active' 
  AND (user1_id = p_user_id OR user2_id = p_user_id);

  IF p_view_mode = 'both' THEN
    -- For 'both' mode: get separate balances for user1 and user2, then sum them
    
    -- Get last balance for owner_user = 'user1'
    SELECT COALESCE(balance_after, 0) INTO v_user1_balance
    FROM public.cash_flow_history
    WHERE movement_date < p_start_date
      AND (
        user_id = p_user_id 
        OR (v_couple_user_id IS NOT NULL AND user_id = v_couple_user_id)
      )
      AND (p_account_id IS NULL OR account_id = p_account_id)
      AND owner_user = 'user1'
    ORDER BY movement_date DESC, created_at DESC
    LIMIT 1;

    -- Get last balance for owner_user = 'user2'
    SELECT COALESCE(balance_after, 0) INTO v_user2_balance
    FROM public.cash_flow_history
    WHERE movement_date < p_start_date
      AND (
        user_id = p_user_id 
        OR (v_couple_user_id IS NOT NULL AND user_id = v_couple_user_id)
      )
      AND (p_account_id IS NULL OR account_id = p_account_id)
      AND owner_user = 'user2'
    ORDER BY movement_date DESC, created_at DESC
    LIMIT 1;

    -- If no history for user1, try accounts
    IF v_user1_balance IS NULL OR v_user1_balance = 0 THEN
      SELECT COALESCE(SUM(balance), 0) INTO v_user1_balance
      FROM public.accounts
      WHERE (
        user_id = p_user_id 
        OR (v_couple_user_id IS NOT NULL AND user_id = v_couple_user_id)
      )
      AND (p_account_id IS NULL OR id = p_account_id)
      AND is_active = true
      AND owner_user = 'user1';
    END IF;

    -- If no history for user2, try accounts
    IF v_user2_balance IS NULL OR v_user2_balance = 0 THEN
      SELECT COALESCE(SUM(balance), 0) INTO v_user2_balance
      FROM public.accounts
      WHERE (
        user_id = p_user_id 
        OR (v_couple_user_id IS NOT NULL AND user_id = v_couple_user_id)
      )
      AND (p_account_id IS NULL OR id = p_account_id)
      AND is_active = true
      AND owner_user = 'user2';
    END IF;

    v_initial_balance := COALESCE(v_user1_balance, 0) + COALESCE(v_user2_balance, 0);

  ELSE
    -- For 'user1' or 'user2' mode: get balance for that specific owner only
    SELECT COALESCE(balance_after, 0) INTO v_initial_balance
    FROM public.cash_flow_history
    WHERE movement_date < p_start_date
      AND (
        user_id = p_user_id 
        OR (v_couple_user_id IS NOT NULL AND user_id = v_couple_user_id)
      )
      AND (p_account_id IS NULL OR account_id = p_account_id)
      AND owner_user = p_view_mode
    ORDER BY movement_date DESC, created_at DESC
    LIMIT 1;

    -- Fallback to accounts if no history
    IF v_initial_balance IS NULL THEN
      SELECT COALESCE(SUM(balance), 0) INTO v_initial_balance
      FROM public.accounts
      WHERE (
        user_id = p_user_id 
        OR (v_couple_user_id IS NOT NULL AND user_id = v_couple_user_id)
      )
      AND (p_account_id IS NULL OR id = p_account_id)
      AND is_active = true
      AND owner_user = p_view_mode;
    END IF;
  END IF;

  RETURN COALESCE(v_initial_balance, 0);
END;
$function$;