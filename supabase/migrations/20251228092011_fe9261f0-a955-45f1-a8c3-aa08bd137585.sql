-- =====================================================
-- FASE 1: ESTRUTURA DE BANCO DE DADOS PARA FLUXO DE CAIXA
-- =====================================================

-- 1.1 Tabela de Histórico de Fluxo de Caixa
CREATE TABLE public.cash_flow_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  movement_date DATE NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('income', 'expense', 'initial_balance', 'adjustment', 'transfer_in', 'transfer_out')),
  description TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  category_name TEXT, -- Cache do nome da categoria para histórico
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  payment_method TEXT CHECK (payment_method IN ('cash', 'pix', 'transfer', 'credit_card', 'debit_card', 'boleto', 'check', 'other')),
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  account_name TEXT, -- Cache do nome da conta para histórico
  card_id UUID REFERENCES public.cards(id) ON DELETE SET NULL,
  card_name TEXT, -- Cache do nome do cartão para histórico
  balance_before NUMERIC NOT NULL DEFAULT 0,
  balance_after NUMERIC NOT NULL,
  owner_user TEXT DEFAULT 'user1',
  currency currency_type DEFAULT 'BRL',
  is_reconciled BOOLEAN DEFAULT false,
  reconciled_at TIMESTAMPTZ,
  reconciled_by UUID,
  notes TEXT,
  period_year INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM movement_date)) STORED,
  period_month INTEGER GENERATED ALWAYS AS (EXTRACT(MONTH FROM movement_date)) STORED,
  period_quarter INTEGER GENERATED ALWAYS AS (EXTRACT(QUARTER FROM movement_date)) STORED,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_cash_flow_user_date ON public.cash_flow_history(user_id, movement_date DESC);
CREATE INDEX idx_cash_flow_period ON public.cash_flow_history(user_id, period_year, period_month);
CREATE INDEX idx_cash_flow_account ON public.cash_flow_history(account_id, movement_date DESC);
CREATE INDEX idx_cash_flow_category ON public.cash_flow_history(category_id);
CREATE INDEX idx_cash_flow_type ON public.cash_flow_history(movement_type);
CREATE INDEX idx_cash_flow_reconciled ON public.cash_flow_history(is_reconciled) WHERE is_reconciled = false;

-- RLS para cash_flow_history
ALTER TABLE public.cash_flow_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cash flow history"
ON public.cash_flow_history FOR SELECT
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.user_couples 
    WHERE status = 'active' 
    AND ((user1_id = auth.uid() AND user2_id = cash_flow_history.user_id) 
      OR (user2_id = auth.uid() AND user1_id = cash_flow_history.user_id))
  )
);

CREATE POLICY "Users can insert their own cash flow history"
ON public.cash_flow_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cash flow history"
ON public.cash_flow_history FOR UPDATE
USING (auth.uid() = user_id AND is_reconciled = false);

CREATE POLICY "Users can delete their own unreconciled cash flow history"
ON public.cash_flow_history FOR DELETE
USING (auth.uid() = user_id AND is_reconciled = false);

-- 1.2 Tabela de Auditoria de Transações
CREATE TABLE public.transaction_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('created', 'updated', 'deleted', 'reconciled', 'unreconciled')),
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  change_reason TEXT,
  performed_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Índices para auditoria
CREATE INDEX idx_audit_transaction ON public.transaction_audit_log(transaction_id);
CREATE INDEX idx_audit_user ON public.transaction_audit_log(user_id, performed_at DESC);
CREATE INDEX idx_audit_date ON public.transaction_audit_log(performed_at DESC);

-- RLS para transaction_audit_log
ALTER TABLE public.transaction_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs"
ON public.transaction_audit_log FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
ON public.transaction_audit_log FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 1.3 Tabela de Resumo Mensal de Fluxo de Caixa (para performance)
CREATE TABLE public.cash_flow_monthly_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  currency currency_type DEFAULT 'BRL',
  initial_balance NUMERIC NOT NULL DEFAULT 0,
  total_income NUMERIC NOT NULL DEFAULT 0,
  total_expense NUMERIC NOT NULL DEFAULT 0,
  net_result NUMERIC GENERATED ALWAYS AS (total_income - total_expense) STORED,
  final_balance NUMERIC NOT NULL DEFAULT 0,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  owner_user TEXT DEFAULT 'user1',
  is_closed BOOLEAN DEFAULT false, -- Se o período foi fechado/conciliado
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, account_id, year, month)
);

-- Índices
CREATE INDEX idx_monthly_summary_user ON public.cash_flow_monthly_summary(user_id, year DESC, month DESC);
CREATE INDEX idx_monthly_summary_account ON public.cash_flow_monthly_summary(account_id, year, month);

-- RLS para cash_flow_monthly_summary
ALTER TABLE public.cash_flow_monthly_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own monthly summary"
ON public.cash_flow_monthly_summary FOR SELECT
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.user_couples 
    WHERE status = 'active' 
    AND ((user1_id = auth.uid() AND user2_id = cash_flow_monthly_summary.user_id) 
      OR (user2_id = auth.uid() AND user1_id = cash_flow_monthly_summary.user_id))
  )
);

CREATE POLICY "Users can insert their own monthly summary"
ON public.cash_flow_monthly_summary FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monthly summary"
ON public.cash_flow_monthly_summary FOR UPDATE
USING (auth.uid() = user_id);

-- =====================================================
-- FASE 2: FUNÇÕES PARA FLUXO DE CAIXA
-- =====================================================

-- 2.1 Função para calcular saldo inicial de um período
CREATE OR REPLACE FUNCTION public.get_period_initial_balance(
  p_user_id UUID,
  p_start_date DATE,
  p_account_id UUID DEFAULT NULL,
  p_view_mode TEXT DEFAULT 'both'
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_initial_balance NUMERIC := 0;
  v_couple_user_id UUID;
BEGIN
  -- Obter usuário do casal se view_mode for 'both'
  IF p_view_mode = 'both' THEN
    SELECT CASE 
      WHEN user1_id = p_user_id THEN user2_id 
      ELSE user1_id 
    END INTO v_couple_user_id
    FROM public.user_couples 
    WHERE status = 'active' 
    AND (user1_id = p_user_id OR user2_id = p_user_id);
  END IF;

  -- Calcular saldo inicial baseado no último saldo antes da data inicial
  SELECT COALESCE(balance_after, 0) INTO v_initial_balance
  FROM public.cash_flow_history
  WHERE movement_date < p_start_date
    AND (
      user_id = p_user_id 
      OR (v_couple_user_id IS NOT NULL AND user_id = v_couple_user_id)
    )
    AND (p_account_id IS NULL OR account_id = p_account_id)
  ORDER BY movement_date DESC, created_at DESC
  LIMIT 1;

  -- Se não há histórico, calcular baseado nas contas
  IF v_initial_balance IS NULL THEN
    SELECT COALESCE(SUM(balance), 0) INTO v_initial_balance
    FROM public.accounts
    WHERE (
      user_id = p_user_id 
      OR (v_couple_user_id IS NOT NULL AND user_id = v_couple_user_id)
    )
    AND (p_account_id IS NULL OR id = p_account_id)
    AND is_active = true;
  END IF;

  RETURN COALESCE(v_initial_balance, 0);
END;
$$;

-- 2.2 Função para gerar relatório detalhado de fluxo de caixa
CREATE OR REPLACE FUNCTION public.generate_cash_flow_report(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_view_mode TEXT DEFAULT 'both',
  p_account_id UUID DEFAULT NULL,
  p_category_id UUID DEFAULT NULL,
  p_movement_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  movement_date DATE,
  description TEXT,
  movement_type TEXT,
  category_name TEXT,
  amount NUMERIC,
  payment_method TEXT,
  account_name TEXT,
  card_name TEXT,
  balance_after NUMERIC,
  owner_user TEXT,
  is_reconciled BOOLEAN,
  transaction_id UUID
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_couple_user_id UUID;
BEGIN
  -- Obter usuário do casal se view_mode for 'both'
  IF p_view_mode = 'both' THEN
    SELECT CASE 
      WHEN user1_id = p_user_id THEN user2_id 
      ELSE user1_id 
    END INTO v_couple_user_id
    FROM public.user_couples 
    WHERE status = 'active' 
    AND (user1_id = p_user_id OR user2_id = p_user_id);
  END IF;

  RETURN QUERY
  SELECT 
    cfh.id,
    cfh.movement_date,
    cfh.description,
    cfh.movement_type,
    COALESCE(cfh.category_name, c.name, 'Sem categoria') as category_name,
    cfh.amount,
    cfh.payment_method,
    COALESCE(cfh.account_name, a.name, 'N/A') as account_name,
    cfh.card_name,
    cfh.balance_after,
    cfh.owner_user,
    cfh.is_reconciled,
    cfh.transaction_id
  FROM public.cash_flow_history cfh
  LEFT JOIN public.categories c ON c.id = cfh.category_id
  LEFT JOIN public.accounts a ON a.id = cfh.account_id
  WHERE cfh.movement_date BETWEEN p_start_date AND p_end_date
    AND (
      cfh.user_id = p_user_id 
      OR (v_couple_user_id IS NOT NULL AND cfh.user_id = v_couple_user_id)
    )
    AND (p_account_id IS NULL OR cfh.account_id = p_account_id)
    AND (p_category_id IS NULL OR cfh.category_id = p_category_id)
    AND (p_movement_type IS NULL OR cfh.movement_type = p_movement_type)
    AND (
      p_view_mode = 'both' 
      OR (p_view_mode = 'user1' AND cfh.owner_user = 'user1')
      OR (p_view_mode = 'user2' AND cfh.owner_user = 'user2')
    )
  ORDER BY cfh.movement_date ASC, cfh.created_at ASC;
END;
$$;

-- 2.3 Função para obter resumo do período
CREATE OR REPLACE FUNCTION public.get_cash_flow_summary(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_view_mode TEXT DEFAULT 'both',
  p_account_id UUID DEFAULT NULL
)
RETURNS TABLE (
  initial_balance NUMERIC,
  total_income NUMERIC,
  total_expense NUMERIC,
  net_result NUMERIC,
  final_balance NUMERIC,
  transaction_count BIGINT,
  income_count BIGINT,
  expense_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_couple_user_id UUID;
  v_initial_balance NUMERIC;
BEGIN
  -- Obter usuário do casal
  IF p_view_mode = 'both' THEN
    SELECT CASE 
      WHEN user1_id = p_user_id THEN user2_id 
      ELSE user1_id 
    END INTO v_couple_user_id
    FROM public.user_couples 
    WHERE status = 'active' 
    AND (user1_id = p_user_id OR user2_id = p_user_id);
  END IF;

  -- Calcular saldo inicial
  v_initial_balance := public.get_period_initial_balance(p_user_id, p_start_date, p_account_id, p_view_mode);

  RETURN QUERY
  SELECT 
    v_initial_balance as initial_balance,
    COALESCE(SUM(CASE WHEN cfh.movement_type IN ('income', 'transfer_in', 'initial_balance') THEN cfh.amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN cfh.movement_type IN ('expense', 'transfer_out') THEN cfh.amount ELSE 0 END), 0) as total_expense,
    COALESCE(SUM(CASE WHEN cfh.movement_type IN ('income', 'transfer_in', 'initial_balance') THEN cfh.amount ELSE -cfh.amount END), 0) as net_result,
    v_initial_balance + COALESCE(SUM(CASE WHEN cfh.movement_type IN ('income', 'transfer_in', 'initial_balance') THEN cfh.amount ELSE -cfh.amount END), 0) as final_balance,
    COUNT(*) as transaction_count,
    COUNT(*) FILTER (WHERE cfh.movement_type IN ('income', 'transfer_in')) as income_count,
    COUNT(*) FILTER (WHERE cfh.movement_type IN ('expense', 'transfer_out')) as expense_count
  FROM public.cash_flow_history cfh
  WHERE cfh.movement_date BETWEEN p_start_date AND p_end_date
    AND (
      cfh.user_id = p_user_id 
      OR (v_couple_user_id IS NOT NULL AND cfh.user_id = v_couple_user_id)
    )
    AND (p_account_id IS NULL OR cfh.account_id = p_account_id)
    AND (
      p_view_mode = 'both' 
      OR (p_view_mode = 'user1' AND cfh.owner_user = 'user1')
      OR (p_view_mode = 'user2' AND cfh.owner_user = 'user2')
    );
END;
$$;

-- 2.4 Trigger para registrar movimentações no histórico de fluxo de caixa
CREATE OR REPLACE FUNCTION public.sync_transaction_to_cash_flow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_balance_before NUMERIC := 0;
  v_balance_after NUMERIC := 0;
  v_category_name TEXT;
  v_account_name TEXT;
  v_card_name TEXT;
  v_movement_type TEXT;
BEGIN
  -- Só processar transações completadas
  IF NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;

  -- Se é um update e o status anterior não era completed, processar
  IF TG_OP = 'UPDATE' AND OLD.status = 'completed' THEN
    -- Já estava no fluxo de caixa, atualizar
    UPDATE public.cash_flow_history
    SET 
      movement_date = NEW.transaction_date,
      description = NEW.description,
      amount = NEW.amount,
      category_id = NEW.category_id,
      account_id = NEW.account_id,
      card_id = NEW.card_id,
      payment_method = NEW.payment_method,
      owner_user = NEW.owner_user,
      updated_at = now()
    WHERE transaction_id = NEW.id;
    
    RETURN NEW;
  END IF;

  -- Obter nomes para cache
  SELECT name INTO v_category_name FROM public.categories WHERE id = NEW.category_id;
  SELECT name INTO v_account_name FROM public.accounts WHERE id = NEW.account_id;
  SELECT name INTO v_card_name FROM public.cards WHERE id = NEW.card_id;

  -- Determinar tipo de movimento
  v_movement_type := CASE 
    WHEN NEW.type = 'income' THEN 'income'
    WHEN NEW.type = 'expense' THEN 'expense'
    ELSE NEW.type
  END;

  -- Calcular saldo anterior
  SELECT COALESCE(balance_after, 0) INTO v_balance_before
  FROM public.cash_flow_history
  WHERE user_id = NEW.user_id
    AND (NEW.account_id IS NULL OR account_id = NEW.account_id)
    AND (movement_date < NEW.transaction_date OR (movement_date = NEW.transaction_date AND created_at < now()))
  ORDER BY movement_date DESC, created_at DESC
  LIMIT 1;

  IF v_balance_before IS NULL THEN
    SELECT COALESCE(balance, 0) INTO v_balance_before
    FROM public.accounts WHERE id = NEW.account_id;
  END IF;

  -- Calcular saldo após
  v_balance_after := v_balance_before + CASE 
    WHEN v_movement_type IN ('income', 'transfer_in', 'initial_balance') THEN NEW.amount
    ELSE -NEW.amount
  END;

  -- Inserir no histórico de fluxo de caixa
  INSERT INTO public.cash_flow_history (
    user_id,
    transaction_id,
    movement_date,
    movement_type,
    description,
    category_id,
    category_name,
    amount,
    payment_method,
    account_id,
    account_name,
    card_id,
    card_name,
    balance_before,
    balance_after,
    owner_user,
    currency
  ) VALUES (
    NEW.user_id,
    NEW.id,
    NEW.transaction_date,
    v_movement_type,
    NEW.description,
    NEW.category_id,
    v_category_name,
    NEW.amount,
    NEW.payment_method,
    NEW.account_id,
    v_account_name,
    NEW.card_id,
    v_card_name,
    COALESCE(v_balance_before, 0),
    v_balance_after,
    COALESCE(NEW.owner_user, 'user1'),
    COALESCE(NEW.currency, 'BRL')
  );

  RETURN NEW;
END;
$$;

-- Criar trigger para sincronizar transações com fluxo de caixa
DROP TRIGGER IF EXISTS trigger_sync_transaction_to_cash_flow ON public.transactions;
CREATE TRIGGER trigger_sync_transaction_to_cash_flow
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_transaction_to_cash_flow();

-- 2.5 Trigger para auditoria de transações
CREATE OR REPLACE FUNCTION public.audit_transaction_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_changed_fields TEXT[] := ARRAY[]::TEXT[];
  v_old_values JSONB;
  v_new_values JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.transaction_audit_log (
      transaction_id, user_id, action_type, new_values
    ) VALUES (
      NEW.id, NEW.user_id, 'created', to_jsonb(NEW)
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Detectar campos alterados
    IF OLD.amount IS DISTINCT FROM NEW.amount THEN v_changed_fields := array_append(v_changed_fields, 'amount'); END IF;
    IF OLD.description IS DISTINCT FROM NEW.description THEN v_changed_fields := array_append(v_changed_fields, 'description'); END IF;
    IF OLD.category_id IS DISTINCT FROM NEW.category_id THEN v_changed_fields := array_append(v_changed_fields, 'category_id'); END IF;
    IF OLD.transaction_date IS DISTINCT FROM NEW.transaction_date THEN v_changed_fields := array_append(v_changed_fields, 'transaction_date'); END IF;
    IF OLD.status IS DISTINCT FROM NEW.status THEN v_changed_fields := array_append(v_changed_fields, 'status'); END IF;
    IF OLD.payment_method IS DISTINCT FROM NEW.payment_method THEN v_changed_fields := array_append(v_changed_fields, 'payment_method'); END IF;
    IF OLD.account_id IS DISTINCT FROM NEW.account_id THEN v_changed_fields := array_append(v_changed_fields, 'account_id'); END IF;
    IF OLD.card_id IS DISTINCT FROM NEW.card_id THEN v_changed_fields := array_append(v_changed_fields, 'card_id'); END IF;

    IF array_length(v_changed_fields, 1) > 0 THEN
      INSERT INTO public.transaction_audit_log (
        transaction_id, user_id, action_type, old_values, new_values, changed_fields
      ) VALUES (
        NEW.id, NEW.user_id, 'updated', to_jsonb(OLD), to_jsonb(NEW), v_changed_fields
      );
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.transaction_audit_log (
      transaction_id, user_id, action_type, old_values
    ) VALUES (
      OLD.id, OLD.user_id, 'deleted', to_jsonb(OLD)
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Criar trigger de auditoria
DROP TRIGGER IF EXISTS trigger_audit_transactions ON public.transactions;
CREATE TRIGGER trigger_audit_transactions
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_transaction_changes();

-- 2.6 Função para popular histórico inicial baseado em transações existentes
CREATE OR REPLACE FUNCTION public.populate_initial_cash_flow_history(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_count INTEGER := 0;
  v_balance NUMERIC := 0;
  v_transaction RECORD;
BEGIN
  -- Limpar histórico existente do usuário
  DELETE FROM public.cash_flow_history WHERE user_id = p_user_id;

  -- Obter saldo inicial das contas
  SELECT COALESCE(SUM(balance), 0) INTO v_balance
  FROM public.accounts WHERE user_id = p_user_id AND is_active = true;

  -- Inserir saldo inicial se houver
  IF v_balance != 0 THEN
    INSERT INTO public.cash_flow_history (
      user_id, movement_date, movement_type, description, amount,
      balance_before, balance_after, owner_user
    ) VALUES (
      p_user_id, CURRENT_DATE, 'initial_balance', 'Saldo inicial importado', ABS(v_balance),
      0, v_balance, 'user1'
    );
  END IF;

  -- Processar transações completadas ordenadas por data
  FOR v_transaction IN
    SELECT t.*, c.name as category_name, a.name as account_name, ca.name as card_name
    FROM public.transactions t
    LEFT JOIN public.categories c ON c.id = t.category_id
    LEFT JOIN public.accounts a ON a.id = t.account_id
    LEFT JOIN public.cards ca ON ca.id = t.card_id
    WHERE t.user_id = p_user_id AND t.status = 'completed'
    ORDER BY t.transaction_date ASC, t.created_at ASC
  LOOP
    v_balance := v_balance + CASE 
      WHEN v_transaction.type = 'income' THEN v_transaction.amount
      ELSE -v_transaction.amount
    END;

    INSERT INTO public.cash_flow_history (
      user_id, transaction_id, movement_date, movement_type, description,
      category_id, category_name, amount, payment_method,
      account_id, account_name, card_id, card_name,
      balance_before, balance_after, owner_user, currency
    ) VALUES (
      p_user_id, v_transaction.id, v_transaction.transaction_date,
      CASE WHEN v_transaction.type = 'income' THEN 'income' ELSE 'expense' END,
      v_transaction.description, v_transaction.category_id, v_transaction.category_name,
      v_transaction.amount, v_transaction.payment_method,
      v_transaction.account_id, v_transaction.account_name,
      v_transaction.card_id, v_transaction.card_name,
      v_balance - CASE WHEN v_transaction.type = 'income' THEN v_transaction.amount ELSE -v_transaction.amount END,
      v_balance,
      COALESCE(v_transaction.owner_user, 'user1'),
      COALESCE(v_transaction.currency, 'BRL')
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- 2.7 Função para obter despesas consolidadas por categoria
CREATE OR REPLACE FUNCTION public.get_consolidated_expenses(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_view_mode TEXT DEFAULT 'both'
)
RETURNS TABLE (
  category_id UUID,
  category_name TEXT,
  category_color TEXT,
  category_icon TEXT,
  total_amount NUMERIC,
  transaction_count BIGINT,
  percentage NUMERIC,
  avg_amount NUMERIC,
  min_amount NUMERIC,
  max_amount NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_couple_user_id UUID;
  v_total_expenses NUMERIC;
BEGIN
  -- Obter usuário do casal
  IF p_view_mode = 'both' THEN
    SELECT CASE 
      WHEN user1_id = p_user_id THEN user2_id 
      ELSE user1_id 
    END INTO v_couple_user_id
    FROM public.user_couples 
    WHERE status = 'active' 
    AND (user1_id = p_user_id OR user2_id = p_user_id);
  END IF;

  -- Calcular total de despesas para percentuais
  SELECT COALESCE(SUM(amount), 0) INTO v_total_expenses
  FROM public.cash_flow_history
  WHERE movement_date BETWEEN p_start_date AND p_end_date
    AND movement_type IN ('expense', 'transfer_out')
    AND (
      user_id = p_user_id 
      OR (v_couple_user_id IS NOT NULL AND user_id = v_couple_user_id)
    )
    AND (
      p_view_mode = 'both' 
      OR (p_view_mode = 'user1' AND owner_user = 'user1')
      OR (p_view_mode = 'user2' AND owner_user = 'user2')
    );

  RETURN QUERY
  SELECT 
    cfh.category_id,
    COALESCE(c.name, cfh.category_name, 'Sem categoria') as category_name,
    COALESCE(c.color, '#6366f1') as category_color,
    c.icon as category_icon,
    SUM(cfh.amount) as total_amount,
    COUNT(*) as transaction_count,
    CASE WHEN v_total_expenses > 0 THEN ROUND((SUM(cfh.amount) / v_total_expenses) * 100, 2) ELSE 0 END as percentage,
    ROUND(AVG(cfh.amount), 2) as avg_amount,
    MIN(cfh.amount) as min_amount,
    MAX(cfh.amount) as max_amount
  FROM public.cash_flow_history cfh
  LEFT JOIN public.categories c ON c.id = cfh.category_id
  WHERE cfh.movement_date BETWEEN p_start_date AND p_end_date
    AND cfh.movement_type IN ('expense', 'transfer_out')
    AND (
      cfh.user_id = p_user_id 
      OR (v_couple_user_id IS NOT NULL AND cfh.user_id = v_couple_user_id)
    )
    AND (
      p_view_mode = 'both' 
      OR (p_view_mode = 'user1' AND cfh.owner_user = 'user1')
      OR (p_view_mode = 'user2' AND cfh.owner_user = 'user2')
    )
  GROUP BY cfh.category_id, c.name, cfh.category_name, c.color, c.icon
  ORDER BY total_amount DESC;
END;
$$;

-- 2.8 Função para obter receitas consolidadas por categoria
CREATE OR REPLACE FUNCTION public.get_consolidated_revenues(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_view_mode TEXT DEFAULT 'both'
)
RETURNS TABLE (
  category_id UUID,
  category_name TEXT,
  category_color TEXT,
  category_icon TEXT,
  total_amount NUMERIC,
  transaction_count BIGINT,
  percentage NUMERIC,
  avg_amount NUMERIC,
  min_amount NUMERIC,
  max_amount NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_couple_user_id UUID;
  v_total_income NUMERIC;
BEGIN
  -- Obter usuário do casal
  IF p_view_mode = 'both' THEN
    SELECT CASE 
      WHEN user1_id = p_user_id THEN user2_id 
      ELSE user1_id 
    END INTO v_couple_user_id
    FROM public.user_couples 
    WHERE status = 'active' 
    AND (user1_id = p_user_id OR user2_id = p_user_id);
  END IF;

  -- Calcular total de receitas para percentuais
  SELECT COALESCE(SUM(amount), 0) INTO v_total_income
  FROM public.cash_flow_history
  WHERE movement_date BETWEEN p_start_date AND p_end_date
    AND movement_type IN ('income', 'transfer_in')
    AND (
      user_id = p_user_id 
      OR (v_couple_user_id IS NOT NULL AND user_id = v_couple_user_id)
    )
    AND (
      p_view_mode = 'both' 
      OR (p_view_mode = 'user1' AND owner_user = 'user1')
      OR (p_view_mode = 'user2' AND owner_user = 'user2')
    );

  RETURN QUERY
  SELECT 
    cfh.category_id,
    COALESCE(c.name, cfh.category_name, 'Sem categoria') as category_name,
    COALESCE(c.color, '#22c55e') as category_color,
    c.icon as category_icon,
    SUM(cfh.amount) as total_amount,
    COUNT(*) as transaction_count,
    CASE WHEN v_total_income > 0 THEN ROUND((SUM(cfh.amount) / v_total_income) * 100, 2) ELSE 0 END as percentage,
    ROUND(AVG(cfh.amount), 2) as avg_amount,
    MIN(cfh.amount) as min_amount,
    MAX(cfh.amount) as max_amount
  FROM public.cash_flow_history cfh
  LEFT JOIN public.categories c ON c.id = cfh.category_id
  WHERE cfh.movement_date BETWEEN p_start_date AND p_end_date
    AND cfh.movement_type IN ('income', 'transfer_in')
    AND (
      cfh.user_id = p_user_id 
      OR (v_couple_user_id IS NOT NULL AND cfh.user_id = v_couple_user_id)
    )
    AND (
      p_view_mode = 'both' 
      OR (p_view_mode = 'user1' AND cfh.owner_user = 'user1')
      OR (p_view_mode = 'user2' AND cfh.owner_user = 'user2')
    )
  GROUP BY cfh.category_id, c.name, cfh.category_name, c.color, c.icon
  ORDER BY total_amount DESC;
END;
$$;