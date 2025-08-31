-- Add 'saque' to payment_method enum
ALTER TYPE payment_method_type ADD VALUE IF NOT EXISTS 'saque';

-- Update payment method constraint to include saque
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transaction_payment_method__check;
ALTER TABLE transactions ADD CONSTRAINT transaction_payment_method__check 
CHECK (payment_method IN ('cash', 'deposit', 'transfer', 'debit_card', 'credit_card', 'payment_transfer', 'account_transfer', 'account_investment', 'saque'));