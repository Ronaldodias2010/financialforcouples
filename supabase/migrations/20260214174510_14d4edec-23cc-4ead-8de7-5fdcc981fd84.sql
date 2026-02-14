UPDATE cards 
SET initial_balance = credit_limit 
WHERE name = 'Inter Black' 
  AND card_type = 'credit' 
  AND initial_balance != credit_limit;