
-- =====================================================
-- FIX: Corrigir saldos dos cartões da Priscila
-- =====================================================

-- 1. Corrigir transações de pagamento do Inter (devem ser card_payment, não future_expense)
UPDATE transactions 
SET card_transaction_type = 'card_payment'
WHERE card_id = 'a02ed5e9-e832-40e3-b229-6bddfdfc06b5' 
  AND description LIKE 'Pagamento de Cartão%'
  AND deleted_at IS NULL;

-- 2. Corrigir transação de pagamento do Mercado Pago
UPDATE transactions 
SET card_transaction_type = 'card_payment'
WHERE card_id = '75676cb4-431b-4146-ab02-80d77d035bf1' 
  AND description LIKE 'Pagamento de Cartão%'
  AND deleted_at IS NULL;

-- 3. Recalcular Inter: expenses reais = 20.00, queremos current_balance = 1130.81
-- ibo = 1130.81 - 20.00 = 1110.81
UPDATE cards 
SET initial_balance_original = 1110.81,
    current_balance = 1130.81,
    initial_balance = GREATEST(0, 1144.46 - 1130.81),
    updated_at = now()
WHERE id = 'a02ed5e9-e832-40e3-b229-6bddfdfc06b5';

-- 4. Recalcular Mercado Pago: expenses reais (sem pagamentos) = 3007.28, queremos current_balance = 6400
-- ibo = 6400 - 3007.28 = 3392.72
UPDATE cards 
SET initial_balance_original = 3392.72,
    current_balance = 6400.00,
    initial_balance = GREATEST(0, 6000.00 - 6400.00),
    updated_at = now()
WHERE id = '75676cb4-431b-4146-ab02-80d77d035bf1';
