-- Primeiro, verificar o estado atual do Inter carta 8k
-- Ajustar o gasto recorrente "Inter carta 8k" para evitar duplicação

-- 1. Atualizar o gasto recorrente para próxima parcela em novembro
UPDATE public.recurring_expenses 
SET next_due_date = '2025-11-12',
    remaining_installments = 14,
    updated_at = now()
WHERE name = 'Inter carta 8k' 
  AND amount = 271.81
  AND is_active = true;

-- 2. Verificar se há duplicação em gastos futuros para outubro
-- Manter apenas uma entrada para outubro (11/10/2025) se existir
WITH duplicate_check AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY user_id, description, amount, due_date 
    ORDER BY created_at ASC
  ) as row_num
  FROM public.manual_future_expenses
  WHERE description = 'Inter carta 8k' 
    AND amount = 271.81
    AND due_date = '2025-10-11'
    AND is_paid = false
)
DELETE FROM public.manual_future_expenses
WHERE id IN (
  SELECT id FROM duplicate_check WHERE row_num > 1
);

-- 3. Remover qualquer entrada em gastos futuros para setembro (já deveria ter sido paga)
DELETE FROM public.manual_future_expenses
WHERE description = 'Inter carta 8k' 
  AND amount = 271.81
  AND due_date < '2025-10-01'
  AND is_paid = false;