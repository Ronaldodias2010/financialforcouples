-- Fase 1: Deletar função ANTIGA (com p_payment_method)
DROP FUNCTION IF EXISTS public.process_card_payment(uuid, uuid, numeric, date, text, uuid, text);

-- Fase 2: Limpar transação duplicada criada pela função antiga
DELETE FROM transactions 
WHERE id = '46599a9c-e43b-4231-8d6e-6308fbb4f4e2';

-- Atualizar transação correta para ter payment_method = 'deposit' (valor válido da constraint)
UPDATE transactions 
SET payment_method = 'deposit'
WHERE id = '450e6493-1e53-4b2d-80fc-5a0ca5726af3';