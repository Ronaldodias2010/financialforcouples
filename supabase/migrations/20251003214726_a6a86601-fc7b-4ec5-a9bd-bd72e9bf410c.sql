-- Add recurring_expense_id to manual_future_expenses for tracking
ALTER TABLE public.manual_future_expenses 
ADD COLUMN IF NOT EXISTS recurring_expense_id UUID REFERENCES public.recurring_expenses(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_manual_future_expenses_recurring_id 
ON public.manual_future_expenses(recurring_expense_id);

-- Update process_recurring_expenses_daily to link created future expenses
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
    
    UPDATE public.recurring_expenses
    SET is_completed = true, is_active = false, updated_at = now()
    WHERE id = expense_record.id 
      AND remaining_installments <= 0;
  END LOOP;
END;
$function$;

-- Update create_first_recurring_expense to link created future expenses
CREATE OR REPLACE FUNCTION public.create_first_recurring_expense()
RETURNS TRIGGER AS $$
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

-- Create function to propagate changes from recurring_expenses to manual_future_expenses
CREATE OR REPLACE FUNCTION public.update_future_expenses_on_recurring_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update unpaid future expenses with due_date >= today
  UPDATE public.manual_future_expenses
  SET 
    description = NEW.name,
    amount = NEW.amount,
    category_id = NEW.category_id,
    updated_at = now()
  WHERE recurring_expense_id = NEW.id
    AND is_paid = false
    AND due_date >= CURRENT_DATE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Create trigger to propagate changes
DROP TRIGGER IF EXISTS trigger_update_future_expenses_on_recurring_change ON public.recurring_expenses;
CREATE TRIGGER trigger_update_future_expenses_on_recurring_change
AFTER UPDATE OF name, amount, category_id ON public.recurring_expenses
FOR EACH ROW
WHEN (OLD.name IS DISTINCT FROM NEW.name OR OLD.amount IS DISTINCT FROM NEW.amount OR OLD.category_id IS DISTINCT FROM NEW.category_id)
EXECUTE FUNCTION public.update_future_expenses_on_recurring_change();