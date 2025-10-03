-- 1. Adicionar coluna frequency_type na tabela recurring_expenses
ALTER TABLE public.recurring_expenses 
ADD COLUMN IF NOT EXISTS frequency_type text DEFAULT 'days' 
CHECK (frequency_type IN ('days', 'months'));

-- 2. Atualizar função process_recurring_expenses_daily para usar frequência dinâmica
CREATE OR REPLACE FUNCTION public.process_recurring_expenses_daily()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  expense_record RECORD;
  existing_manual_expense_id UUID;
  new_manual_expense_id UUID;
BEGIN
  -- Process all active recurring expenses that are due
  FOR expense_record IN 
    SELECT id, user_id, name, amount, category_id, remaining_installments, 
           frequency_days, frequency_type, next_due_date, owner_user
    FROM public.recurring_expenses
    WHERE is_active = true 
      AND is_completed = false
      AND next_due_date <= CURRENT_DATE
      AND remaining_installments > 0
  LOOP
    -- Check if this expense already exists in manual_future_expenses for this due date
    SELECT id INTO existing_manual_expense_id
    FROM public.manual_future_expenses
    WHERE user_id = expense_record.user_id
      AND description = expense_record.name
      AND due_date = expense_record.next_due_date
      AND amount = expense_record.amount
      AND is_paid = false;
    
    -- Only create manual future expense if it doesn't exist
    IF existing_manual_expense_id IS NULL THEN
      -- Create entry in manual_future_expenses
      INSERT INTO public.manual_future_expenses (
        user_id,
        description,
        amount,
        due_date,
        category_id,
        is_paid,
        owner_user,
        notes
      ) VALUES (
        expense_record.user_id,
        expense_record.name,
        expense_record.amount,
        expense_record.next_due_date,
        expense_record.category_id,
        false,
        expense_record.owner_user,
        'Gerado automaticamente do gasto recorrente'
      ) RETURNING id INTO new_manual_expense_id;
    END IF;
    
    -- Update recurring expense: decrement installments and advance date
    -- ⭐ NOVO: Usar frequency_type para calcular próxima data
    UPDATE public.recurring_expenses
    SET remaining_installments = GREATEST(0, remaining_installments - 1),
        next_due_date = CASE 
          WHEN frequency_type = 'months' THEN 
            next_due_date + (frequency_days / 30 || ' months')::interval
          ELSE 
            next_due_date + (frequency_days || ' days')::interval
        END,
        updated_at = now()
    WHERE id = expense_record.id;
    
    -- Mark as completed if no more installments
    UPDATE public.recurring_expenses
    SET is_completed = true, is_active = false, updated_at = now()
    WHERE id = expense_record.id 
      AND remaining_installments <= 0;
  END LOOP;
END;
$function$;

-- 3. Migrar dados existentes: definir frequency_type='months' para frequências mensais
UPDATE public.recurring_expenses 
SET frequency_type = 'months',
    updated_at = now()
WHERE frequency_days IN (30, 90, 365)
  AND frequency_type = 'days';