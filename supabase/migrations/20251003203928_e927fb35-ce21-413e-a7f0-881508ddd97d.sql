-- Drop future_expense_payments table (legacy)
-- All installment and future expense data is now managed in the transactions table

DROP TABLE IF EXISTS public.future_expense_payments CASCADE;

-- Drop the backup table as well
DROP TABLE IF EXISTS public._backup_future_expense_payments_installments CASCADE;

-- Add comment to document this migration
COMMENT ON TABLE public.transactions IS 'Unified table for all transactions including installments. Replaces legacy future_expense_payments table.';