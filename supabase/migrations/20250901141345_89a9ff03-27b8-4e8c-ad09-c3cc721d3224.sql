-- Corrigir comportamento da conta de dinheiro

-- 1. Primeiro, vamos corrigir o saldo da conta de dinheiro baseado nas transações reais
UPDATE public.accounts 
SET balance = (
  SELECT COALESCE(
    SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END), 0
  )
  FROM public.transactions t 
  WHERE t.account_id = accounts.id
)
WHERE is_cash_account = true;

-- 2. Corrigir função para que transações em dinheiro só sejam linkadas se explicitamente definidas
-- Remover o link automático para conta de dinheiro
CREATE OR REPLACE FUNCTION public.link_cash_transactions_to_account()
RETURNS TRIGGER AS $$
BEGIN
  -- Não fazer link automático - apenas se o usuário definir explicitamente
  -- Transações em dinheiro devem ser criadas com account_id da conta de dinheiro manualmente
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Criar função para validar se há saldo suficiente em dinheiro
CREATE OR REPLACE FUNCTION public.validate_cash_spending()
RETURNS TRIGGER AS $$
DECLARE
  cash_account_balance numeric;
  cash_account_id uuid;
BEGIN
  -- Apenas validar se a transação está sendo feita NA conta de dinheiro
  IF NEW.account_id IS NOT NULL THEN
    -- Verificar se é uma conta de dinheiro
    SELECT balance, id INTO cash_account_balance, cash_account_id
    FROM public.accounts
    WHERE id = NEW.account_id 
      AND is_cash_account = true 
      AND user_id = NEW.user_id;
    
    -- Se é uma conta de dinheiro e é uma despesa, validar saldo
    IF cash_account_id IS NOT NULL AND NEW.type = 'expense' THEN
      IF cash_account_balance < NEW.amount THEN
        RAISE EXCEPTION 'Saldo insuficiente em dinheiro para esta transação. Saldo disponível: %', cash_account_balance;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Atualizar todas as transações em dinheiro órfãs para não ter account_id
-- (elas devem ser linkadas manualmente pelo usuário se desejado)
UPDATE public.transactions 
SET account_id = NULL 
WHERE payment_method = 'cash' 
  AND account_id IS NOT NULL 
  AND account_id NOT IN (
    SELECT id FROM public.accounts WHERE is_cash_account = true
  );

-- 5. Criar tipo enum para tipos de saque (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'withdrawal_type') THEN
    CREATE TYPE withdrawal_type AS ENUM ('bank_withdrawal', 'credit_advance');
  END IF;
END $$;

-- 6. Criar tabela para registrar saques (operação que conecta contas)
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_account_id uuid REFERENCES public.accounts(id),
  source_card_id uuid REFERENCES public.cards(id),
  cash_account_id uuid NOT NULL REFERENCES public.accounts(id),
  amount numeric NOT NULL CHECK (amount > 0),
  currency currency_type NOT NULL DEFAULT 'BRL',
  withdrawal_type withdrawal_type NOT NULL,
  description text,
  withdrawal_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT withdrawals_source_check CHECK (
    (source_account_id IS NOT NULL AND source_card_id IS NULL) OR
    (source_account_id IS NULL AND source_card_id IS NOT NULL)
  )
);

-- RLS para tabela de saques
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own withdrawals" ON public.withdrawals
FOR ALL USING (auth.uid() = user_id);

-- 7. Criar função para processar saques
CREATE OR REPLACE FUNCTION public.process_withdrawal(
  p_user_id uuid,
  p_source_account_id uuid DEFAULT NULL,
  p_source_card_id uuid DEFAULT NULL,
  p_amount numeric,
  p_currency currency_type DEFAULT 'BRL',
  p_description text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_cash_account_id uuid;
  v_withdrawal_id uuid;
  v_withdrawal_type withdrawal_type;
BEGIN
  -- Validar que apenas uma fonte foi especificada
  IF (p_source_account_id IS NOT NULL AND p_source_card_id IS NOT NULL) OR
     (p_source_account_id IS NULL AND p_source_card_id IS NULL) THEN
    RAISE EXCEPTION 'Especifique apenas uma fonte: conta bancária OU cartão de crédito';
  END IF;
  
  -- Encontrar conta de dinheiro do usuário na moeda especificada
  SELECT id INTO v_cash_account_id
  FROM public.accounts
  WHERE user_id = p_user_id 
    AND is_cash_account = true 
    AND currency = p_currency
  LIMIT 1;
  
  IF v_cash_account_id IS NULL THEN
    RAISE EXCEPTION 'Conta de dinheiro não encontrada para a moeda %', p_currency;
  END IF;
  
  -- Determinar tipo de saque
  IF p_source_account_id IS NOT NULL THEN
    v_withdrawal_type := 'bank_withdrawal';
  ELSE
    v_withdrawal_type := 'credit_advance';
  END IF;
  
  -- Criar registro de saque
  INSERT INTO public.withdrawals (
    user_id, source_account_id, source_card_id, cash_account_id,
    amount, currency, withdrawal_type, description
  ) VALUES (
    p_user_id, p_source_account_id, p_source_card_id, v_cash_account_id,
    p_amount, p_currency, v_withdrawal_type, p_description
  ) RETURNING id INTO v_withdrawal_id;
  
  -- Criar transação de saída da fonte
  IF p_source_account_id IS NOT NULL THEN
    INSERT INTO public.transactions (
      user_id, account_id, type, amount, currency, description,
      payment_method, owner_user
    ) VALUES (
      p_user_id, p_source_account_id, 'expense', p_amount, p_currency,
      COALESCE(p_description, 'Saque para dinheiro'),
      'withdrawal', public.determine_owner_user(p_user_id)
    );
  ELSE
    INSERT INTO public.transactions (
      user_id, card_id, type, amount, currency, description,
      payment_method, owner_user
    ) VALUES (
      p_user_id, p_source_card_id, 'expense', p_amount, p_currency,
      COALESCE(p_description, 'Adiantamento em dinheiro'),
      'withdrawal', public.determine_owner_user(p_user_id)
    );
  END IF;
  
  -- Criar transação de entrada na conta de dinheiro
  INSERT INTO public.transactions (
    user_id, account_id, type, amount, currency, description,
    payment_method, owner_user
  ) VALUES (
    p_user_id, v_cash_account_id, 'income', p_amount, p_currency,
    COALESCE(p_description, 'Dinheiro recebido de saque'),
    'cash', public.determine_owner_user(p_user_id)
  );
  
  RETURN v_withdrawal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;