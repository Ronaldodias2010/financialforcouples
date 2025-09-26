-- Check current constraints on transactions table using correct syntax
SELECT 
  conname,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.transactions'::regclass 
AND contype = 'c' 
AND pg_get_constraintdef(oid) LIKE '%payment_method%';

-- Drop the incorrect constraint that doesn't allow 'account_investment'
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS transactions_payment_method_check;

-- Add the corrected constraint that includes all necessary payment methods
ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_payment_method_check 
CHECK (payment_method IN (
  'cash',
  'credit_card', 
  'debit_card',
  'bank_transfer',
  'pix',
  'boleto', 
  'financing',
  'installment',
  'saque',
  'outros',
  'account_transfer',
  'deposit',
  'payment_transfer',
  'transfer',
  'account_investment'
));