-- Adicionar campo para valor mínimo de pagamento nos cartões
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS minimum_payment_amount numeric DEFAULT 0;

-- Adicionar campo para definir se permite pagamento parcial
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS allows_partial_payment boolean DEFAULT true;

-- Criar tabela para histórico de pagamentos de cartão
CREATE TABLE IF NOT EXISTS public.card_payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  card_id uuid NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  payment_amount numeric NOT NULL DEFAULT 0,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text NOT NULL DEFAULT 'cash',
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS na nova tabela
ALTER TABLE public.card_payment_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para card_payment_history
CREATE POLICY "Users can create their own card payment history" 
ON public.card_payment_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own card payment history" 
ON public.card_payment_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view couple card payment history" 
ON public.card_payment_history 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (EXISTS (
    SELECT 1 FROM user_couples 
    WHERE status = 'active' 
    AND (
      (user1_id = auth.uid() AND user2_id = card_payment_history.user_id) OR 
      (user2_id = auth.uid() AND user1_id = card_payment_history.user_id)
    )
  ))
);

CREATE POLICY "Users can update their own card payment history" 
ON public.card_payment_history 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own card payment history" 
ON public.card_payment_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Função para processar pagamento de cartão de crédito
CREATE OR REPLACE FUNCTION public.process_card_payment(
  p_user_id uuid,
  p_card_id uuid,
  p_payment_amount numeric,
  p_payment_date date DEFAULT CURRENT_DATE,
  p_payment_method text DEFAULT 'cash',
  p_account_id uuid DEFAULT NULL,
  p_notes text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_payment_id uuid;
  v_transaction_id uuid;
  v_card_info RECORD;
BEGIN
  -- Validar cartão
  SELECT * INTO v_card_info
  FROM public.cards
  WHERE id = p_card_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cartão não encontrado ou não pertence ao usuário';
  END IF;
  
  -- Criar histórico de pagamento
  INSERT INTO public.card_payment_history (
    user_id, card_id, payment_amount, payment_date,
    payment_method, account_id, notes
  ) VALUES (
    p_user_id, p_card_id, p_payment_amount, p_payment_date,
    p_payment_method, p_account_id, p_notes
  ) RETURNING id INTO v_payment_id;
  
  -- Criar transação de despesa (saída do pagamento)
  INSERT INTO public.transactions (
    user_id, type, amount, description, transaction_date,
    payment_method, account_id, owner_user
  ) VALUES (
    p_user_id, 'expense', p_payment_amount,
    'Pagamento de cartão de crédito: ' || v_card_info.name,
    p_payment_date, p_payment_method, p_account_id,
    public.determine_owner_user(p_user_id)
  ) RETURNING id INTO v_transaction_id;
  
  -- Atualizar limite disponível do cartão (adicionar o valor pago de volta)
  UPDATE public.cards
  SET initial_balance = initial_balance + p_payment_amount,
      updated_at = now()
  WHERE id = p_card_id;
  
  RETURN v_payment_id;
END;
$$;

-- Modificar tabela transactions para incluir tipo de transação do cartão
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS card_transaction_type text;

-- Trigger para marcar transações do cartão como futuras
CREATE OR REPLACE FUNCTION public.mark_card_transactions_as_future()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Se é uma transação de despesa com cartão de crédito
  IF NEW.type = 'expense' AND NEW.card_id IS NOT NULL THEN
    -- Marcar como transação futura do cartão
    NEW.card_transaction_type := 'future_expense';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para marcar transações
DROP TRIGGER IF EXISTS trigger_mark_card_transactions ON public.transactions;
CREATE TRIGGER trigger_mark_card_transactions
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.mark_card_transactions_as_future();