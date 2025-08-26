-- Add purchase_date column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN purchase_date date;

-- Backfill purchase_date for existing records
-- For credit card expenses, use created_at date as purchase_date
-- For other transactions, use transaction_date as purchase_date
UPDATE public.transactions 
SET purchase_date = CASE 
  WHEN card_id IS NOT NULL AND type = 'expense' THEN DATE(created_at)
  ELSE transaction_date
END;

-- Make purchase_date NOT NULL and set default
ALTER TABLE public.transactions 
ALTER COLUMN purchase_date SET NOT NULL,
ALTER COLUMN purchase_date SET DEFAULT CURRENT_DATE;