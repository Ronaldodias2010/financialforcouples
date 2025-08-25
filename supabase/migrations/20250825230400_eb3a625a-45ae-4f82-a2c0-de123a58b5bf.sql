-- Fix Priscila's transaction dates from September 2025 to August 2024
UPDATE transactions 
SET transaction_date = CASE 
  WHEN DATE_PART('day', transaction_date) >= 1 AND DATE_PART('day', transaction_date) <= 10 
    THEN DATE('2024-08-' || LPAD(DATE_PART('day', transaction_date)::text, 2, '0'))
  WHEN DATE_PART('day', transaction_date) >= 15 AND DATE_PART('day', transaction_date) <= 20
    THEN DATE('2024-08-' || LPAD(DATE_PART('day', transaction_date)::text, 2, '0'))
  ELSE transaction_date
END,
updated_at = now()
WHERE user_id = 'a46d7924-c398-4b18-a795-73e248fa10c2'
AND transaction_date >= '2025-09-01'
AND transaction_date <= '2025-09-30';