
-- Drop both conflicting versions
DROP FUNCTION IF EXISTS public.process_card_payment(uuid, uuid, uuid, numeric, timestamp with time zone, text);
DROP FUNCTION IF EXISTS public.process_card_payment(uuid, uuid, numeric, text, text, uuid, text);

-- Recreate with the signature matching the frontend code
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
  v_payment_date date;
  v_new_balance numeric;
  v_payment_id uuid;
BEGIN
  -- Validate card
  SELECT * INTO v_card FROM cards WHERE id = p_card_id AND user_id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Cartão não encontrado');
  END IF;

  -- Parse date
  IF p_payment_date IS NOT NULL AND p_payment_date != '' THEN
    v_payment_date := p_payment_date::date;
  ELSE
    v_payment_date := CURRENT_DATE;
  END IF;

  -- Calculate new balance
  v_new_balance := GREATEST(0, COALESCE(v_card.current_balance, 0) - p_payment_amount);

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

  -- Record transaction as card_payment type (excluded from card balance calc by triggers)
  INSERT INTO transactions (
    user_id, account_id, card_id, category_id, type, amount, currency,
    description, transaction_date, payment_method, purchase_date,
    expense_source_type, card_transaction_type, owner_user, status
  )
  SELECT
    p_user_id, p_account_id, p_card_id,
    (SELECT id FROM categories WHERE user_id = p_user_id AND name ILIKE '%Pagamento%Cart%' LIMIT 1),
    'expense', p_payment_amount, v_card.currency,
    'Pagamento de Cartão - ' || v_card.name,
    v_payment_date, 'card_payment', v_payment_date,
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
