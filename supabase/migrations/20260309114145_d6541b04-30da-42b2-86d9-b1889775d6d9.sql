
-- Add is_auto_debit column to recurring_expenses
ALTER TABLE public.recurring_expenses 
ADD COLUMN IF NOT EXISTS is_auto_debit boolean DEFAULT false;

-- Add comment
COMMENT ON COLUMN public.recurring_expenses.is_auto_debit IS 'Whether this expense is automatically debited from the linked account';
