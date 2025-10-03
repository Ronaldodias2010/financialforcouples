-- Phase 1: Add status and due_date columns to transactions table
-- This migration is 100% backward compatible and doesn't affect existing functionality

-- Add status column with default 'completed' for all existing transactions
ALTER TABLE public.transactions 
ADD COLUMN status TEXT NOT NULL DEFAULT 'completed'
CHECK (status IN ('pending', 'completed', 'cancelled'));

-- Add due_date column (nullable for existing transactions)
ALTER TABLE public.transactions 
ADD COLUMN due_date DATE DEFAULT NULL;

-- Create performance indexes for future queries
CREATE INDEX idx_transactions_status_due_date 
ON public.transactions (status, due_date) 
WHERE status = 'pending';

CREATE INDEX idx_transactions_user_status 
ON public.transactions (user_id, status);

-- Add comment to document the new columns
COMMENT ON COLUMN public.transactions.status IS 'Transaction status: pending (future expense), completed (processed), cancelled';
COMMENT ON COLUMN public.transactions.due_date IS 'Due date for pending transactions (future expenses)';
