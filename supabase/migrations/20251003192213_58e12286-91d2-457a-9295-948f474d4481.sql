-- Dropar trigger e função existentes
DROP TRIGGER IF EXISTS trg_card_available_on_transaction ON public.transactions CASCADE;
DROP TRIGGER IF EXISTS handle_card_balance_on_transaction ON public.transactions CASCADE;
DROP FUNCTION IF EXISTS public.handle_card_available_on_transaction() CASCADE;
DROP FUNCTION IF EXISTS public.update_card_balance() CASCADE;

-- Criar nova função que considera apenas transações completed + pending do mês atual
CREATE OR REPLACE FUNCTION public.update_card_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  total_expenses NUMERIC;
  card_type_value text;
BEGIN
  -- Apenas processar transações de despesa com cartão
  IF (TG_OP = 'INSERT' AND NEW.type = 'expense' AND NEW.card_id IS NOT NULL) THEN
    -- Buscar tipo do cartão
    SELECT card_type INTO card_type_value FROM public.cards WHERE id = NEW.card_id;
    
    -- Calcular total de despesas do cartão:
    -- - Transações completed (já foram efetivadas)
    -- - Transações pending com due_date no mês atual ou anterior (já "aconteceram")
    SELECT COALESCE(SUM(amount), 0) INTO total_expenses
    FROM public.transactions
    WHERE card_id = NEW.card_id 
      AND type = 'expense'
      AND (
        status = 'completed' 
        OR (status = 'pending' AND due_date <= DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')
      );
    
    -- Atualizar o cartão
    UPDATE public.cards
    SET current_balance = total_expenses,
        initial_balance = GREATEST(0, COALESCE(credit_limit, 0) - COALESCE(initial_balance_original, 0) - total_expenses),
        updated_at = now()
    WHERE id = NEW.card_id;
    
    RETURN NEW;
    
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Recalcular para ambos os cartões (OLD e NEW se diferentes)
    IF OLD.card_id IS NOT NULL THEN
      SELECT COALESCE(SUM(amount), 0) INTO total_expenses
      FROM public.transactions
      WHERE card_id = OLD.card_id 
        AND type = 'expense'
        AND (
          status = 'completed' 
          OR (status = 'pending' AND due_date <= DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')
        );
      
      UPDATE public.cards
      SET current_balance = total_expenses,
          initial_balance = GREATEST(0, COALESCE(credit_limit, 0) - COALESCE(initial_balance_original, 0) - total_expenses),
          updated_at = now()
      WHERE id = OLD.card_id;
    END IF;
    
    IF NEW.card_id IS NOT NULL AND NEW.card_id != OLD.card_id THEN
      SELECT COALESCE(SUM(amount), 0) INTO total_expenses
      FROM public.transactions
      WHERE card_id = NEW.card_id 
        AND type = 'expense'
        AND (
          status = 'completed' 
          OR (status = 'pending' AND due_date <= DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')
        );
      
      UPDATE public.cards
      SET current_balance = total_expenses,
          initial_balance = GREATEST(0, COALESCE(credit_limit, 0) - COALESCE(initial_balance_original, 0) - total_expenses),
          updated_at = now()
      WHERE id = NEW.card_id;
    END IF;
    
    RETURN NEW;
    
  ELSIF (TG_OP = 'DELETE' AND OLD.type = 'expense' AND OLD.card_id IS NOT NULL) THEN
    SELECT COALESCE(SUM(amount), 0) INTO total_expenses
    FROM public.transactions
    WHERE card_id = OLD.card_id 
      AND type = 'expense'
      AND (
        status = 'completed' 
        OR (status = 'pending' AND due_date <= DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')
      );
    
    UPDATE public.cards
    SET current_balance = total_expenses,
        initial_balance = GREATEST(0, COALESCE(credit_limit, 0) - COALESCE(initial_balance_original, 0) - total_expenses),
        updated_at = now()
    WHERE id = OLD.card_id;
    
    RETURN OLD;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Criar trigger
CREATE TRIGGER handle_card_balance_on_transaction
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_card_balance();