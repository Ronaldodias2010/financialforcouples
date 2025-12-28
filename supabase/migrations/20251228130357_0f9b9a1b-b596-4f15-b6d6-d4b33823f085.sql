-- ============================================
-- MIGRAÇÃO 4 CORRIGIDA: REMOVER FKs DUPLICADAS
-- ============================================
-- Resolver conflito "more than one relationship was found"
-- Manter apenas as FKs novas (fk_*) criadas nas migrações anteriores

-- Registrar início da fase
INSERT INTO public.migration_audit_log (phase, action, status, notes)
VALUES ('4_fix', 'remove_duplicate_fks_start', 'in_progress', 'Removendo Foreign Keys duplicadas para resolver conflito PostgREST');

-- ==========================================
-- REMOVER FKs ANTIGAS DA TABELA TRANSACTIONS
-- ==========================================

-- Remover FK antiga: transactions_account_id_fkey (mantemos fk_transactions_account)
ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS transactions_account_id_fkey;

-- Remover FK antiga: transactions_card_id_fkey (mantemos fk_transactions_card)
ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS transactions_card_id_fkey;

-- Remover FK antiga: transactions_category_id_fkey (mantemos fk_transactions_category)
ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS transactions_category_id_fkey;

-- ==========================================
-- REMOVER FKs ANTIGAS DA TABELA CARDS
-- ==========================================

-- Remover FK antiga: cards_account_id_fkey (mantemos fk_cards_account)
ALTER TABLE public.cards
DROP CONSTRAINT IF EXISTS cards_account_id_fkey;

-- ==========================================
-- REMOVER FKs ANTIGAS DA TABELA CASH_FLOW_HISTORY
-- ==========================================

-- Remover FK antiga: cash_flow_history_account_id_fkey (mantemos fk_cash_flow_account)
ALTER TABLE public.cash_flow_history
DROP CONSTRAINT IF EXISTS cash_flow_history_account_id_fkey;

-- Remover FK antiga: cash_flow_history_card_id_fkey (mantemos fk_cash_flow_card)
ALTER TABLE public.cash_flow_history
DROP CONSTRAINT IF EXISTS cash_flow_history_card_id_fkey;

-- Remover FK antiga: cash_flow_history_category_id_fkey (mantemos fk_cash_flow_category)
ALTER TABLE public.cash_flow_history
DROP CONSTRAINT IF EXISTS cash_flow_history_category_id_fkey;

-- Remover FK antiga: cash_flow_history_transaction_id_fkey (mantemos fk_cash_flow_transaction)
ALTER TABLE public.cash_flow_history
DROP CONSTRAINT IF EXISTS cash_flow_history_transaction_id_fkey;

-- ==========================================
-- REMOVER FKs ANTIGAS DA TABELA MANUAL_FUTURE_EXPENSES
-- ==========================================

-- Remover FK antiga: manual_future_expenses_recurring_expense_id_fkey (mantemos fk_future_expenses_recurring)
ALTER TABLE public.manual_future_expenses
DROP CONSTRAINT IF EXISTS manual_future_expenses_recurring_expense_id_fkey;

-- ==========================================
-- VALIDAR FKs QUE AINDA ESTÃO NOT VALID
-- ==========================================

-- Validar FK: fk_transactions_account
ALTER TABLE public.transactions
VALIDATE CONSTRAINT fk_transactions_account;

-- Validar FK: fk_transactions_card
ALTER TABLE public.transactions
VALIDATE CONSTRAINT fk_transactions_card;

-- Validar FK: fk_transactions_category
ALTER TABLE public.transactions
VALIDATE CONSTRAINT fk_transactions_category;

-- Validar FK: fk_cards_account
ALTER TABLE public.cards
VALIDATE CONSTRAINT fk_cards_account;

-- Validar FK: fk_cash_flow_transaction
ALTER TABLE public.cash_flow_history
VALIDATE CONSTRAINT fk_cash_flow_transaction;

-- Validar FK: fk_cash_flow_account
ALTER TABLE public.cash_flow_history
VALIDATE CONSTRAINT fk_cash_flow_account;

-- Validar FK: fk_cash_flow_card
ALTER TABLE public.cash_flow_history
VALIDATE CONSTRAINT fk_cash_flow_card;

-- Validar FK: fk_cash_flow_category
ALTER TABLE public.cash_flow_history
VALIDATE CONSTRAINT fk_cash_flow_category;

-- Validar FK: fk_manual_future_expenses_category
ALTER TABLE public.manual_future_expenses
VALIDATE CONSTRAINT fk_manual_future_expenses_category;

-- Validar FK: fk_manual_future_incomes_account
ALTER TABLE public.manual_future_incomes
VALIDATE CONSTRAINT fk_manual_future_incomes_account;

-- Validar FK: fk_manual_future_incomes_category
ALTER TABLE public.manual_future_incomes
VALIDATE CONSTRAINT fk_manual_future_incomes_category;

-- Registrar conclusão da fase
INSERT INTO public.migration_audit_log (phase, action, status, notes)
VALUES ('4_fix', 'remove_duplicate_fks_complete', 'completed', 'Foreign Keys duplicadas removidas com sucesso. Mantidas apenas as fk_* novas.');