-- Remove the existing check constraint that's causing issues
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS transactions_payment_method_check;

-- Add a more comprehensive check constraint that allows common payment methods
ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_payment_method_check 
CHECK (
  payment_method IN (
    'cash', 
    'credit_card', 
    'debit_card', 
    'bank_transfer', 
    'pix', 
    'deposit', 
    'transfer',
    'check',
    'other'
  ) OR payment_method IS NULL
);