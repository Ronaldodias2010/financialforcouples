-- Add is_active column to accounts table
ALTER TABLE public.accounts ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Update all existing accounts to be active by default
UPDATE public.accounts SET is_active = true WHERE is_active IS NULL;