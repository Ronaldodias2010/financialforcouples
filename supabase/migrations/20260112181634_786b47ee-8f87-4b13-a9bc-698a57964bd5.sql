-- Etapa 1: Adicionar 'card_payment' ao constraint de transactions.payment_method
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_payment_method_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_payment_method_check 
  CHECK (payment_method = ANY (ARRAY['cash', 'credit_card', 'debit_card', 'bank_transfer', 'pix', 'zelle', 'boleto', 'financing', 'installment', 'saque', 'outros', 'account_transfer', 'deposit', 'payment_transfer', 'transfer', 'account_investment', 'card_payment']));

-- Etapa 2: Merge dos registros duplicados de card_payment no cash_flow_history
-- Identificar e mesclar duplicatas (mesmo user_id, movement_date, abs(amount), created_at similar)
WITH duplicate_pairs AS (
  SELECT 
    a.id as id_with_card,
    b.id as id_with_transaction,
    b.transaction_id,
    b.account_id as tx_account_id,
    b.account_name as tx_account_name
  FROM cash_flow_history a
  JOIN cash_flow_history b ON 
    a.user_id = b.user_id 
    AND a.movement_date = b.movement_date 
    AND ABS(a.amount) = ABS(b.amount)
    AND a.movement_type = 'card_payment'
    AND b.movement_type = 'card_payment'
    AND a.id != b.id
    AND a.card_id IS NOT NULL 
    AND a.transaction_id IS NULL
    AND b.transaction_id IS NOT NULL
    AND ABS(EXTRACT(EPOCH FROM (a.created_at - b.created_at))) < 5
),
-- Atualizar o registro com card_id para incluir transaction_id e account info
updated AS (
  UPDATE cash_flow_history cfh
  SET 
    transaction_id = dp.transaction_id,
    account_id = COALESCE(cfh.account_id, dp.tx_account_id),
    account_name = COALESCE(cfh.account_name, dp.tx_account_name)
  FROM duplicate_pairs dp
  WHERE cfh.id = dp.id_with_card
  RETURNING cfh.id
)
-- Deletar o registro duplicado (o que tinha transaction_id mas não card_id)
DELETE FROM cash_flow_history
WHERE id IN (SELECT id_with_transaction FROM duplicate_pairs);

-- Etapa 3: Remover quaisquer outras duplicatas restantes de card_payment
WITH remaining_duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, movement_date, ABS(amount), movement_type
           ORDER BY 
             CASE WHEN card_id IS NOT NULL THEN 0 ELSE 1 END,
             CASE WHEN transaction_id IS NOT NULL THEN 0 ELSE 1 END,
             created_at DESC
         ) as rn
  FROM cash_flow_history
  WHERE movement_type = 'card_payment'
)
DELETE FROM cash_flow_history
WHERE id IN (SELECT id FROM remaining_duplicates WHERE rn > 1);

-- Etapa 4: Atualizar transactions.payment_method para 'card_payment' onde apropriado
UPDATE transactions
SET payment_method = 'card_payment'
WHERE card_transaction_type = 'card_payment'
  AND payment_method != 'card_payment';