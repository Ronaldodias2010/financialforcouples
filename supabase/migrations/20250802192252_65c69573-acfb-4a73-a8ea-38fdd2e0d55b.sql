-- Add category type to distinguish between income and expense categories
ALTER TABLE public.categories 
ADD COLUMN category_type text NOT NULL DEFAULT 'expense' CHECK (category_type IN ('income', 'expense'));

-- Add installment fields to transactions for credit card payments
ALTER TABLE public.transactions 
ADD COLUMN is_installment boolean DEFAULT false,
ADD COLUMN installment_number integer,
ADD COLUMN total_installments integer;