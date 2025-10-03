-- Phase 2: Migrate data from future_expense_payments to transactions
-- This migration copies all pending future expenses to transactions table with status='pending'

-- Insert all future expense payments that haven't been converted to transactions yet
INSERT INTO public.transactions (
  user_id,
  type,
  amount,
  description,
  transaction_date,
  due_date,
  status,
  category_id,
  account_id,
  card_id,
  payment_method,
  owner_user,
  is_installment,
  installment_number,
  total_installments,
  created_at,
  updated_at
)
SELECT 
  fep.user_id,
  'expense' as type,
  fep.amount,
  fep.description,
  fep.original_due_date as transaction_date,
  fep.original_due_date as due_date,
  'pending' as status,
  fep.category_id,
  fep.account_id,
  fep.card_id,
  fep.payment_method,
  fep.owner_user,
  CASE 
    WHEN fep.expense_source_type = 'installment' THEN true
    ELSE false
  END as is_installment,
  CASE 
    WHEN fep.expense_source_type = 'installment' 
      AND fep.card_payment_info IS NOT NULL 
      AND fep.card_payment_info->>'installment_number' IS NOT NULL
    THEN (fep.card_payment_info->>'installment_number')::integer
    ELSE NULL
  END as installment_number,
  CASE 
    WHEN fep.expense_source_type = 'installment' 
      AND fep.card_payment_info IS NOT NULL 
      AND fep.card_payment_info->>'total_installments' IS NOT NULL
    THEN (fep.card_payment_info->>'total_installments')::integer
    ELSE NULL
  END as total_installments,
  fep.created_at,
  fep.updated_at
FROM public.future_expense_payments fep
WHERE fep.transaction_id IS NULL  -- Only migrate expenses that haven't been processed yet
  AND fep.original_due_date >= CURRENT_DATE;  -- Only migrate future/current expenses

-- Update future_expense_payments to reference the new transactions
UPDATE public.future_expense_payments fep
SET transaction_id = t.id,
    updated_at = now()
FROM public.transactions t
WHERE fep.transaction_id IS NULL
  AND t.user_id = fep.user_id
  AND t.amount = fep.amount
  AND t.description = fep.description
  AND t.due_date = fep.original_due_date
  AND t.status = 'pending'
  AND t.created_at = fep.created_at;

-- Log migration results
DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count
  FROM public.transactions
  WHERE status = 'pending';
  
  RAISE NOTICE 'Phase 2 completed: % pending transactions migrated', migrated_count;
END $$;
