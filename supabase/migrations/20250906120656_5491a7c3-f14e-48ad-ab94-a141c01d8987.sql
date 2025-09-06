-- Create manual_future_expenses table for user-created future expenses
CREATE TABLE public.manual_future_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  due_date DATE NOT NULL,
  category_id UUID,
  payment_method TEXT DEFAULT 'cash',
  notes TEXT,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMP WITH TIME ZONE,
  transaction_id UUID, -- Links to transaction when paid
  owner_user TEXT NOT NULL DEFAULT 'user1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.manual_future_expenses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own manual future expenses"
ON public.manual_future_expenses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view couple manual future expenses"
ON public.manual_future_expenses
FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.user_couples
    WHERE status = 'active'
    AND (
      (user1_id = auth.uid() AND user2_id = manual_future_expenses.user_id) OR
      (user2_id = auth.uid() AND user1_id = manual_future_expenses.user_id)
    )
  )
);

CREATE POLICY "Users can update their own manual future expenses"
ON public.manual_future_expenses
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own manual future expenses"
ON public.manual_future_expenses
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for owner_user
CREATE TRIGGER set_owner_user_manual_future_expenses
  BEFORE INSERT ON public.manual_future_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_owner_user_on_insert();

-- Add trigger for updated_at
CREATE TRIGGER update_manual_future_expenses_updated_at
  BEFORE UPDATE ON public.manual_future_expenses
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();