
-- Update process_card_payment to use account_transfer as payment_method
-- so card payments appear in Transfers tab
CREATE OR REPLACE FUNCTION public.process_card_payment(
  p_card_id uuid,
  p_user_id uuid,
  p_account_id uuid DEFAULT NULL,
  p_payment_amount numeric DEFAULT 0,
  p_payment_date text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  -- Build description with source and destination
  v_description := 'Pagamento de Cartão: ' || v_card.name;
  IF v_account.name IS NOT NULL THEN
    v_description := v_description || ' (de ' || v_account.name || ')';
  END IF;

  -- Reduce initial_balance_original to free up limit
  UPDATE cards 
  SET initial_balance_original = GREATEST(0, COALESCE(initial_balance_original, 0) - p_payment_amount),
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

  -- Record EXPENSE transaction (money leaving the account) as account_transfer
  -- card_transaction_type = 'card_payment' keeps it identifiable
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

  -- Record INCOME transaction (money arriving at the card/debt reduction)
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
