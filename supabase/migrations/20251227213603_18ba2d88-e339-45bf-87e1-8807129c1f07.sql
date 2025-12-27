-- Delete all remaining data for user brunojrvieira@gmail.com (e0cd7668-3211-4023-961f-9c497631f7b0)
-- This user has no subscription (essential) and can be deleted

-- Delete accounts
DELETE FROM public.accounts WHERE user_id = 'e0cd7668-3211-4023-961f-9c497631f7b0';

-- Delete categories
DELETE FROM public.categories WHERE user_id = 'e0cd7668-3211-4023-961f-9c497631f7b0';

-- Delete any other potential data
DELETE FROM public.user_activity_tracking WHERE user_id = 'e0cd7668-3211-4023-961f-9c497631f7b0';
DELETE FROM public.ai_history WHERE user_id = 'e0cd7668-3211-4023-961f-9c497631f7b0';
DELETE FROM public.ai_usage_tracking WHERE user_id = 'e0cd7668-3211-4023-961f-9c497631f7b0';