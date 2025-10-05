-- Drop duplicate/old constraint and add comprehensive payment method constraint
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transaction_payment_method_check;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_payment_method_check;

-- Add updated constraint with all payment methods including pix, zelle
ALTER TABLE public.transactions ADD CONSTRAINT transactions_payment_method_check 
CHECK (payment_method IN (
  'cash', 
  'credit_card', 
  'debit_card', 
  'bank_transfer', 
  'pix', 
  'zelle', 
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