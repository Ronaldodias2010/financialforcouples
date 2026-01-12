-- 1. Remover o trigger duplicado (mantendo apenas um)
DROP TRIGGER IF EXISTS sync_transaction_to_cash_flow_trigger ON public.transactions;

-- 2. Limpar entradas duplicadas no cash_flow_history
-- Manter apenas a primeira entrada para cada transaction_id
DELETE FROM cash_flow_history
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY transaction_id ORDER BY created_at) as rn
        FROM cash_flow_history
        WHERE transaction_id IS NOT NULL
    ) duplicates
    WHERE rn > 1
);

-- 3. Adicionar constraint única para evitar duplicações futuras
-- Primeiro verificar se já existe e remover se necessário
ALTER TABLE cash_flow_history 
DROP CONSTRAINT IF EXISTS unique_transaction_in_cash_flow;

-- Criar constraint única para transaction_id (quando não é null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_transaction_cash_flow 
ON cash_flow_history (transaction_id) 
WHERE transaction_id IS NOT NULL;