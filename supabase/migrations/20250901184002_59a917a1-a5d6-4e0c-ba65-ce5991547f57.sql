-- Add expense_source_type to future_expense_payments to identify the type of future expense
ALTER TABLE public.future_expense_payments 
ADD COLUMN expense_source_type TEXT DEFAULT 'manual' CHECK (expense_source_type IN ('manual', 'installment', 'recurring', 'card_payment'));

-- Update existing records based on their source
UPDATE public.future_expense_payments 
SET expense_source_type = CASE 
  WHEN recurring_expense_id IS NOT NULL THEN 'recurring'
  WHEN installment_transaction_id IS NOT NULL THEN 'installment'
  WHEN card_payment_info IS NOT NULL THEN 'card_payment'
  ELSE 'manual'
END;

-- Add expense_source_type to transactions table to track installment types
ALTER TABLE public.transactions 
ADD COLUMN expense_source_type TEXT DEFAULT 'regular' CHECK (expense_source_type IN ('regular', 'installment_current', 'installment_future'));