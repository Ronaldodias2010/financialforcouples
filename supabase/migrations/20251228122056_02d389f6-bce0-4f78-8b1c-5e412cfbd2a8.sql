
-- =====================================================
-- FASE 1: FOREIGN KEYS - INTEGRIDADE REFERENCIAL
-- (Algumas já foram criadas, usar IF NOT EXISTS pattern)
-- =====================================================

-- transactions -> accounts (pode já existir do migration anterior parcial)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_transactions_account') THEN
    ALTER TABLE public.transactions 
    ADD CONSTRAINT fk_transactions_account 
    FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- transactions -> cards  
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_transactions_card') THEN
    ALTER TABLE public.transactions 
    ADD CONSTRAINT fk_transactions_card 
    FOREIGN KEY (card_id) REFERENCES public.cards(id) ON DELETE SET NULL;
  END IF;
END $$;

-- transactions -> categories
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_transactions_category') THEN
    ALTER TABLE public.transactions 
    ADD CONSTRAINT fk_transactions_category 
    FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- cards -> accounts
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_cards_account') THEN
    ALTER TABLE public.cards 
    ADD CONSTRAINT fk_cards_account 
    FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- investments -> investment_goals
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_investments_goal') THEN
    ALTER TABLE public.investments 
    ADD CONSTRAINT fk_investments_goal 
    FOREIGN KEY (goal_id) REFERENCES public.investment_goals(id) ON DELETE SET NULL;
  END IF;
END $$;

-- manual_future_expenses -> categories
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_future_expenses_category') THEN
    ALTER TABLE public.manual_future_expenses 
    ADD CONSTRAINT fk_future_expenses_category 
    FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- manual_future_expenses -> transactions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_future_expenses_transaction') THEN
    ALTER TABLE public.manual_future_expenses 
    ADD CONSTRAINT fk_future_expenses_transaction 
    FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- manual_future_expenses -> recurring_expenses
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_future_expenses_recurring') THEN
    ALTER TABLE public.manual_future_expenses 
    ADD CONSTRAINT fk_future_expenses_recurring 
    FOREIGN KEY (recurring_expense_id) REFERENCES public.recurring_expenses(id) ON DELETE SET NULL;
  END IF;
END $$;

-- manual_future_incomes -> categories
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_future_incomes_category') THEN
    ALTER TABLE public.manual_future_incomes 
    ADD CONSTRAINT fk_future_incomes_category 
    FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- manual_future_incomes -> accounts
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_future_incomes_account') THEN
    ALTER TABLE public.manual_future_incomes 
    ADD CONSTRAINT fk_future_incomes_account 
    FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- manual_future_incomes -> transactions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_future_incomes_transaction') THEN
    ALTER TABLE public.manual_future_incomes 
    ADD CONSTRAINT fk_future_incomes_transaction 
    FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- recurring_expenses -> categories
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_recurring_expenses_category') THEN
    ALTER TABLE public.recurring_expenses 
    ADD CONSTRAINT fk_recurring_expenses_category 
    FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- recurring_expenses -> accounts
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_recurring_expenses_account') THEN
    ALTER TABLE public.recurring_expenses 
    ADD CONSTRAINT fk_recurring_expenses_account 
    FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- recurring_expenses -> cards
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_recurring_expenses_card') THEN
    ALTER TABLE public.recurring_expenses 
    ADD CONSTRAINT fk_recurring_expenses_card 
    FOREIGN KEY (card_id) REFERENCES public.cards(id) ON DELETE SET NULL;
  END IF;
END $$;

-- cash_flow_history -> transactions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_cashflow_transaction') THEN
    ALTER TABLE public.cash_flow_history 
    ADD CONSTRAINT fk_cashflow_transaction 
    FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- cash_flow_history -> categories
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_cashflow_category') THEN
    ALTER TABLE public.cash_flow_history 
    ADD CONSTRAINT fk_cashflow_category 
    FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- cash_flow_history -> accounts
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_cashflow_account') THEN
    ALTER TABLE public.cash_flow_history 
    ADD CONSTRAINT fk_cashflow_account 
    FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- cash_flow_history -> cards
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_cashflow_card') THEN
    ALTER TABLE public.cash_flow_history 
    ADD CONSTRAINT fk_cashflow_card 
    FOREIGN KEY (card_id) REFERENCES public.cards(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =====================================================
-- FASE 2: SOFT DELETE - RECUPERAÇÃO DE DADOS
-- =====================================================

-- Adicionar deleted_at às tabelas críticas
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.investment_goals ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.manual_future_expenses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.manual_future_incomes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.recurring_expenses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Criar índices parciais para performance
CREATE INDEX IF NOT EXISTS idx_transactions_not_deleted ON public.transactions(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_accounts_not_deleted ON public.accounts(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cards_not_deleted ON public.cards(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_categories_not_deleted ON public.categories(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_investments_not_deleted ON public.investments(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_investment_goals_not_deleted ON public.investment_goals(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_manual_future_expenses_not_deleted ON public.manual_future_expenses(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_manual_future_incomes_not_deleted ON public.manual_future_incomes(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_not_deleted ON public.recurring_expenses(id) WHERE deleted_at IS NULL;

-- =====================================================
-- FASE 3: SISTEMA DE AUDITORIA MELHORADO
-- =====================================================

-- Adicionar colunas extras na tabela de auditoria (ip_address já existe, verificar outras)
ALTER TABLE public.transaction_audit_log ADD COLUMN IF NOT EXISTS source_application TEXT DEFAULT 'web';
ALTER TABLE public.transaction_audit_log ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Habilitar trigger de auditoria para SEMPRE disparar
ALTER TABLE public.transactions ENABLE ALWAYS TRIGGER trigger_audit_transactions;

-- Criar função helper para soft delete
CREATE OR REPLACE FUNCTION public.soft_delete_record()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.deleted_at = now();
  RETURN NEW;
END;
$$;

-- Criar view para transações ativas (não deletadas)
CREATE OR REPLACE VIEW public.active_transactions AS
SELECT * FROM public.transactions WHERE deleted_at IS NULL;

-- Criar view para contas ativas
CREATE OR REPLACE VIEW public.active_accounts AS
SELECT * FROM public.accounts WHERE deleted_at IS NULL;

-- Criar view para cartões ativos
CREATE OR REPLACE VIEW public.active_cards AS
SELECT * FROM public.cards WHERE deleted_at IS NULL;

-- Criar view para categorias ativas
CREATE OR REPLACE VIEW public.active_categories AS
SELECT * FROM public.categories WHERE deleted_at IS NULL;

-- Criar view para investimentos ativos
CREATE OR REPLACE VIEW public.active_investments AS
SELECT * FROM public.investments WHERE deleted_at IS NULL;

-- Criar índice para auditoria por data e usuário (usando performed_at)
CREATE INDEX IF NOT EXISTS idx_audit_log_user_date ON public.transaction_audit_log(user_id, performed_at DESC);

-- Comentários de documentação
COMMENT ON COLUMN public.transactions.deleted_at IS 'Timestamp de soft delete - NULL significa registro ativo';
COMMENT ON COLUMN public.accounts.deleted_at IS 'Timestamp de soft delete - NULL significa registro ativo';
COMMENT ON COLUMN public.cards.deleted_at IS 'Timestamp de soft delete - NULL significa registro ativo';
COMMENT ON COLUMN public.categories.deleted_at IS 'Timestamp de soft delete - NULL significa registro ativo';
COMMENT ON COLUMN public.investments.deleted_at IS 'Timestamp de soft delete - NULL significa registro ativo';
COMMENT ON COLUMN public.investment_goals.deleted_at IS 'Timestamp de soft delete - NULL significa registro ativo';
COMMENT ON COLUMN public.manual_future_expenses.deleted_at IS 'Timestamp de soft delete - NULL significa registro ativo';
COMMENT ON COLUMN public.manual_future_incomes.deleted_at IS 'Timestamp de soft delete - NULL significa registro ativo';
COMMENT ON COLUMN public.recurring_expenses.deleted_at IS 'Timestamp de soft delete - NULL significa registro ativo';
