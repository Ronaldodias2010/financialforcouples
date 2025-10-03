-- Fix date calculation in recurring expenses to maintain the same day of month
-- Instead of adding interval, we'll use date_trunc and extract to maintain the day

-- Drop and recreate create_first_recurring_expense with fixed date logic
DROP FUNCTION IF EXISTS public.create_first_recurring_expense() CASCADE;

CREATE OR REPLACE FUNCTION public.create_first_recurring_expense()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_next_date DATE;
  v_original_day INTEGER;
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
    
    -- Store original day of month
    v_original_day := EXTRACT(DAY FROM NEW.next_due_date);
    
    -- Calculate next date maintaining the same day of month
    IF NEW.frequency_type = 'months' THEN
      -- Add one month, then set to the original day
      v_next_date := (DATE_TRUNC('month', NEW.next_due_date) + INTERVAL '1 month' + 
                      INTERVAL '1 day' * (v_original_day - 1));
      
      -- Handle edge case where original day doesn't exist in next month (e.g., Jan 31 -> Feb)
      -- In this case, use the last day of that month
      IF EXTRACT(DAY FROM v_next_date) != v_original_day THEN
        v_next_date := (DATE_TRUNC('month', NEW.next_due_date) + INTERVAL '2 months' - INTERVAL '1 day');
      END IF;
    ELSE
      v_next_date := NEW.next_due_date + (NEW.frequency_days || ' days')::INTERVAL;
    END IF;
    
    UPDATE public.recurring_expenses
    SET next_due_date = v_next_date,
        remaining_installments = GREATEST(0, NEW.remaining_installments - 1),
        updated_at = now()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop and recreate process_recurring_expenses_daily with fixed date logic
DROP FUNCTION IF EXISTS public.process_recurring_expenses_daily() CASCADE;

CREATE OR REPLACE FUNCTION public.process_recurring_expenses_daily()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  expense_record RECORD;
  existing_manual_expense_id UUID;
  new_manual_expense_id UUID;
  v_next_date DATE;
  v_original_day INTEGER;
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
    
    -- Store original day of month
    v_original_day := EXTRACT(DAY FROM expense_record.next_due_date);
    
    -- Calculate next date maintaining the same day of month
    IF expense_record.frequency_type = 'months' THEN
      -- Add one month, then set to the original day
      v_next_date := (DATE_TRUNC('month', expense_record.next_due_date) + INTERVAL '1 month' + 
                      INTERVAL '1 day' * (v_original_day - 1));
      
      -- Handle edge case where original day doesn't exist in next month (e.g., Jan 31 -> Feb)
      IF EXTRACT(DAY FROM v_next_date) != v_original_day THEN
        v_next_date := (DATE_TRUNC('month', expense_record.next_due_date) + INTERVAL '2 months' - INTERVAL '1 day');
      END IF;
    ELSE
      v_next_date := expense_record.next_due_date + (expense_record.frequency_days || ' days')::INTERVAL;
    END IF;
    
    UPDATE public.recurring_expenses
    SET remaining_installments = GREATEST(0, remaining_installments - 1),
        next_due_date = v_next_date,
        updated_at = now()
    WHERE id = expense_record.id;
    
    UPDATE public.recurring_expenses
    SET is_completed = true, is_active = false, updated_at = now()
    WHERE id = expense_record.id 
      AND remaining_installments <= 0;
  END LOOP;
END;
$$;