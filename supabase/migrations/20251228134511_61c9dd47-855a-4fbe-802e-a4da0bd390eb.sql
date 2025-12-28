-- =====================================================
-- INTEGRAÇÃO WHATSAPP + N8N - COMPLETO
-- =====================================================

-- Criar função set_updated_at se não existir
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Tabela incoming_financial_inputs
CREATE TABLE IF NOT EXISTS public.incoming_financial_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  raw_message TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'whatsapp',
  whatsapp_message_id TEXT,
  amount NUMERIC,
  currency currency_type DEFAULT 'BRL',
  transaction_type TEXT CHECK (transaction_type IN ('expense', 'income')),
  category_hint TEXT,
  account_hint TEXT,
  card_hint TEXT,
  description_hint TEXT,
  transaction_date DATE DEFAULT CURRENT_DATE,
  resolved_category_id UUID,
  resolved_account_id UUID,
  resolved_card_id UUID,
  confidence_score NUMERIC DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'processed', 'error')),
  error_message TEXT,
  transaction_id UUID,
  processed_at TIMESTAMPTZ,
  owner_user TEXT DEFAULT 'user1',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_incoming_inputs_user_status ON incoming_financial_inputs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_incoming_inputs_created ON incoming_financial_inputs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incoming_inputs_whatsapp_id ON incoming_financial_inputs(whatsapp_message_id) WHERE whatsapp_message_id IS NOT NULL;

-- RLS
ALTER TABLE public.incoming_financial_inputs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own inputs" ON public.incoming_financial_inputs;
DROP POLICY IF EXISTS "Service role can insert inputs" ON public.incoming_financial_inputs;
DROP POLICY IF EXISTS "Service role can update inputs" ON public.incoming_financial_inputs;

CREATE POLICY "Users can view their own inputs"
  ON public.incoming_financial_inputs FOR SELECT
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM user_couples 
      WHERE status = 'active' 
      AND ((user1_id = auth.uid() AND user2_id = incoming_financial_inputs.user_id)
        OR (user2_id = auth.uid() AND user1_id = incoming_financial_inputs.user_id))
    )
  );

CREATE POLICY "Service role can insert inputs"
  ON public.incoming_financial_inputs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update inputs"
  ON public.incoming_financial_inputs FOR UPDATE
  USING (auth.role() = 'service_role');

-- Trigger updated_at
DROP TRIGGER IF EXISTS set_updated_at_incoming_inputs ON incoming_financial_inputs;
CREATE TRIGGER set_updated_at_incoming_inputs
  BEFORE UPDATE ON incoming_financial_inputs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- FUNÇÃO RESOLVER HINTS
CREATE OR REPLACE FUNCTION public.resolve_financial_hints(p_input_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_input RECORD;
  v_category_id UUID;
  v_account_id UUID;
  v_card_id UUID;
BEGIN
  SELECT * INTO v_input FROM incoming_financial_inputs WHERE id = p_input_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Input não encontrado');
  END IF;

  IF v_input.category_hint IS NOT NULL THEN
    SELECT id INTO v_category_id
    FROM categories
    WHERE user_id = v_input.user_id AND deleted_at IS NULL
      AND LOWER(name) LIKE '%' || LOWER(TRIM(v_input.category_hint)) || '%'
    ORDER BY CASE WHEN LOWER(name) = LOWER(TRIM(v_input.category_hint)) THEN 0 ELSE 1 END, created_at DESC
    LIMIT 1;
  END IF;

  IF v_input.account_hint IS NOT NULL THEN
    SELECT id INTO v_account_id
    FROM accounts
    WHERE user_id = v_input.user_id AND deleted_at IS NULL AND is_active = true
      AND LOWER(name) LIKE '%' || LOWER(TRIM(v_input.account_hint)) || '%'
    ORDER BY CASE WHEN LOWER(name) = LOWER(TRIM(v_input.account_hint)) THEN 0 ELSE 1 END, created_at DESC
    LIMIT 1;
  END IF;

  IF v_input.card_hint IS NOT NULL THEN
    SELECT id INTO v_card_id
    FROM cards
    WHERE user_id = v_input.user_id AND deleted_at IS NULL
      AND LOWER(name) LIKE '%' || LOWER(TRIM(v_input.card_hint)) || '%'
    ORDER BY CASE WHEN LOWER(name) = LOWER(TRIM(v_input.card_hint)) THEN 0 ELSE 1 END, created_at DESC
    LIMIT 1;
  END IF;

  UPDATE incoming_financial_inputs
  SET resolved_category_id = v_category_id, resolved_account_id = v_account_id,
      resolved_card_id = v_card_id, updated_at = now()
  WHERE id = p_input_id;

  RETURN jsonb_build_object('success', true, 'category_id', v_category_id, 'account_id', v_account_id,
    'card_id', v_card_id, 'category_found', v_category_id IS NOT NULL,
    'account_found', v_account_id IS NOT NULL, 'card_found', v_card_id IS NOT NULL);
END;
$$;

-- FUNÇÃO CAIXA-FORTE
CREATE OR REPLACE FUNCTION public.create_transaction_from_input(p_input_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_input RECORD;
  v_transaction_id UUID;
  v_owner_user TEXT;
  v_description TEXT;
BEGIN
  SELECT * INTO v_input FROM incoming_financial_inputs WHERE id = p_input_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Input não encontrado');
  END IF;
  
  IF v_input.status != 'confirmed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Input não confirmado. Status: ' || v_input.status);
  END IF;
  
  IF v_input.processed_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Input já processado', 'transaction_id', v_input.transaction_id);
  END IF;
  
  IF v_input.amount IS NULL OR v_input.amount <= 0 THEN
    UPDATE incoming_financial_inputs SET status = 'error', error_message = 'Valor inválido' WHERE id = p_input_id;
    RETURN jsonb_build_object('success', false, 'error', 'Valor inválido');
  END IF;
  
  IF v_input.transaction_type NOT IN ('expense', 'income') THEN
    UPDATE incoming_financial_inputs SET status = 'error', error_message = 'Tipo inválido' WHERE id = p_input_id;
    RETURN jsonb_build_object('success', false, 'error', 'Tipo deve ser expense ou income');
  END IF;

  v_owner_user := COALESCE(v_input.owner_user, public.determine_owner_user(v_input.user_id));
  v_description := COALESCE(v_input.description_hint, v_input.category_hint, 'Via WhatsApp: ' || LEFT(v_input.raw_message, 50));

  INSERT INTO public.transactions (
    user_id, type, amount, currency, description, transaction_date, purchase_date,
    category_id, account_id, card_id, payment_method, owner_user, status
  ) VALUES (
    v_input.user_id, v_input.transaction_type::transaction_type, v_input.amount,
    COALESCE(v_input.currency, 'BRL'), v_description,
    COALESCE(v_input.transaction_date, CURRENT_DATE), COALESCE(v_input.transaction_date, CURRENT_DATE),
    v_input.resolved_category_id, v_input.resolved_account_id, v_input.resolved_card_id,
    CASE WHEN v_input.resolved_card_id IS NOT NULL THEN 'credit_card'
         WHEN v_input.resolved_account_id IS NOT NULL THEN 'bank_transfer' ELSE 'cash' END,
    v_owner_user, 'completed'
  ) RETURNING id INTO v_transaction_id;

  UPDATE incoming_financial_inputs
  SET status = 'processed', transaction_id = v_transaction_id, processed_at = now()
  WHERE id = p_input_id;

  INSERT INTO public.security_audit_log (user_id, action_type, resource_type, resource_id, details)
  VALUES (v_input.user_id, 'whatsapp_transaction_created', 'transaction', v_transaction_id::text,
    jsonb_build_object('input_id', p_input_id, 'source', v_input.source, 'amount', v_input.amount));

  RETURN jsonb_build_object('success', true, 'transaction_id', v_transaction_id, 'message', 'Transação criada');

EXCEPTION WHEN OTHERS THEN
  UPDATE incoming_financial_inputs SET status = 'error', error_message = SQLERRM WHERE id = p_input_id;
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- FUNÇÃO LISTAR OPÇÕES
CREATE OR REPLACE FUNCTION public.get_user_financial_options(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
BEGIN
  RETURN jsonb_build_object(
    'categories', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', id, 'name', name, 'type', category_type))
      FROM categories WHERE user_id = p_user_id AND deleted_at IS NULL), '[]'::jsonb),
    'accounts', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', id, 'name', name, 'type', account_type))
      FROM accounts WHERE user_id = p_user_id AND deleted_at IS NULL AND is_active = true), '[]'::jsonb),
    'cards', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', id, 'name', name, 'type', card_type))
      FROM cards WHERE user_id = p_user_id AND deleted_at IS NULL), '[]'::jsonb)
  );
END;
$$;

-- VIEW PARA IA
DROP VIEW IF EXISTS public.ai_transactions_view;
CREATE VIEW public.ai_transactions_view AS
SELECT t.id, t.user_id, t.type, t.amount, t.currency, t.description, t.transaction_date,
  t.status, t.owner_user, t.payment_method, c.name AS category_name, c.color AS category_color,
  a.name AS account_name, a.account_type, cd.name AS card_name, cd.card_type
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
LEFT JOIN accounts a ON t.account_id = a.id
LEFT JOIN cards cd ON t.card_id = cd.id
WHERE t.deleted_at IS NULL AND t.status = 'completed';

COMMENT ON TABLE incoming_financial_inputs IS 'Camada de ingestão WhatsApp/N8N - NUNCA grave direto em transactions!';
COMMENT ON FUNCTION create_transaction_from_input IS 'CAIXA-FORTE: Única forma segura de criar transações externas';