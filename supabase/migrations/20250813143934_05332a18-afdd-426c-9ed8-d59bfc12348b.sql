-- Update the payment_method constraint to include payment_transfer
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS transactions_payment_method_check;

ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_payment_method_check 
CHECK (payment_method IS NULL OR payment_method = ANY (ARRAY[
  'cash'::text, 
  'credit_card'::text, 
  'debit_card'::text, 
  'bank_transfer'::text, 
  'pix'::text, 
  'deposit'::text, 
  'transfer'::text, 
  'check'::text, 
  'other'::text,
  'payment_transfer'::text,
  'account_transfer'::text,
  'account_investment'::text
]));