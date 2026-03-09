-- Fix the existing card_payment expense transaction that was incorrectly changed to future_expense
UPDATE public.transactions 
SET card_transaction_type = 'card_payment'
WHERE id = '5deb0e58-5ad5-4018-aab1-99b738c4e4c8'
  AND card_transaction_type = 'future_expense'
  AND description LIKE 'Pagamento de Cartão%';

-- Restore the Banco Inter account balance (add back the double-deducted 15750)
UPDATE public.accounts 
SET balance = balance + 15750,
    updated_at = now()
WHERE id = '3142a008-337b-42c6-88b8-905e4afb5e04';