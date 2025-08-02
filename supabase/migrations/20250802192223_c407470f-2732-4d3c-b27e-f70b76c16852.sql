-- Add category type to distinguish between income and expense categories
ALTER TABLE public.categories 
ADD COLUMN category_type text NOT NULL DEFAULT 'expense' CHECK (category_type IN ('income', 'expense'));

-- Add installment fields to transactions for credit card payments
ALTER TABLE public.transactions 
ADD COLUMN is_installment boolean DEFAULT false,
ADD COLUMN installment_number integer,
ADD COLUMN total_installments integer;

-- Create recurring_expenses table for recurring payments like Netflix
CREATE TABLE public.recurring_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  amount numeric NOT NULL,
  currency currency_type NOT NULL DEFAULT 'BRL',
  category_id uuid,
  card_id uuid,
  account_id uuid,
  frequency_days integer NOT NULL DEFAULT 30,
  next_due_date date NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on recurring_expenses
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for recurring_expenses
CREATE POLICY "Users can view their own recurring expenses" 
ON public.recurring_expenses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recurring expenses" 
ON public.recurring_expenses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring expenses" 
ON public.recurring_expenses 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring expenses" 
ON public.recurring_expenses 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updating updated_at
CREATE TRIGGER update_recurring_expenses_updated_at
BEFORE UPDATE ON public.recurring_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();