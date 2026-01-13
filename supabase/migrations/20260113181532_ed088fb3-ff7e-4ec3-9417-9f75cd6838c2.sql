-- Primeiro remover do cash_flow_history para evitar conflito de unique constraint
DELETE FROM public.cash_flow_history 
WHERE transaction_id = 'c68b9fc0-3cbc-4de1-9671-799b1ba8f711';

-- Agora atualizar a transação com purchase_date correto (data do pagamento)
UPDATE public.transactions
SET purchase_date = '2026-01-13'
WHERE id = 'c68b9fc0-3cbc-4de1-9671-799b1ba8f711';