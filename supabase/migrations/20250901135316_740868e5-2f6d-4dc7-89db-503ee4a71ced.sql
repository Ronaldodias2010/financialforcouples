-- Criar função para vincular transações de dinheiro automaticamente às contas de dinheiro
CREATE OR REPLACE FUNCTION public.link_cash_transactions_to_account()
RETURNS TRIGGER AS $$
DECLARE
  cash_account_id UUID;
BEGIN
  -- Se a transação é em dinheiro e não tem account_id definido
  IF NEW.payment_method = 'cash' AND NEW.account_id IS NULL THEN
    -- Buscar a conta de dinheiro do usuário na moeda da transação
    SELECT id INTO cash_account_id
    FROM public.accounts
    WHERE user_id = NEW.user_id 
      AND is_cash_account = true 
      AND currency::text = NEW.currency::text
      AND is_active = true
    LIMIT 1;
    
    -- Se encontrou a conta de dinheiro, vincular automaticamente
    IF cash_account_id IS NOT NULL THEN
      NEW.account_id := cash_account_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para executar a função antes de inserir/atualizar transações
DROP TRIGGER IF EXISTS trigger_link_cash_transactions ON public.transactions;
CREATE TRIGGER trigger_link_cash_transactions
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.link_cash_transactions_to_account();

-- Corrigir transações existentes com payment_method = 'cash' e account_id = NULL
DO $$
DECLARE
  transaction_record RECORD;
  cash_account_id UUID;
BEGIN
  -- Para cada transação em dinheiro sem account_id
  FOR transaction_record IN 
    SELECT id, user_id, currency
    FROM public.transactions
    WHERE payment_method = 'cash' 
      AND account_id IS NULL
  LOOP
    -- Buscar a conta de dinheiro do usuário na moeda da transação
    SELECT id INTO cash_account_id
    FROM public.accounts
    WHERE user_id = transaction_record.user_id 
      AND is_cash_account = true 
      AND currency::text = transaction_record.currency::text
      AND is_active = true
    LIMIT 1;
    
    -- Se encontrou a conta de dinheiro, vincular
    IF cash_account_id IS NOT NULL THEN
      UPDATE public.transactions 
      SET account_id = cash_account_id,
          updated_at = now()
      WHERE id = transaction_record.id;
    END IF;
  END LOOP;
END $$;