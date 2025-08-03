-- Primeiro, remover o trigger existente se houver
DROP TRIGGER IF EXISTS update_card_balance_trigger ON public.transactions;