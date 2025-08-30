-- Add reward_amount column to promo_codes table
ALTER TABLE public.promo_codes 
ADD COLUMN IF NOT EXISTS reward_amount NUMERIC DEFAULT 0;

-- Update existing records to have proper reward_amount
UPDATE public.promo_codes 
SET reward_amount = discount_value 
WHERE reward_amount IS NULL OR reward_amount = 0;