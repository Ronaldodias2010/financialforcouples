-- Add closing_date field to cards table for credit card billing cycle
ALTER TABLE public.cards 
ADD COLUMN closing_date INTEGER;