-- Adicionar coluna para armazenar o saldo inicial informado pelo usuário
ALTER TABLE public.cards 
ADD COLUMN initial_balance numeric DEFAULT 0;

-- Migrar dados existentes: o current_balance atual será considerado como initial_balance
UPDATE public.cards 
SET initial_balance = current_balance;

-- Agora o current_balance será calculado apenas pelos gastos das transações
-- O trigger já existe e vai funcionar corretamente