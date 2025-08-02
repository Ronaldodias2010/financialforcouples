-- Add due date to cards table for credit card payment tracking
ALTER TABLE public.cards 
ADD COLUMN due_date integer CHECK (due_date >= 1 AND due_date <= 31);