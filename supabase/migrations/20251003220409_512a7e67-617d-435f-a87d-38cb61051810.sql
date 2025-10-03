-- Clean up and reprocess recurring expenses with correct dates
-- This migration fixes existing recurring expenses that may have incorrect future dates

-- Step 1: Update frequency_type for monthly expenses
UPDATE public.recurring_expenses
SET frequency_type = 'months',
    updated_at = now()
WHERE frequency_days = 30
  AND (frequency_type IS NULL OR frequency_type = 'days');

-- Step 2: Delete future expenses that haven't been paid yet and are linked to recurring expenses
-- This allows them to be regenerated with correct dates
DELETE FROM public.manual_future_expenses
WHERE recurring_expense_id IS NOT NULL
  AND is_paid = false
  AND due_date > CURRENT_DATE;

-- Step 3: For each active recurring expense, recalculate the next_due_date
-- to ensure it's on the correct day of the month
DO $$
DECLARE
  expense_rec RECORD;
  original_day INTEGER;
  new_next_date DATE;
BEGIN
  FOR expense_rec IN 
    SELECT id, next_due_date, frequency_type, frequency_days, remaining_installments
    FROM public.recurring_expenses
    WHERE is_active = true 
      AND is_completed = false
      AND remaining_installments > 0
  LOOP
    -- Get the day of the month from the current next_due_date
    original_day := EXTRACT(DAY FROM expense_rec.next_due_date);
    
    -- If the next_due_date is in the past, advance it to the current month
    IF expense_rec.next_due_date < CURRENT_DATE THEN
      IF expense_rec.frequency_type = 'months' THEN
        -- Set to the original day in the current month
        new_next_date := DATE_TRUNC('month', CURRENT_DATE) + (original_day - 1 || ' days')::interval;
        
        -- If that date is still in the past, move to next month
        IF new_next_date < CURRENT_DATE THEN
          new_next_date := new_next_date + interval '1 month';
        END IF;
      ELSE
        -- For daily frequencies, just add the necessary days
        new_next_date := CURRENT_DATE + (expense_rec.frequency_days || ' days')::interval;
      END IF;
      
      -- Update the next_due_date
      UPDATE public.recurring_expenses
      SET next_due_date = new_next_date,
          updated_at = now()
      WHERE id = expense_rec.id;
    END IF;
  END LOOP;
END;
$$;

-- Step 4: Create a function to manually trigger recurring expenses processing
-- This can be called to regenerate future expenses with correct dates
CREATE OR REPLACE FUNCTION public.regenerate_future_expenses()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  expense_record RECORD;
  generated_count INTEGER := 0;
  months_ahead INTEGER := 3;
  next_generation_date DATE;
BEGIN
  FOR expense_record IN 
    SELECT id, user_id, name, amount, category_id, next_due_date,
           frequency_days, frequency_type, owner_user, remaining_installments
    FROM public.recurring_expenses
    WHERE is_active = true 
      AND is_completed = false
      AND remaining_installments > 0
  LOOP
    next_generation_date := expense_record.next_due_date;
    
    -- Generate expenses for the next few months
    FOR i IN 1..months_ahead LOOP
      -- Only create if this date doesn't already have a manual expense
      IF NOT EXISTS (
        SELECT 1 FROM public.manual_future_expenses
        WHERE user_id = expense_record.user_id
          AND recurring_expense_id = expense_record.id
          AND due_date = next_generation_date
          AND is_paid = false
      ) THEN
        -- Create the future expense
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
          next_generation_date,
          expense_record.category_id,
          false,
          expense_record.owner_user,
          'Gerado automaticamente do gasto recorrente',
          expense_record.id
        );
        
        generated_count := generated_count + 1;
      END IF;
      
      -- Calculate next date
      IF expense_record.frequency_type = 'months' THEN
        next_generation_date := next_generation_date + interval '1 month';
      ELSE
        next_generation_date := next_generation_date + (expense_record.frequency_days || ' days')::interval;
      END IF;
      
      -- Stop if we've reached the end of installments
      IF i >= expense_record.remaining_installments THEN
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
  
  RETURN generated_count;
END;
$function$;

-- Step 5: Call the regeneration function to create future expenses
SELECT public.regenerate_future_expenses();