-- Fix Priscila's goal allocation and check for missing goals
-- Update Priscila's "Viagem EUA" goal to use the Caixa card with 7,220 miles
UPDATE public.mileage_goals 
SET source_card_id = '60952650-403b-4352-bd8b-4445df441808',
    updated_at = now()
WHERE name = 'Viagem EUA' 
  AND user_id = 'a46d7924-c398-4b18-a795-73e248fa10c2';

-- Recalculate all mileage goals to ensure correct values
SELECT public.recalculate_mileage_goals();