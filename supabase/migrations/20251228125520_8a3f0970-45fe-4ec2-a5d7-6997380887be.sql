-- ============================================
-- MIGRAÇÃO 3: FASE 2b - FOREIGN KEYS GRUPOS B, C, D, E
-- ============================================
-- Rollback: Ver lista completa no final

-- Registrar início da fase
INSERT INTO public.migration_audit_log (phase, action, status, notes)
VALUES ('2b', 'fk_groups_bcde_start', 'in_progress', 'Iniciando criação de Foreign Keys dos Grupos B, C, D, E');

-- ==========================================
-- GRUPO B: INVESTMENTS
-- ==========================================

-- FK: investments.goal_id -> investment_goals.id (já existe)
-- Verificar e criar apenas se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'investments_goal_id_fkey') THEN
    ALTER TABLE public.investments
    ADD CONSTRAINT fk_investments_goal
    FOREIGN KEY (goal_id)
    REFERENCES public.investment_goals(id)
    ON DELETE SET NULL
    NOT VALID;
  END IF;
END $$;

-- FK: investment_performance.investment_id -> investments.id (já existe)
-- Verificar e criar apenas se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'investment_performance_investment_id_fkey') THEN
    ALTER TABLE public.investment_performance
    ADD CONSTRAINT fk_investment_performance_investment
    FOREIGN KEY (investment_id)
    REFERENCES public.investments(id)
    ON DELETE CASCADE
    NOT VALID;
  END IF;
END $$;

-- ==========================================
-- GRUPO C: CASH FLOW HISTORY
-- ==========================================

-- FK: cash_flow_history.transaction_id -> transactions.id
ALTER TABLE public.cash_flow_history
ADD CONSTRAINT fk_cash_flow_transaction
FOREIGN KEY (transaction_id)
REFERENCES public.transactions(id)
ON DELETE SET NULL
NOT VALID;

-- FK: cash_flow_history.account_id -> accounts.id
ALTER TABLE public.cash_flow_history
ADD CONSTRAINT fk_cash_flow_account
FOREIGN KEY (account_id)
REFERENCES public.accounts(id)
ON DELETE SET NULL
NOT VALID;

-- FK: cash_flow_history.card_id -> cards.id
ALTER TABLE public.cash_flow_history
ADD CONSTRAINT fk_cash_flow_card
FOREIGN KEY (card_id)
REFERENCES public.cards(id)
ON DELETE SET NULL
NOT VALID;

-- FK: cash_flow_history.category_id -> categories.id
ALTER TABLE public.cash_flow_history
ADD CONSTRAINT fk_cash_flow_category
FOREIGN KEY (category_id)
REFERENCES public.categories(id)
ON DELETE SET NULL
NOT VALID;

-- FK: cash_flow_monthly_summary.account_id -> accounts.id (já existe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cash_flow_monthly_summary_account_id_fkey') THEN
    ALTER TABLE public.cash_flow_monthly_summary
    ADD CONSTRAINT fk_cash_flow_monthly_account
    FOREIGN KEY (account_id)
    REFERENCES public.accounts(id)
    ON DELETE SET NULL
    NOT VALID;
  END IF;
END $$;

-- ==========================================
-- GRUPO D: RECURRING & FUTURE EXPENSES/INCOMES
-- ==========================================

-- FK: recurring_expenses.account_id -> accounts.id (já existe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recurring_expenses_account_id_fkey') THEN
    ALTER TABLE public.recurring_expenses
    ADD CONSTRAINT fk_recurring_expenses_account
    FOREIGN KEY (account_id)
    REFERENCES public.accounts(id)
    ON DELETE SET NULL
    NOT VALID;
  END IF;
END $$;

-- FK: recurring_expenses.card_id -> cards.id (já existe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recurring_expenses_card_id_fkey') THEN
    ALTER TABLE public.recurring_expenses
    ADD CONSTRAINT fk_recurring_expenses_card
    FOREIGN KEY (card_id)
    REFERENCES public.cards(id)
    ON DELETE SET NULL
    NOT VALID;
  END IF;
END $$;

-- FK: recurring_expenses.category_id -> categories.id (já existe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recurring_expenses_category_id_fkey') THEN
    ALTER TABLE public.recurring_expenses
    ADD CONSTRAINT fk_recurring_expenses_category
    FOREIGN KEY (category_id)
    REFERENCES public.categories(id)
    ON DELETE SET NULL
    NOT VALID;
  END IF;
END $$;

-- FK: manual_future_expenses.category_id -> categories.id
ALTER TABLE public.manual_future_expenses
ADD CONSTRAINT fk_manual_future_expenses_category
FOREIGN KEY (category_id)
REFERENCES public.categories(id)
ON DELETE SET NULL
NOT VALID;

-- FK: manual_future_expenses.recurring_expense_id -> recurring_expenses.id (já existe como fk_future_expenses_recurring)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_future_expenses_recurring') THEN
    ALTER TABLE public.manual_future_expenses
    ADD CONSTRAINT fk_manual_future_expenses_recurring
    FOREIGN KEY (recurring_expense_id)
    REFERENCES public.recurring_expenses(id)
    ON DELETE SET NULL
    NOT VALID;
  END IF;
END $$;

-- FK: manual_future_incomes.account_id -> accounts.id
ALTER TABLE public.manual_future_incomes
ADD CONSTRAINT fk_manual_future_incomes_account
FOREIGN KEY (account_id)
REFERENCES public.accounts(id)
ON DELETE SET NULL
NOT VALID;

-- FK: manual_future_incomes.category_id -> categories.id
ALTER TABLE public.manual_future_incomes
ADD CONSTRAINT fk_manual_future_incomes_category
FOREIGN KEY (category_id)
REFERENCES public.categories(id)
ON DELETE SET NULL
NOT VALID;

-- ==========================================
-- GRUPO E: OUTROS
-- ==========================================

-- FK: card_payment_history.card_id -> cards.id (já existe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'card_payment_history_card_id_fkey') THEN
    ALTER TABLE public.card_payment_history
    ADD CONSTRAINT fk_card_payment_history_card
    FOREIGN KEY (card_id)
    REFERENCES public.cards(id)
    ON DELETE CASCADE
    NOT VALID;
  END IF;
END $$;

-- FK: card_payment_history.account_id -> accounts.id (já existe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'card_payment_history_account_id_fkey') THEN
    ALTER TABLE public.card_payment_history
    ADD CONSTRAINT fk_card_payment_history_account
    FOREIGN KEY (account_id)
    REFERENCES public.accounts(id)
    ON DELETE SET NULL
    NOT VALID;
  END IF;
END $$;

-- FK: card_mileage_rules.card_id -> cards.id (já existe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'card_mileage_rules_card_id_fkey') THEN
    ALTER TABLE public.card_mileage_rules
    ADD CONSTRAINT fk_card_mileage_rules_card
    FOREIGN KEY (card_id)
    REFERENCES public.cards(id)
    ON DELETE CASCADE
    NOT VALID;
  END IF;
END $$;

-- FK: mileage_history.card_id -> cards.id (já existe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mileage_history_card_id_fkey') THEN
    ALTER TABLE public.mileage_history
    ADD CONSTRAINT fk_mileage_history_card
    FOREIGN KEY (card_id)
    REFERENCES public.cards(id)
    ON DELETE SET NULL
    NOT VALID;
  END IF;
END $$;

-- FK: mileage_history.rule_id -> card_mileage_rules.id (já existe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mileage_history_rule_id_fkey') THEN
    ALTER TABLE public.mileage_history
    ADD CONSTRAINT fk_mileage_history_rule
    FOREIGN KEY (rule_id)
    REFERENCES public.card_mileage_rules(id)
    ON DELETE SET NULL
    NOT VALID;
  END IF;
END $$;

-- FK: mileage_history.transaction_id -> transactions.id (já existe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mileage_history_transaction_id_fkey') THEN
    ALTER TABLE public.mileage_history
    ADD CONSTRAINT fk_mileage_history_transaction
    FOREIGN KEY (transaction_id)
    REFERENCES public.transactions(id)
    ON DELETE SET NULL
    NOT VALID;
  END IF;
END $$;

-- FK: mileage_goals.source_card_id -> cards.id (já existe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mileage_goals_source_card_id_fkey') THEN
    ALTER TABLE public.mileage_goals
    ADD CONSTRAINT fk_mileage_goals_card
    FOREIGN KEY (source_card_id)
    REFERENCES public.cards(id)
    ON DELETE SET NULL
    NOT VALID;
  END IF;
END $$;

-- FK: imported_transactions.imported_file_id -> imported_files.id (já existe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'imported_transactions_imported_file_id_fkey') THEN
    ALTER TABLE public.imported_transactions
    ADD CONSTRAINT fk_imported_transactions_file
    FOREIGN KEY (imported_file_id)
    REFERENCES public.imported_files(id)
    ON DELETE CASCADE
    NOT VALID;
  END IF;
END $$;

-- FK: import_audit_log.imported_file_id -> imported_files.id (já existe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'import_audit_log_imported_file_id_fkey') THEN
    ALTER TABLE public.import_audit_log
    ADD CONSTRAINT fk_import_audit_log_file
    FOREIGN KEY (imported_file_id)
    REFERENCES public.imported_files(id)
    ON DELETE SET NULL
    NOT VALID;
  END IF;
END $$;

-- Registrar conclusão da fase
INSERT INTO public.migration_audit_log (phase, action, status, notes)
VALUES ('2b', 'fk_groups_bcde_complete', 'completed', 'Foreign Keys dos Grupos B, C, D, E criadas com sucesso');