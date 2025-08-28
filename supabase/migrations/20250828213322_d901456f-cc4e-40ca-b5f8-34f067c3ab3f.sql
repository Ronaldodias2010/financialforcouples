-- Corrigir os warnings de segurança - adicionar search_path às funções que não têm
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