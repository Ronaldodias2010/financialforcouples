-- Add overdraft_limit to accounts for debit overdraft feature
ALTER TABLE public.accounts
ADD COLUMN IF NOT EXISTS overdraft_limit NUMERIC NOT NULL DEFAULT 0;

-- Optional: comment for clarity
COMMENT ON COLUMN public.accounts.overdraft_limit IS 'Allowed negative balance (overdraft) limit for debit spending.';