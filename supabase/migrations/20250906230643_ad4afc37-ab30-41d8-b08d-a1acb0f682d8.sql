-- Adicionar validação de limite de conta para prevenir saldos negativos indevidos
CREATE OR REPLACE FUNCTION public.validate_account_overdraft()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  account_balance NUMERIC;
  account_overdraft_limit NUMERIC;
  new_balance NUMERIC;
BEGIN
  -- Apenas validar transações de despesa em contas
  IF NEW.type = 'expense' AND NEW.account_id IS NOT NULL THEN
    -- Buscar saldo atual e limite da conta
    SELECT balance, overdraft_limit 
    INTO account_balance, account_overdraft_limit
    FROM public.accounts 
    WHERE id = NEW.account_id;
    
    -- Calcular novo saldo após a transação
    new_balance := account_balance - NEW.amount;
    
    -- Validar se o novo saldo não ultrapassa o limite
    -- Se não há limite definido (NULL), só permite até zero
    -- Se há limite definido, permite até o limite negativo
    IF account_overdraft_limit IS NULL OR account_overdraft_limit = 0 THEN
      IF new_balance < 0 THEN
        RAISE EXCEPTION 'Saldo insuficiente. Saldo atual: R$ %, Tentativa: R$ %, Saldo resultante: R$ %', 
          account_balance, NEW.amount, new_balance;
      END IF;
    ELSE
      IF new_balance < -account_overdraft_limit THEN
        RAISE EXCEPTION 'Limite de conta excedido. Saldo atual: R$ %, Limite: R$ %, Tentativa: R$ %', 
          account_balance, account_overdraft_limit, NEW.amount;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Criar trigger para validação antes de inserir/atualizar transações
DROP TRIGGER IF EXISTS validate_account_overdraft_trigger ON transactions;
CREATE TRIGGER validate_account_overdraft_trigger
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION validate_account_overdraft();