-- Create table for future expense payments
CREATE TABLE public.future_expense_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recurring_expense_id UUID NULL,
  installment_transaction_id UUID NULL,
  card_payment_info JSONB NULL,
  original_due_date DATE NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category_id UUID NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  account_id UUID NULL,
  card_id UUID NULL,
  transaction_id UUID NULL,
  owner_user TEXT NOT NULL DEFAULT 'user1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.future_expense_payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own future expense payments" 
ON public.future_expense_payments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view couple future expense payments" 
ON public.future_expense_payments 
FOR SELECT 
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM user_couples 
  WHERE status = 'active' 
  AND ((user1_id = auth.uid() AND user2_id = future_expense_payments.user_id) 
       OR (user2_id = auth.uid() AND user1_id = future_expense_payments.user_id))
));

CREATE POLICY "Users can update their own future expense payments" 
ON public.future_expense_payments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own future expense payments" 
ON public.future_expense_payments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger to update updated_at
CREATE TRIGGER update_future_expense_payments_updated_at
BEFORE UPDATE ON public.future_expense_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to process future expense payment
CREATE OR REPLACE FUNCTION public.process_future_expense_payment(
  p_user_id UUID,
  p_recurring_expense_id UUID DEFAULT NULL,
  p_installment_transaction_id UUID DEFAULT NULL,
  p_card_payment_info JSONB DEFAULT NULL,
  p_original_due_date DATE,
  p_payment_date DATE DEFAULT CURRENT_DATE,
  p_amount NUMERIC,
  p_description TEXT,
  p_category_id UUID DEFAULT NULL,
  p_payment_method TEXT DEFAULT 'cash',
  p_account_id UUID DEFAULT NULL,
  p_card_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
  
  -- Update recurring expense next due date if applicable
  IF p_recurring_expense_id IS NOT NULL THEN
    UPDATE public.recurring_expenses
    SET next_due_date = next_due_date + INTERVAL '1 day' * frequency_days,
        updated_at = now()
    WHERE id = p_recurring_expense_id
      AND user_id = p_user_id;
  END IF;
  
  RETURN v_payment_id;
END;
$$;