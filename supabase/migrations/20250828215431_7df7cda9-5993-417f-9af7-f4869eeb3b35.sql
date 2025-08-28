-- Fix the mileage goals allocation issue
-- Update "Viagem EUA" goal to use the Sicredi card with 19,572 miles
UPDATE public.mileage_goals 
SET source_card_id = 'cc3f6b27-ee67-4fd1-98cd-c928261d20b5',
    updated_at = now()
WHERE name = 'Viagem EUA' 
  AND user_id IN (
    SELECT user_id FROM card_mileage_rules 
    WHERE card_id = 'cc3f6b27-ee67-4fd1-98cd-c928261d20b5'
  );

-- Remove the duplicate goal entry to avoid confusion
DELETE FROM public.mileage_goals 
WHERE id = '2b51b0b3-84a7-43d7-bd09-57f4e645c508';

-- Recalculate all mileage goals to ensure correct values
SELECT public.recalculate_mileage_goals();