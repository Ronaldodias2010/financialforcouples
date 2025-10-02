-- Fase 1: Adicionar colunas para controle de despesas atrasadas

-- Adicionar coluna is_overdue às despesas futuras manuais
ALTER TABLE public.manual_future_expenses 
ADD COLUMN IF NOT EXISTS is_overdue BOOLEAN DEFAULT FALSE;

-- Adicionar coluna is_overdue às despesas recorrentes
ALTER TABLE public.recurring_expenses 
ADD COLUMN IF NOT EXISTS is_overdue BOOLEAN DEFAULT FALSE;

-- Adicionar colunas para controle de pagamentos atrasados
ALTER TABLE public.future_expense_payments 
ADD COLUMN IF NOT EXISTS paid_late BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS days_overdue INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS original_due_date_tracking DATE;

-- Criar índices para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_manual_future_expenses_overdue 
ON public.manual_future_expenses(user_id, is_overdue, due_date) 
WHERE is_overdue = TRUE;

CREATE INDEX IF NOT EXISTS idx_recurring_expenses_overdue 
ON public.recurring_expenses(user_id, is_overdue, next_due_date) 
WHERE is_overdue = TRUE;

CREATE INDEX IF NOT EXISTS idx_future_payments_late 
ON public.future_expense_payments(user_id, paid_late) 
WHERE paid_late = TRUE;

-- Atualizar despesas já vencidas para marcar como atrasadas
UPDATE public.manual_future_expenses 
SET is_overdue = TRUE 
WHERE due_date < CURRENT_DATE 
  AND is_paid = FALSE 
  AND is_overdue = FALSE;

UPDATE public.recurring_expenses 
SET is_overdue = TRUE 
WHERE next_due_date < CURRENT_DATE 
  AND is_active = TRUE 
  AND is_completed = FALSE 
  AND is_overdue = FALSE;