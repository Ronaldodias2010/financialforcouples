-- Fix Sicredi Gold card data: set initial_balance = credit_limit and recalculate current_balance
-- so that available = 8000 - 7214.48 = 785.52
UPDATE cards 
SET initial_balance = 8000, 
    current_balance = 7214.48
WHERE name = 'Sicredi Gold' 
  AND credit_limit = 8000 
  AND card_type = 'credit';