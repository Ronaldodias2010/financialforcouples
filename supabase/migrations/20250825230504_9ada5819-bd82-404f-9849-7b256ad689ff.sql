-- Corrigir transações da Priscila (user_id conhecido) datadas em set/2025 para ago/2025, preservando o dia
UPDATE public.transactions
SET transaction_date = make_date(2025, 8, LEAST(EXTRACT(DAY FROM transaction_date)::int, 31)),
    updated_at = now()
WHERE user_id = 'a46d7924-c398-4b18-a795-73e248fa10c2'
  AND transaction_date >= DATE '2025-09-01'
  AND transaction_date <= DATE '2025-09-30';

-- Ajustar possíveis correções anteriores indevidas (08/2024 -> 08/2025) somente para registros criados agora
UPDATE public.transactions
SET transaction_date = make_date(2025, 8, LEAST(EXTRACT(DAY FROM transaction_date)::int, 31)),
    updated_at = now()
WHERE user_id = 'a46d7924-c398-4b18-a795-73e248fa10c2'
  AND transaction_date >= DATE '2024-08-01'
  AND transaction_date <= DATE '2024-08-31'
  AND created_at >= DATE '2025-08-01';