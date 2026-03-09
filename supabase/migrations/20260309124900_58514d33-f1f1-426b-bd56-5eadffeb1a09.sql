-- Fix the automatic debit record: set correct owner (Priscila)
UPDATE public.automatic_debits 
SET owner_user = 'a46d7924-c398-4b18-a795-73e248fa10c2'
WHERE id = 'cfc2660f-eb1d-488d-937a-6d66c5ebf24f';