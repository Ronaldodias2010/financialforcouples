-- Drop the existing constraint
ALTER TABLE cash_flow_history DROP CONSTRAINT IF EXISTS cash_flow_history_payment_method_check;

-- Create new constraint including all payment methods used in transactions
ALTER TABLE cash_flow_history ADD CONSTRAINT cash_flow_history_payment_method_check 
CHECK (payment_method IS NULL OR payment_method = ANY (ARRAY[
  'cash', 'pix', 'transfer', 'credit_card', 'debit_card', 
  'boleto', 'check', 'other', 'deposit', 'account_investment', 
  'account_transfer', 'payment_transfer'
]));

-- Update the populate_initial_cash_flow_history function to exclude internal transfers
CREATE OR REPLACE FUNCTION public.populate_initial_cash_flow_history(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  v_running_balance numeric := 0;
  v_transaction RECORD;
BEGIN
  -- Delete existing non-reconciled entries for this user
  DELETE FROM cash_flow_history 
  WHERE user_id = p_user_id AND is_reconciled = false;
  
  -- Loop through transactions ordered by date, excluding internal transfers
  FOR v_transaction IN 
    SELECT 
      t.id,
      t.description,
      t.amount,
      t.transaction_type,
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
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN accounts a ON t.account_id = a.id
    LEFT JOIN cards cd ON t.card_id = cd.id
    WHERE t.user_id = p_user_id
      -- Exclude internal transfers that shouldn't appear in cash flow
      AND t.payment_method NOT IN ('account_transfer', 'account_investment')
    ORDER BY t.transaction_date ASC, t.created_at ASC
  LOOP
    -- Calculate running balance
    IF v_transaction.transaction_type = 'income' THEN
      v_running_balance := v_running_balance + v_transaction.amount;
    ELSE
      v_running_balance := v_running_balance - v_transaction.amount;
    END IF;
    
    -- Insert into cash_flow_history
    INSERT INTO cash_flow_history (
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
      balance_after,
      period_year,
      period_month,
      period_quarter
    ) VALUES (
      p_user_id,
      v_transaction.id,
      v_transaction.description,
      v_transaction.amount,
      v_transaction.transaction_type,
      v_transaction.transaction_date,
      v_transaction.category_id,
      v_transaction.category_name,
      v_transaction.account_id,
      v_transaction.account_name,
      v_transaction.card_id,
      v_transaction.card_name,
      v_transaction.payment_method,
      COALESCE(v_transaction.owner_user, 'user1'),
      COALESCE(v_transaction.currency, 'BRL'),
      CASE WHEN v_transaction.transaction_type = 'income' 
           THEN v_running_balance - v_transaction.amount 
           ELSE v_running_balance + v_transaction.amount END,
      v_running_balance,
      EXTRACT(YEAR FROM v_transaction.transaction_date)::integer,
      EXTRACT(MONTH FROM v_transaction.transaction_date)::integer,
      EXTRACT(QUARTER FROM v_transaction.transaction_date)::integer
    );
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$;