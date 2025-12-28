-- =====================================================
-- MIGRATION 6: Corrigir VIEWs para incluir business_at
-- =====================================================

-- Recriar VIEW active_transactions (com colunas corretas)
DROP VIEW IF EXISTS public.active_transactions;
CREATE VIEW public.active_transactions AS
SELECT 
  id, user_id, type, amount, description, transaction_date, purchase_date,
  category_id, account_id, card_id, payment_method, owner_user,
  is_installment, installment_number, total_installments,
  status, due_date, currency, subcategory, expense_source_type, 
  card_transaction_type, tag_id, created_at, updated_at, business_at
FROM public.transactions
WHERE deleted_at IS NULL;

-- Recriar VIEW active_accounts
DROP VIEW IF EXISTS public.active_accounts;
CREATE VIEW public.active_accounts AS
SELECT 
  id, user_id, name, account_type, balance, currency, overdraft_limit,
  is_active, is_cash_account, account_model, owner_user, created_at, updated_at
FROM public.accounts
WHERE deleted_at IS NULL AND is_active = true;

-- Recriar VIEW active_cards
DROP VIEW IF EXISTS public.active_cards;
CREATE VIEW public.active_cards AS
SELECT 
  id, user_id, name, card_type, credit_limit, current_balance, initial_balance,
  initial_balance_original, closing_date, due_date, currency, account_id,
  last_four_digits, allows_partial_payment, minimum_payment_amount, owner_user,
  created_at, updated_at
FROM public.cards
WHERE deleted_at IS NULL;

-- Recriar VIEW active_categories
DROP VIEW IF EXISTS public.active_categories;
CREATE VIEW public.active_categories AS
SELECT 
  id, user_id, name, category_type, color, icon, description, owner_user,
  default_category_id, created_at, updated_at
FROM public.categories
WHERE deleted_at IS NULL;

-- Recriar VIEW active_investments
DROP VIEW IF EXISTS public.active_investments;
CREATE VIEW public.active_investments AS
SELECT 
  id, user_id, name, type, amount, current_value, purchase_date, broker,
  notes, currency, owner_user, goal_id, is_shared, yield_type, yield_value,
  auto_calculate_yield, last_yield_date, created_at, updated_at
FROM public.investments
WHERE deleted_at IS NULL;

-- =====================================================
-- MIGRATION 7: Verificar e ativar triggers críticos
-- =====================================================

-- Trigger: update_card_balance
DROP TRIGGER IF EXISTS update_card_balance_trigger ON public.transactions;
CREATE TRIGGER update_card_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_card_balance();

-- Trigger: sync_transaction_to_cash_flow
DROP TRIGGER IF EXISTS sync_transaction_to_cash_flow_trigger ON public.transactions;
CREATE TRIGGER sync_transaction_to_cash_flow_trigger
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_transaction_to_cash_flow();

-- Trigger: audit_transaction_changes
DROP TRIGGER IF EXISTS audit_transaction_changes_trigger ON public.transactions;
CREATE TRIGGER audit_transaction_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_transaction_changes();

-- =====================================================
-- MIGRATION 8: Hardening - Índices e Constraints
-- =====================================================

-- Índices para transactions
CREATE INDEX IF NOT EXISTS idx_transactions_business_at ON public.transactions(business_at);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_transactions_card_id ON public.transactions(card_id) WHERE card_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id) WHERE account_id IS NOT NULL;

-- Índices para cash_flow_history
CREATE INDEX IF NOT EXISTS idx_cash_flow_business_at ON public.cash_flow_history(business_at);
CREATE INDEX IF NOT EXISTS idx_cash_flow_user_date ON public.cash_flow_history(user_id, movement_date);
CREATE INDEX IF NOT EXISTS idx_cash_flow_owner_user ON public.cash_flow_history(owner_user);

-- Índices para accounts
CREATE INDEX IF NOT EXISTS idx_accounts_user_active ON public.accounts(user_id) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_accounts_owner_user ON public.accounts(owner_user);

-- Índices para cards
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cards_owner_user ON public.cards(owner_user);

-- Índices para categories
CREATE INDEX IF NOT EXISTS idx_categories_user_type ON public.categories(user_id, category_type) WHERE deleted_at IS NULL;

-- Índices para recurring_expenses
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_active ON public.recurring_expenses(user_id) 
  WHERE is_active = true AND is_completed = false AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_next_due ON public.recurring_expenses(next_due_date) 
  WHERE is_active = true AND is_completed = false;

-- Índices para manual_future_expenses
CREATE INDEX IF NOT EXISTS idx_future_expenses_unpaid ON public.manual_future_expenses(user_id, due_date) 
  WHERE is_paid = false AND deleted_at IS NULL;

-- Índices para manual_future_incomes
CREATE INDEX IF NOT EXISTS idx_future_incomes_pending ON public.manual_future_incomes(user_id, due_date) 
  WHERE is_received = false AND deleted_at IS NULL;

-- Índices para user_couples
CREATE INDEX IF NOT EXISTS idx_user_couples_user1 ON public.user_couples(user1_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_user_couples_user2 ON public.user_couples(user2_id) WHERE status = 'active';

-- Comentários
COMMENT ON VIEW public.active_transactions IS 'View of non-deleted transactions with business_at support';
COMMENT ON VIEW public.active_accounts IS 'View of active, non-deleted accounts';
COMMENT ON VIEW public.active_cards IS 'View of non-deleted cards';
COMMENT ON VIEW public.active_categories IS 'View of non-deleted categories';
COMMENT ON VIEW public.active_investments IS 'View of non-deleted investments';