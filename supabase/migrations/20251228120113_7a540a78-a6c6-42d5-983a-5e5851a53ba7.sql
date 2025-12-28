-- Fix populate_initial_cash_flow_history to import transactions from ALL users in the couple
-- This ensures that when one user runs the import, ALL transactions from BOTH users are imported

CREATE OR REPLACE FUNCTION public.populate_initial_cash_flow_history(p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count integer := 0;
  v_couple_user_id UUID;
  v_running_balance_user1 numeric := 0;
  v_running_balance_user2 numeric := 0;
  v_balance_before numeric := 0;
  v_balance_after numeric := 0;
  v_transaction RECORD;
  v_movement_type text;
  v_owner_user text;
  v_is_user1 boolean;
BEGIN
  -- Detect couple partner
  SELECT CASE 
    WHEN user1_id = p_user_id THEN user2_id 
    ELSE user1_id 
  END INTO v_couple_user_id
  FROM public.user_couples 
  WHERE status = 'active' 
  AND (user1_id = p_user_id OR user2_id = p_user_id);

  -- Delete existing non-reconciled entries for BOTH users in the couple
  DELETE FROM public.cash_flow_history
  WHERE user_id = p_user_id AND is_reconciled = false;

  IF v_couple_user_id IS NOT NULL THEN
    DELETE FROM public.cash_flow_history
    WHERE user_id = v_couple_user_id AND is_reconciled = false;
  END IF;

  -- Determine if p_user_id is user1 in the couple
  v_is_user1 := EXISTS(
    SELECT 1 FROM public.user_couples 
    WHERE user1_id = p_user_id AND status = 'active'
  );

  -- Process ALL transactions from BOTH users in the couple, ordered by date
  -- Each transaction maintains separate running balances per owner_user
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
      t.currency,
      -- Determine actual owner_user based on user_id if owner_user is null
      CASE 
        WHEN t.owner_user IS NOT NULL THEN t.owner_user
        WHEN t.user_id = p_user_id AND v_is_user1 THEN 'user1'
        WHEN t.user_id = p_user_id AND NOT v_is_user1 THEN 'user2'
        WHEN t.user_id = v_couple_user_id AND v_is_user1 THEN 'user2'
        WHEN t.user_id = v_couple_user_id AND NOT v_is_user1 THEN 'user1'
        ELSE 'user1'
      END as effective_owner_user
    FROM public.transactions t
    LEFT JOIN public.categories c ON t.category_id = c.id
    LEFT JOIN public.accounts a ON t.account_id = a.id
    LEFT JOIN public.cards cd ON t.card_id = cd.id
    WHERE (
      t.user_id = p_user_id 
      OR (v_couple_user_id IS NOT NULL AND t.user_id = v_couple_user_id)
    )
      AND t.status = 'completed'
      AND (t.payment_method IS NULL OR t.payment_method NOT IN ('account_transfer', 'account_investment'))
    ORDER BY t.transaction_date ASC, t.created_at ASC
  LOOP
    v_movement_type := CASE WHEN v_transaction.tx_type = 'income' THEN 'income' ELSE 'expense' END;
    v_owner_user := v_transaction.effective_owner_user;

    -- Calculate balance based on which owner this transaction belongs to
    IF v_owner_user = 'user1' THEN
      v_balance_before := v_running_balance_user1;
      v_running_balance_user1 := v_running_balance_user1 + CASE
        WHEN v_transaction.tx_type = 'income' THEN v_transaction.amount
        ELSE -v_transaction.amount
      END;
      v_balance_after := v_running_balance_user1;
    ELSE
      v_balance_before := v_running_balance_user2;
      v_running_balance_user2 := v_running_balance_user2 + CASE
        WHEN v_transaction.tx_type = 'income' THEN v_transaction.amount
        ELSE -v_transaction.amount
      END;
      v_balance_after := v_running_balance_user2;
    END IF;

    -- Insert into cash_flow_history with the ORIGINAL user_id from the transaction
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
      v_transaction.user_id, -- Keep original user_id from transaction
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

  RETURN v_count;
END;
$function$;