-- Add rate_date column to track the actual date of the exchange rate quotation
ALTER TABLE public.exchange_rates 
ADD COLUMN IF NOT EXISTS rate_date DATE;

-- Update existing rows to use last_updated date as rate_date
UPDATE public.exchange_rates 
SET rate_date = DATE(last_updated) 
WHERE rate_date IS NULL;