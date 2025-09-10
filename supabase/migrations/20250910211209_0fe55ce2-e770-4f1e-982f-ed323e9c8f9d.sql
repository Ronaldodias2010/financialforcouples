-- Add installment control fields to recurring_expenses table
ALTER TABLE public.recurring_expenses 
ADD COLUMN remaining_installments integer,
ADD COLUMN total_installments integer,
ADD COLUMN is_completed boolean DEFAULT false;

-- Update existing records based on contract_duration_months and frequency_days
-- For existing records, calculate total installments from contract duration
UPDATE public.recurring_expenses 
SET total_installments = CASE 
  WHEN frequency_days <= 0 OR frequency_days IS NULL THEN contract_duration_months
  WHEN frequency_days = 30 THEN contract_duration_months
  WHEN frequency_days = 7 THEN contract_duration_months * 4
  WHEN frequency_days = 1 THEN contract_duration_months * 30
  ELSE GREATEST(1, ROUND(contract_duration_months * 30.0 / frequency_days))
END
WHERE total_installments IS NULL AND contract_duration_months IS NOT NULL;

-- Calculate remaining installments based on elapsed time since creation
UPDATE public.recurring_expenses 
SET remaining_installments = CASE
  WHEN total_installments IS NULL THEN NULL
  WHEN frequency_days <= 0 OR frequency_days IS NULL THEN GREATEST(0, total_installments - EXTRACT(MONTH FROM AGE(CURRENT_DATE, created_at::date)))
  ELSE GREATEST(0, total_installments - FLOOR(EXTRACT(DAY FROM AGE(CURRENT_DATE, created_at::date)) / frequency_days))
END
WHERE remaining_installments IS NULL;

-- Mark completed expenses
UPDATE public.recurring_expenses
SET is_completed = true, is_active = false
WHERE remaining_installments IS NOT NULL AND remaining_installments <= 0;

-- Create function to process recurring expenses automatically
CREATE OR REPLACE FUNCTION public.process_recurring_expenses_daily()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  expense_record RECORD;
BEGIN
  -- Process all active recurring expenses that are due
  FOR expense_record IN 
    SELECT id, user_id, remaining_installments, frequency_days, next_due_date
    FROM public.recurring_expenses
    WHERE is_active = true 
      AND is_completed = false
      AND next_due_date <= CURRENT_DATE
      AND remaining_installments > 0
  LOOP
    -- Decrement remaining installments
    UPDATE public.recurring_expenses
    SET remaining_installments = remaining_installments - 1,
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

-- Update the process_future_expense_payment function to handle installments
CREATE OR REPLACE FUNCTION public.process_future_expense_payment(
  p_user_id uuid, 
  p_original_due_date date, 
  p_amount numeric, 
  p_description text, 
  p_recurring_expense_id uuid DEFAULT NULL::uuid, 
  p_installment_transaction_id uuid DEFAULT NULL::uuid, 
  p_card_payment_info jsonb DEFAULT NULL::jsonb, 
  p_payment_date date DEFAULT CURRENT_DATE, 
  p_category_id uuid DEFAULT NULL::uuid, 
  p_payment_method text DEFAULT 'cash'::text, 
  p_account_id uuid DEFAULT NULL::uuid, 
  p_card_id uuid DEFAULT NULL::uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_transaction_id UUID;
  v_payment_id UUID;
  v_owner_user TEXT;
BEGIN
  -- Determine owner user
  v_owner_user := public.determine_owner_user(p_user_id);
  
  -- Create transaction
  INSERT INTO public.transactions (
    user_id,
    type,
    amount,
    description,
    transaction_date,
    category_id,
    account_id,
    card_id,
    payment_method,
    owner_user
  ) VALUES (
    p_user_id,
    'expense',
    p_amount,
    p_description,
    p_payment_date,
    p_category_id,
    p_account_id,
    p_card_id,
    p_payment_method,
    v_owner_user
  ) RETURNING id INTO v_transaction_id;
  
  -- Create payment record
  INSERT INTO public.future_expense_payments (
    user_id,
    recurring_expense_id,
    installment_transaction_id,
    card_payment_info,
    original_due_date,
    payment_date,
    amount,
    description,
    category_id,
    payment_method,
    account_id,
    card_id,
    transaction_id,
    owner_user
  ) VALUES (
    p_user_id,
    p_recurring_expense_id,
    p_installment_transaction_id,
    p_card_payment_info,
    p_original_due_date,
    p_payment_date,
    p_amount,
    p_description,
    p_category_id,
    p_payment_method,
    p_account_id,
    p_card_id,
    v_transaction_id,
    v_owner_user
  ) RETURNING id INTO v_payment_id;
  
  -- Update recurring expense: decrement installments and advance date
  IF p_recurring_expense_id IS NOT NULL THEN
    UPDATE public.recurring_expenses
    SET remaining_installments = GREATEST(0, COALESCE(remaining_installments, 1) - 1),
        next_due_date = next_due_date + (frequency_days || ' days')::interval,
        updated_at = now()
    WHERE id = p_recurring_expense_id
      AND user_id = p_user_id;
      
    -- Mark as completed if no more installments
    UPDATE public.recurring_expenses
    SET is_completed = true, is_active = false, updated_at = now()
    WHERE id = p_recurring_expense_id 
      AND user_id = p_user_id
      AND remaining_installments <= 0;
  END IF;
  
  RETURN v_payment_id;
END;
$function$;