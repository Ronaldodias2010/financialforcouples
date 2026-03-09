-- 1. Fix process_card_payment: allow initial_balance_original to go negative
-- This is critical so payments properly offset accumulated expenses
CREATE OR REPLACE FUNCTION public.process_card_payment(
  p_card_id uuid,
  p_user_id uuid,
  p_account_id uuid DEFAULT NULL,
  p_payment_amount numeric DEFAULT 0,
  p_payment_date text DEFAULT '',
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_card RECORD;
  v_account RECORD;
  v_payment_date date;
  v_new_balance numeric;
  v_payment_id uuid;
  v_description text;
BEGIN
  -- Validate card
  SELECT * INTO v_card FROM cards WHERE id = p_card_id AND user_id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Cartão não encontrado');
  END IF;

  -- Get account name if provided
  IF p_account_id IS NOT NULL THEN
    SELECT * INTO v_account FROM accounts WHERE id = p_account_id AND user_id = p_user_id;
  END IF;

  -- Parse date
  IF p_payment_date IS NOT NULL AND p_payment_date != '' THEN
    v_payment_date := p_payment_date::date;
  ELSE
    v_payment_date := CURRENT_DATE;
  END IF;

  -- Calculate new balance
  v_new_balance := GREATEST(0, COALESCE(v_card.current_balance, 0) - p_payment_amount);

  -- Build description
  v_description := 'Pagamento de Cartão: ' || v_card.name;
  IF v_account.name IS NOT NULL THEN
    v_description := v_description || ' (de ' || v_account.name || ')';
  END IF;

  -- Reduce initial_balance_original (ALLOW NEGATIVE as mathematical offset)
  UPDATE cards 
  SET initial_balance_original = COALESCE(initial_balance_original, 0) - p_payment_amount,
      updated_at = now()
  WHERE id = p_card_id;

  -- Record payment history
  INSERT INTO card_payment_history (card_id, user_id, account_id, payment_amount, payment_date, payment_method, notes)
  VALUES (p_card_id, p_user_id, p_account_id, p_payment_amount, v_payment_date, 'account_transfer', p_notes)
  RETURNING id INTO v_payment_id;

  -- Deduct from account if provided
  IF p_account_id IS NOT NULL THEN
    UPDATE accounts
    SET balance = balance - p_payment_amount,
        updated_at = now()
    WHERE id = p_account_id AND user_id = p_user_id;
  END IF;

  -- Record EXPENSE transaction (money leaving the account)
  INSERT INTO transactions (
    user_id, account_id, card_id, category_id, type, amount, currency,
    description, transaction_date, payment_method, purchase_date,
    expense_source_type, card_transaction_type, owner_user, status
  )
  SELECT
    p_user_id, p_account_id, p_card_id,
    (SELECT id FROM categories WHERE user_id = p_user_id AND name ILIKE '%Pagamento%Cart%' LIMIT 1),
    'expense', p_payment_amount, v_card.currency,
    v_description,
    v_payment_date, 'account_transfer', v_payment_date,
    'regular', 'card_payment',
    v_card.owner_user, 'completed';

  -- Record INCOME transaction (debt reduction on card)
  INSERT INTO transactions (
    user_id, account_id, card_id, category_id, type, amount, currency,
    description, transaction_date, payment_method, purchase_date,
    expense_source_type, card_transaction_type, owner_user, status
  )
  SELECT
    p_user_id, NULL, p_card_id,
    (SELECT id FROM categories WHERE user_id = p_user_id AND name ILIKE '%Pagamento%Cart%' LIMIT 1),
    'income', p_payment_amount, v_card.currency,
    v_description,
    v_payment_date, 'account_transfer', v_payment_date,
    'regular', 'card_payment',
    v_card.owner_user, 'completed';

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Pagamento de R$ ' || p_payment_amount || ' processado para ' || v_card.name,
    'new_balance', v_new_balance,
    'payment_id', v_payment_id
  );
END;
$$;

-- 2. Fix old mistagged payment transactions
UPDATE public.transactions 
SET card_transaction_type = 'card_payment'
WHERE id IN ('5efc0a26-05af-4144-bcae-30ba4d9c56e0', '61083b44-cf6b-4ae8-a164-bb6b6e74e136')
  AND card_transaction_type = 'future_expense';

-- 3. Recalculate ibo for Inter Black card
-- Total payments ever: 15750+100+999+700+1000+220+100+600 = 19469
-- ibo should be negative to offset paid expenses
-- Formula: current_balance = ibo + total_non_payment_expenses
-- After fixing mistagged txns, non_payment_expenses = 4104.27
-- User paid 15750 now, card should reflect ~R$150 debt (15900-15750)
-- So ibo = 150 - 4104.27 = -3954.27
-- But let's calculate properly: ibo = -(sum_of_all_payments) + original_debt_offset
-- Setting ibo so that debt = real_expenses - total_payments_offset
UPDATE public.cards
SET initial_balance_original = -3954.27,
    current_balance = 150,
    initial_balance = 15750,
    updated_at = now()
WHERE id = 'c76d59fe-81ff-4236-a136-c6bb63dfc609';