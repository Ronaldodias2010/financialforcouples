-- Update the process_recurring_expenses_daily function to automatically create manual_future_expenses
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
           frequency_days, next_due_date, owner_user
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
    UPDATE public.recurring_expenses
    SET remaining_installments = GREATEST(0, remaining_installments - 1),
        next_due_date = next_due_date + (frequency_days || ' days')::interval,
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

-- Manually fix the Banco BV recurring expense
-- Set next_due_date to November 2025 and remaining_installments to 21
UPDATE public.recurring_expenses 
SET next_due_date = '2025-11-05',
    remaining_installments = 21,
    updated_at = now()
WHERE name ILIKE '%BV%' OR name ILIKE '%banco%';

-- Create manual future expense for October BV if it doesn't exist
INSERT INTO public.manual_future_expenses (
  user_id,
  description,
  amount,
  due_date,
  category_id,
  is_paid,
  owner_user,
  notes
)
SELECT 
  re.user_id,
  re.name,
  re.amount,
  '2025-10-05'::date,
  re.category_id,
  false,
  re.owner_user,
  'Parcela de outubro - criada manualmente para correção'
FROM public.recurring_expenses re
WHERE (re.name ILIKE '%BV%' OR re.name ILIKE '%banco%')
  AND NOT EXISTS (
    SELECT 1 FROM public.manual_future_expenses mfe
    WHERE mfe.user_id = re.user_id
      AND mfe.due_date = '2025-10-05'
      AND mfe.description = re.name
      AND mfe.is_paid = false
  );