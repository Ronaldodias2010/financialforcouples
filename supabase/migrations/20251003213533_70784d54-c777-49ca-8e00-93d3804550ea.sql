-- Fix recurring expenses date calculation and create immediate first occurrence

-- 1. Update process_recurring_expenses_daily to use ::date cast
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
    
    -- Update recurring expense: decrement installments and advance date with ::date cast
    UPDATE public.recurring_expenses
    SET remaining_installments = GREATEST(0, remaining_installments - 1),
        next_due_date = CASE 
          WHEN frequency_type = 'months' THEN 
            (next_due_date + (frequency_days / 30 || ' months')::interval)::date
          ELSE 
            (next_due_date + (frequency_days || ' days')::interval)::date
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

-- 2. Create function to generate first recurring expense immediately on insert
CREATE OR REPLACE FUNCTION public.create_first_recurring_expense()
RETURNS TRIGGER AS $$
BEGIN
  -- If next_due_date is today or in the past, create future expense immediately
  IF NEW.next_due_date <= CURRENT_DATE AND NEW.is_active = true AND NEW.remaining_installments > 0 THEN
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
      NEW.user_id,
      NEW.name,
      NEW.amount,
      NEW.next_due_date,
      NEW.category_id,
      false,
      NEW.owner_user,
      'Gerado automaticamente do gasto recorrente'
    );
    
    -- Advance to next date with ::date cast
    UPDATE public.recurring_expenses
    SET next_due_date = CASE 
          WHEN NEW.frequency_type = 'months' THEN 
            (NEW.next_due_date + (NEW.frequency_days / 30 || ' months')::interval)::date
          ELSE 
            (NEW.next_due_date + (NEW.frequency_days || ' days')::interval)::date
        END,
        remaining_installments = GREATEST(0, NEW.remaining_installments - 1),
        updated_at = now()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- 3. Create trigger to run after INSERT on recurring_expenses
DROP TRIGGER IF EXISTS trigger_create_first_recurring_expense ON public.recurring_expenses;
CREATE TRIGGER trigger_create_first_recurring_expense
AFTER INSERT ON public.recurring_expenses
FOR EACH ROW
EXECUTE FUNCTION public.create_first_recurring_expense();