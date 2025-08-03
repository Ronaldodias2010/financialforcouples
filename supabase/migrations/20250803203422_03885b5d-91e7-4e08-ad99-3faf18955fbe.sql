-- Atualizar a função update_card_balance para considerar initial_balance como valor já consumido
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
        -- initial_balance = limite disponível considerando valor inicial já consumido
        -- (credit_limit - initial_balance_original - gastos_realizados)
        initial_balance = GREATEST(0, 
          COALESCE(credit_limit, 0) - 
          COALESCE((
            SELECT initial_balance 
            FROM public.cards c2 
            WHERE c2.id = NEW.card_id
          ), 0) - 
          (
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
          COALESCE(credit_limit, 0) - 
          COALESCE((
            SELECT initial_balance 
            FROM public.cards c2 
            WHERE c2.id = OLD.card_id
          ), 0) - 
          (
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
          COALESCE(credit_limit, 0) - 
          COALESCE((
            SELECT initial_balance 
            FROM public.cards c2 
            WHERE c2.id = OLD.card_id
          ), 0) - 
          (
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
$function$;