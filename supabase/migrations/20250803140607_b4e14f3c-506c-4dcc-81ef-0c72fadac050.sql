-- Add account_model column to accounts table
ALTER TABLE public.accounts 
ADD COLUMN account_model TEXT CHECK (account_model IN ('personal', 'business')) DEFAULT 'personal';