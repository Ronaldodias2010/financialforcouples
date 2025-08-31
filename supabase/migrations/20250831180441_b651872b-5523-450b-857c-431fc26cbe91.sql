-- Remove all existing cash accounts (Dinheiro cards) from all users
-- These will be replaced by the unified CashAccountCard component
DELETE FROM accounts WHERE is_cash_account = true;