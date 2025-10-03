-- Fix date calculation in recurring expenses processing functions
-- Problem: Using (frequency_days / 30 || ' months') causes date regression
-- Solution: Use simple 'interval 1 month' for monthly frequencies

-- Drop and recreate process_recurring_expenses_daily with correct date calculation
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
  FOR expense_record IN 
    SELECT id, user_id, name, amount, category_id, remaining_installments, 
           frequency_days, frequency_type, next_due_date, owner_user
    FROM public.recurring_expenses
    WHERE is_active = true 
      AND is_completed = false
      AND next_due_date <= CURRENT_DATE
      AND remaining_installments > 0
  LOOP
    SELECT id INTO existing_manual_expense_id
    FROM public.manual_future_expenses
    WHERE user_id = expense_record.user_id
      AND description = expense_record.name
      AND due_date = expense_record.next_due_date
      AND amount = expense_record.amount
      AND is_paid = false;
    
    IF existing_manual_expense_id IS NULL THEN
      INSERT INTO public.manual_future_expenses (
        user_id,
        description,
        amount,
        due_date,
        category_id,
        is_paid,
        owner_user,
        notes,
        recurring_expense_id
      ) VALUES (
        expense_record.user_id,
        expense_record.name,
        expense_record.amount,
        expense_record.next_due_date,
        expense_record.category_id,
        false,
        expense_record.owner_user,
        'Gerado automaticamente do gasto recorrente',
        expense_record.id
      ) RETURNING id INTO new_manual_expense_id;
    END IF;
    
    -- ⭐ FIXED: Simple and robust date calculation
    UPDATE public.recurring_expenses
    SET remaining_installments = GREATEST(0, remaining_installments - 1),
        next_due_date = CASE 
          WHEN frequency_type = 'months' THEN next_due_date + interval '1 month'
          ELSE next_due_date + (frequency_days || ' days')::interval
        END,
        updated_at = now()
    WHERE id = expense_record.id;
    
    UPDATE public.recurring_expenses
    SET is_completed = true, is_active = false, updated_at = now()
    WHERE id = expense_record.id 
      AND remaining_installments <= 0;
  END LOOP;
END;
$function$;

-- Drop and recreate create_first_recurring_expense with correct date calculation
CREATE OR REPLACE FUNCTION public.create_first_recurring_expense()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.next_due_date <= CURRENT_DATE AND NEW.is_active = true AND NEW.remaining_installments > 0 THEN
    INSERT INTO public.manual_future_expenses (
      user_id,
      description,
      amount,
      due_date,
      category_id,
      is_paid,
      owner_user,
      notes,
      recurring_expense_id
    ) VALUES (
      NEW.user_id,
      NEW.name,
      NEW.amount,
      NEW.next_due_date,
      NEW.category_id,
      false,
      NEW.owner_user,
      'Gerado automaticamente do gasto recorrente',
      NEW.id
    );
    
    -- ⭐ FIXED: Simple and robust date calculation
    UPDATE public.recurring_expenses
    SET next_due_date = CASE 
          WHEN NEW.frequency_type = 'months' THEN NEW.next_due_date + interval '1 month'
          ELSE NEW.next_due_date + (NEW.frequency_days || ' days')::interval
        END,
        remaining_installments = GREATEST(0, NEW.remaining_installments - 1),
        updated_at = now()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;