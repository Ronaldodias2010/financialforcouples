-- Create manual_future_incomes table
CREATE TABLE IF NOT EXISTS public.manual_future_incomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  category_id UUID,
  account_id UUID,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  notes TEXT,
  is_received BOOLEAN NOT NULL DEFAULT false,
  received_at TIMESTAMP WITH TIME ZONE,
  transaction_id UUID,
  owner_user TEXT NOT NULL DEFAULT 'user1',
  is_overdue BOOLEAN NOT NULL DEFAULT false,
  days_overdue INTEGER DEFAULT 0,
  received_late BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.manual_future_incomes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view couple future incomes"
ON public.manual_future_incomes
FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.user_couples
    WHERE status = 'active' AND (
      (user1_id = auth.uid() AND user2_id = manual_future_incomes.user_id) OR
      (user2_id = auth.uid() AND user1_id = manual_future_incomes.user_id)
    )
  )
);

CREATE POLICY "Users can create their own future incomes"
ON public.manual_future_incomes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own future incomes"
ON public.manual_future_incomes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own future incomes"
ON public.manual_future_incomes
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_manual_future_incomes_updated_at
BEFORE UPDATE ON public.manual_future_incomes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to process future income receipt
CREATE OR REPLACE FUNCTION public.process_future_income_receipt(
  p_user_id UUID,
  p_income_id UUID,
  p_receipt_date DATE DEFAULT CURRENT_DATE,
  p_account_id UUID DEFAULT NULL,
  p_payment_method TEXT DEFAULT 'cash'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_id UUID;
  v_owner_user TEXT;
  v_income RECORD;
BEGIN
  -- Get income details
  SELECT * INTO v_income
  FROM public.manual_future_incomes
  WHERE id = p_income_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Future income not found';
  END IF;
  
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
    payment_method,
    owner_user
  ) VALUES (
    p_user_id,
    'income',
    v_income.amount,
    v_income.description,
    p_receipt_date,
    v_income.category_id,
    COALESCE(p_account_id, v_income.account_id),
    p_payment_method,
    v_owner_user
  ) RETURNING id INTO v_transaction_id;
  
  -- Update future income record
  UPDATE public.manual_future_incomes
  SET is_received = true,
      received_at = now(),
      transaction_id = v_transaction_id,
      received_late = CASE WHEN p_receipt_date > due_date THEN true ELSE false END,
      days_overdue = CASE WHEN p_receipt_date > due_date THEN (p_receipt_date - due_date) ELSE 0 END,
      updated_at = now()
  WHERE id = p_income_id;
  
  RETURN v_transaction_id;
END;
$$;