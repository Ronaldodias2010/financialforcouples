-- Etapa 1: Corrigir dados históricos das metas existentes
-- Identificar e vincular metas existentes com seus cartões baseado nas milhas iniciais

-- Primeiro, vamos atualizar as metas que foram criadas com milhas de cartões específicos
-- Baseado nos dados da query anterior, temos duas metas "Viagem EUA" onde uma tem 516.8 milhas

-- Atualizar a meta com milhas para incluir o source_card_id correto
-- Para isso, vamos buscar qual cartão tem milhas existentes que correspondem ao current_miles da meta

-- Corrigir a função calculate_miles_for_transaction para incluir milhas iniciais corretamente
CREATE OR REPLACE FUNCTION public.calculate_miles_for_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  rule_record RECORD;
  miles_earned NUMERIC;
  month_year_str TEXT;
BEGIN
  -- Only process expense transactions with card_id
  IF NEW.type = 'expense' AND NEW.card_id IS NOT NULL THEN
    -- Get active mileage rule for this card
    SELECT * INTO rule_record
    FROM public.card_mileage_rules
    WHERE card_id = NEW.card_id 
    AND user_id = NEW.user_id 
    AND is_active = true
    LIMIT 1;
    
    IF FOUND THEN
      -- Calculate miles earned based on the rule
      miles_earned := (NEW.amount / rule_record.amount_threshold) * rule_record.miles_per_amount;
      month_year_str := TO_CHAR(NEW.transaction_date, 'YYYY-MM');
      
      -- Insert mileage history record
      INSERT INTO public.mileage_history (
        user_id,
        card_id,
        rule_id,
        transaction_id,
        amount_spent,
        miles_earned,
        calculation_date,
        month_year
      ) VALUES (
        NEW.user_id,
        NEW.card_id,
        rule_record.id,
        NEW.id,
        NEW.amount,
        miles_earned,
        NEW.transaction_date,
        month_year_str
      );
      
      -- Update mileage goals current_miles for this specific user
      -- Agora consideramos apenas as metas que não têm um cartão específico vinculado
      -- ou que estão vinculadas ao cartão desta transação
      UPDATE public.mileage_goals
      SET current_miles = current_miles + miles_earned,
          is_completed = CASE 
            WHEN (current_miles + miles_earned) >= target_miles THEN true 
            ELSE is_completed 
          END,
          updated_at = now()
      WHERE user_id = NEW.user_id 
        AND is_completed = false
        AND (source_card_id IS NULL OR source_card_id = NEW.card_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Criar função para recalcular milhas das metas baseado no histórico e milhas iniciais
CREATE OR REPLACE FUNCTION public.recalculate_mileage_goals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  goal_record RECORD;
  initial_miles NUMERIC;
  history_miles NUMERIC;
  total_miles NUMERIC;
BEGIN
  -- Para cada meta ativa, recalcular as milhas corretas
  FOR goal_record IN 
    SELECT id, user_id, source_card_id, current_miles, target_miles
    FROM public.mileage_goals 
    WHERE is_completed = false
  LOOP
    initial_miles := 0;
    history_miles := 0;
    
    -- Se a meta tem um cartão vinculado, pegar as milhas iniciais desse cartão
    IF goal_record.source_card_id IS NOT NULL THEN
      SELECT COALESCE(existing_miles, 0) INTO initial_miles
      FROM public.card_mileage_rules
      WHERE card_id = goal_record.source_card_id 
        AND user_id = goal_record.user_id
        AND is_active = true
      LIMIT 1;
    END IF;
    
    -- Somar as milhas do histórico para este usuário
    SELECT COALESCE(SUM(miles_earned), 0) INTO history_miles
    FROM public.mileage_history
    WHERE user_id = goal_record.user_id
      AND (goal_record.source_card_id IS NULL OR card_id = goal_record.source_card_id);
    
    -- Total de milhas = milhas iniciais + milhas do histórico
    total_miles := initial_miles + history_miles;
    
    -- Atualizar a meta com o valor correto
    UPDATE public.mileage_goals
    SET current_miles = total_miles,
        is_completed = CASE 
          WHEN total_miles >= target_miles THEN true 
          ELSE false 
        END,
        updated_at = now()
    WHERE id = goal_record.id;
    
  END LOOP;
END;
$function$;

-- Executar a função para recalcular todas as metas
SELECT public.recalculate_mileage_goals();