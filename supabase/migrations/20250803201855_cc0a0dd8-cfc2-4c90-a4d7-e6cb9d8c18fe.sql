-- Atualizar o trigger para calcular corretamente os saldos do cartão
-- initial_balance = limite disponível (diminui com gastos)
-- current_balance = gastos realizados (aumenta com gastos)

CREATE OR REPLACE FUNCTION public.update_card_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Se é uma inserção ou atualização
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Atualizar saldos do cartão se a transação usa cartão
    IF NEW.card_id IS NOT NULL THEN
      UPDATE public.cards 
      SET 
        -- current_balance = total de gastos realizados (para fatura futura)
        current_balance = (
          SELECT COALESCE(SUM(amount), 0)
          FROM public.transactions 
          WHERE card_id = NEW.card_id 
          AND type = 'expense'
        ),
        -- initial_balance = limite disponível (credit_limit - gastos realizados)
        initial_balance = GREATEST(0, 
          COALESCE(credit_limit, 0) - (
            SELECT COALESCE(SUM(amount), 0)
            FROM public.transactions 
            WHERE card_id = NEW.card_id 
            AND type = 'expense'
          )
        )
      WHERE id = NEW.card_id;
    END IF;
    
    -- Se é uma atualização e o cartão mudou, atualizar o cartão anterior também
    IF TG_OP = 'UPDATE' AND OLD.card_id IS NOT NULL AND OLD.card_id != NEW.card_id THEN
      UPDATE public.cards 
      SET 
        current_balance = (
          SELECT COALESCE(SUM(amount), 0)
          FROM public.transactions 
          WHERE card_id = OLD.card_id 
          AND type = 'expense'
        ),
        initial_balance = GREATEST(0, 
          COALESCE(credit_limit, 0) - (
            SELECT COALESCE(SUM(amount), 0)
            FROM public.transactions 
            WHERE card_id = OLD.card_id 
            AND type = 'expense'
          )
        )
      WHERE id = OLD.card_id;
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- Se é uma exclusão
  IF TG_OP = 'DELETE' THEN
    -- Atualizar saldos do cartão se a transação usava cartão
    IF OLD.card_id IS NOT NULL THEN
      UPDATE public.cards 
      SET 
        current_balance = (
          SELECT COALESCE(SUM(amount), 0)
          FROM public.transactions 
          WHERE card_id = OLD.card_id 
          AND type = 'expense'
        ),
        initial_balance = GREATEST(0, 
          COALESCE(credit_limit, 0) - (
            SELECT COALESCE(SUM(amount), 0)
            FROM public.transactions 
            WHERE card_id = OLD.card_id 
            AND type = 'expense'
          )
        )
      WHERE id = OLD.card_id;
    END IF;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$function$

-- Criar o trigger se não existir
DROP TRIGGER IF EXISTS update_card_balance_trigger ON public.transactions;
CREATE TRIGGER update_card_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_card_balance();