-- Add payment method constraint to include saque
ALTER TABLE transactions ADD CONSTRAINT transaction_payment_method_check 
CHECK (payment_method IN ('cash', 'deposit', 'transfer', 'debit_card', 'credit_card', 'payment_transfer', 'account_transfer', 'account_investment', 'saque'));