-- Clear all financial data for ronadias2010@gmail.com and priscila.serone@gmail.com
-- User IDs: fdc6cdb6-9478-4225-b450-93bfbaaf499a and a46d7924-c398-4b18-a795-73e248fa10c2

-- Delete transactions
DELETE FROM public.transactions 
WHERE user_id IN ('fdc6cdb6-9478-4225-b450-93bfbaaf499a', 'a46d7924-c398-4b18-a795-73e248fa10c2');

-- Delete investment performance records
DELETE FROM public.investment_performance 
WHERE investment_id IN (
  SELECT id FROM public.investments 
  WHERE user_id IN ('fdc6cdb6-9478-4225-b450-93bfbaaf499a', 'a46d7924-c398-4b18-a795-73e248fa10c2')
);

-- Delete investments
DELETE FROM public.investments 
WHERE user_id IN ('fdc6cdb6-9478-4225-b450-93bfbaaf499a', 'a46d7924-c398-4b18-a795-73e248fa10c2');

-- Delete investment goals
DELETE FROM public.investment_goals 
WHERE user_id IN ('fdc6cdb6-9478-4225-b450-93bfbaaf499a', 'a46d7924-c398-4b18-a795-73e248fa10c2');

-- Delete investment types
DELETE FROM public.investment_types 
WHERE user_id IN ('fdc6cdb6-9478-4225-b450-93bfbaaf499a', 'a46d7924-c398-4b18-a795-73e248fa10c2');

-- Delete accounts
DELETE FROM public.accounts 
WHERE user_id IN ('fdc6cdb6-9478-4225-b450-93bfbaaf499a', 'a46d7924-c398-4b18-a795-73e248fa10c2');

-- Delete cards
DELETE FROM public.cards 
WHERE user_id IN ('fdc6cdb6-9478-4225-b450-93bfbaaf499a', 'a46d7924-c398-4b18-a795-73e248fa10c2');

-- Delete mileage history
DELETE FROM public.mileage_history 
WHERE user_id IN ('fdc6cdb6-9478-4225-b450-93bfbaaf499a', 'a46d7924-c398-4b18-a795-73e248fa10c2');

-- Delete mileage goals
DELETE FROM public.mileage_goals 
WHERE user_id IN ('fdc6cdb6-9478-4225-b450-93bfbaaf499a', 'a46d7924-c398-4b18-a795-73e248fa10c2');

-- Delete card mileage rules
DELETE FROM public.card_mileage_rules 
WHERE user_id IN ('fdc6cdb6-9478-4225-b450-93bfbaaf499a', 'a46d7924-c398-4b18-a795-73e248fa10c2');

-- Delete recurring expenses
DELETE FROM public.recurring_expenses 
WHERE user_id IN ('fdc6cdb6-9478-4225-b450-93bfbaaf499a', 'a46d7924-c398-4b18-a795-73e248fa10c2');

-- Delete subcategories
DELETE FROM public.subcategories 
WHERE user_id IN ('fdc6cdb6-9478-4225-b450-93bfbaaf499a', 'a46d7924-c398-4b18-a795-73e248fa10c2');

-- Delete custom categories
DELETE FROM public.categories 
WHERE user_id IN ('fdc6cdb6-9478-4225-b450-93bfbaaf499a', 'a46d7924-c398-4b18-a795-73e248fa10c2');