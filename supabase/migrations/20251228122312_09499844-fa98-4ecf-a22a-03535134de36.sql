
-- Remover TODAS as FKs duplicadas que criamos para resolver ambiguidade

-- transactions: remover as que criamos (manter nenhuma FK para categories, accounts, cards 
-- pois não existiam antes e causaram o problema)
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS fk_transactions_account;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS fk_transactions_card;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS fk_transactions_category;

-- manual_future_expenses: remover as que criamos
ALTER TABLE public.manual_future_expenses DROP CONSTRAINT IF EXISTS fk_future_expenses_category;
ALTER TABLE public.manual_future_expenses DROP CONSTRAINT IF EXISTS fk_future_expenses_transaction;

-- manual_future_incomes: remover as que criamos  
ALTER TABLE public.manual_future_incomes DROP CONSTRAINT IF EXISTS fk_future_incomes_category;
ALTER TABLE public.manual_future_incomes DROP CONSTRAINT IF EXISTS fk_future_incomes_account;
ALTER TABLE public.manual_future_incomes DROP CONSTRAINT IF EXISTS fk_future_incomes_transaction;
