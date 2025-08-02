-- Add owner_user field to transactions table to track which user made the transaction
ALTER TABLE public.transactions 
ADD COLUMN owner_user TEXT DEFAULT 'user1';

-- Add owner_user field to cards table
ALTER TABLE public.cards 
ADD COLUMN owner_user TEXT DEFAULT 'user1';

-- Add owner_user field to accounts table  
ALTER TABLE public.accounts 
ADD COLUMN owner_user TEXT DEFAULT 'user1';

-- Add owner_user field to categories table
ALTER TABLE public.categories 
ADD COLUMN owner_user TEXT DEFAULT 'user1';

-- Add owner_user field to recurring_expenses table
ALTER TABLE public.recurring_expenses 
ADD COLUMN owner_user TEXT DEFAULT 'user1';