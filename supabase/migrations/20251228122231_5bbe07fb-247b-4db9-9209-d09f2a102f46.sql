
-- Remover FKs duplicadas que criamos (manter as originais que já existiam)
-- Isso resolve a ambiguidade nas queries do Supabase

-- cards: já tinha cards_account_id_fkey
ALTER TABLE public.cards DROP CONSTRAINT IF EXISTS fk_cards_account;

-- cash_flow_history: já tinha as FKs originais
ALTER TABLE public.cash_flow_history DROP CONSTRAINT IF EXISTS fk_cashflow_account;
ALTER TABLE public.cash_flow_history DROP CONSTRAINT IF EXISTS fk_cashflow_card;
ALTER TABLE public.cash_flow_history DROP CONSTRAINT IF EXISTS fk_cashflow_category;
ALTER TABLE public.cash_flow_history DROP CONSTRAINT IF EXISTS fk_cashflow_transaction;

-- investments: já tinha investments_goal_id_fkey
ALTER TABLE public.investments DROP CONSTRAINT IF EXISTS fk_investments_goal;

-- manual_future_expenses: já tinha manual_future_expenses_recurring_expense_id_fkey
-- MAS não tinha FK para category e transaction, então mantemos essas

-- recurring_expenses: já tinha as FKs originais
ALTER TABLE public.recurring_expenses DROP CONSTRAINT IF EXISTS fk_recurring_expenses_account;
ALTER TABLE public.recurring_expenses DROP CONSTRAINT IF EXISTS fk_recurring_expenses_card;
ALTER TABLE public.recurring_expenses DROP CONSTRAINT IF EXISTS fk_recurring_expenses_category;
