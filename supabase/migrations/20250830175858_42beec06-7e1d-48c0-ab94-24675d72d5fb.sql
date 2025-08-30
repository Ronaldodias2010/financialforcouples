-- Add new fields to referral_codes table for flexible rewards and partner integration
ALTER TABLE public.referral_codes 
ADD COLUMN partner_email text,
ADD COLUMN reward_type text CHECK (reward_type IN ('monetary', 'other')) DEFAULT 'monetary',
ADD COLUMN reward_currency text DEFAULT 'BRL',
ADD COLUMN reward_description text;

-- Update existing referral_codes to have default reward_type
UPDATE public.referral_codes 
SET reward_type = 'monetary' 
WHERE reward_type IS NULL;