-- Corrigir APENAS a manual_future_expenses da Prestação BV de outubro
-- A transação já existe, só precisa vincular
UPDATE public.manual_future_expenses
SET 
  is_paid = true,
  is_overdue = false,
  paid_at = NOW(),
  transaction_id = 'c68b9fc0-3cbc-4de1-9671-799b1ba8f711',
  updated_at = NOW()
WHERE id = '8cf3a53a-f1c1-45a7-8dd5-19cb9887090c';