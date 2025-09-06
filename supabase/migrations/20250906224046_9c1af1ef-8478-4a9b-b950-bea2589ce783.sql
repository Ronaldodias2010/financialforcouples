-- Corrigir categorização das transações

-- 1. Corrigir a transação que está como "Bônus" mas é despesa (Transfer de 8.00)
UPDATE transactions 
SET category_id = NULL 
WHERE id = '401f12a7-abba-440a-834f-3a8a23e749df' 
AND description = 'Transfer' 
AND type = 'expense' 
AND amount = 8.00;

-- 2. Atualizar pagamentos de cartão de crédito para categoria correta
-- Para Ronaldo Dias Silva (user1)
UPDATE transactions 
SET category_id = 'e6981328-1c63-414c-9a41-f076b5da0fd1'
WHERE user_id = 'fdc6cdb6-9478-4225-b450-93bfbaaf499a'
AND type = 'expense'
AND (description LIKE '%Pagamento de Cartão de Crédito%' OR description LIKE '%Pgto do cartao de credito%')
AND category_id IS NULL;

-- Para Priscila S Queiroz (user2) - usar a categoria dela
UPDATE transactions 
SET category_id = 'f1d6d3db-c6d8-4ac5-a299-45e7600611bf'
WHERE user_id = 'a46d7924-c398-4b18-a795-73e248fa10c2'
AND type = 'expense'
AND (description LIKE '%Pagamento de Cartão de Crédito%' OR description LIKE '%Pgto do cartao de credito%')
AND category_id IS NULL;

-- 3. Atualizar despesas de alimentação para categoria Alimentação
-- Para Ronaldo Dias Silva
UPDATE transactions 
SET category_id = 'b0839cd2-c94f-4bbc-8039-f4e198fd70bb'
WHERE user_id = 'fdc6cdb6-9478-4225-b450-93bfbaaf499a'
AND type = 'expense'
AND (description LIKE '%Mercado%' 
     OR description LIKE '%Despesa de Padaria%' 
     OR description LIKE '%Despesa de restaurante%'
     OR description LIKE '%Compra de chiclete%'
     OR description LIKE '%Pastel%'
     OR description LIKE '%lanchonete%')
AND category_id IS NULL;

-- Para Priscila S Queiroz
UPDATE transactions 
SET category_id = '71286abc-a3c6-4056-8c39-bde4f96e2928'
WHERE user_id = 'a46d7924-c398-4b18-a795-73e248fa10c2'
AND type = 'expense'
AND (description LIKE '%Mercado%' 
     OR description LIKE '%Despesa de Padaria%' 
     OR description LIKE '%Despesa de restaurante%'
     OR description LIKE '%compras na feira%'
     OR description LIKE '%padaria%'
     OR description LIKE '%restaurante%')
AND category_id IS NULL;