-- Clean database but keep main admin user
-- Delete all data from tables in correct order to respect foreign keys

-- Delete mileage history first
DELETE FROM public.mileage_history;

-- Delete investment performance
DELETE FROM public.investment_performance;

-- Delete transactions
DELETE FROM public.transactions;

-- Delete recurring expenses
DELETE FROM public.recurring_expenses;

-- Delete investments
DELETE FROM public.investments;

-- Delete cards
DELETE FROM public.cards;

-- Delete accounts
DELETE FROM public.accounts;

-- Delete categories and subcategories
DELETE FROM public.subcategories;
DELETE FROM public.categories;

-- Delete goals
DELETE FROM public.mileage_goals;
DELETE FROM public.investment_goals;

-- Delete mileage rules
DELETE FROM public.card_mileage_rules;

-- Delete user couples
DELETE FROM public.user_couples;

-- Delete user invites
DELETE FROM public.user_invites;

-- Delete manual premium access
DELETE FROM public.manual_premium_access;

-- Delete subscribers except admin
DELETE FROM public.subscribers WHERE email != 'admin@arxexperience.com.br';

-- Clean profiles data for admin but keep the record
UPDATE public.profiles 
SET second_user_email = NULL, 
    second_user_name = NULL,
    preferred_currency = 'BRL',
    subscription_tier = 'essential',
    subscribed = false
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'admin@arxexperience.com.br'
);

-- Delete all other profiles except admin
DELETE FROM public.profiles 
WHERE user_id != (
  SELECT id FROM auth.users WHERE email = 'admin@arxexperience.com.br'
);

-- Delete stripe metrics cache
DELETE FROM public.stripe_metrics_cache;