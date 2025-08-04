-- Clean up test users data
-- First, get the user IDs for the emails we want to delete
DO $$
DECLARE
    rona_user_id uuid;
    priscila_user_id uuid;
BEGIN
    -- Get user IDs from auth.users
    SELECT id INTO rona_user_id FROM auth.users WHERE email = 'ronadias2010@gmail.com';
    SELECT id INTO priscila_user_id FROM auth.users WHERE email = 'priscila.serone@gmail.com';
    
    -- Delete from all related tables for both users
    IF rona_user_id IS NOT NULL THEN
        DELETE FROM public.transactions WHERE user_id = rona_user_id;
        DELETE FROM public.mileage_history WHERE user_id = rona_user_id;
        DELETE FROM public.mileage_goals WHERE user_id = rona_user_id;
        DELETE FROM public.investment_performance WHERE investment_id IN (SELECT id FROM public.investments WHERE user_id = rona_user_id);
        DELETE FROM public.investments WHERE user_id = rona_user_id;
        DELETE FROM public.investment_goals WHERE user_id = rona_user_id;
        DELETE FROM public.recurring_expenses WHERE user_id = rona_user_id;
        DELETE FROM public.card_mileage_rules WHERE user_id = rona_user_id;
        DELETE FROM public.cards WHERE user_id = rona_user_id;
        DELETE FROM public.accounts WHERE user_id = rona_user_id;
        DELETE FROM public.subcategories WHERE user_id = rona_user_id;
        DELETE FROM public.categories WHERE user_id = rona_user_id;
        DELETE FROM public.user_couples WHERE user1_id = rona_user_id OR user2_id = rona_user_id;
        DELETE FROM public.user_invites WHERE inviter_user_id = rona_user_id;
        DELETE FROM public.manual_premium_access WHERE user_id = rona_user_id;
        DELETE FROM public.subscribers WHERE user_id = rona_user_id;
        DELETE FROM public.profiles WHERE user_id = rona_user_id;
    END IF;
    
    IF priscila_user_id IS NOT NULL THEN
        DELETE FROM public.transactions WHERE user_id = priscila_user_id;
        DELETE FROM public.mileage_history WHERE user_id = priscila_user_id;
        DELETE FROM public.mileage_goals WHERE user_id = priscila_user_id;
        DELETE FROM public.investment_performance WHERE investment_id IN (SELECT id FROM public.investments WHERE user_id = priscila_user_id);
        DELETE FROM public.investments WHERE user_id = priscila_user_id;
        DELETE FROM public.investment_goals WHERE user_id = priscila_user_id;
        DELETE FROM public.recurring_expenses WHERE user_id = priscila_user_id;
        DELETE FROM public.card_mileage_rules WHERE user_id = priscila_user_id;
        DELETE FROM public.cards WHERE user_id = priscila_user_id;
        DELETE FROM public.accounts WHERE user_id = priscila_user_id;
        DELETE FROM public.subcategories WHERE user_id = priscila_user_id;
        DELETE FROM public.categories WHERE user_id = priscila_user_id;
        DELETE FROM public.user_couples WHERE user1_id = priscila_user_id OR user2_id = priscila_user_id;
        DELETE FROM public.user_invites WHERE inviter_user_id = priscila_user_id;
        DELETE FROM public.manual_premium_access WHERE user_id = priscila_user_id;
        DELETE FROM public.subscribers WHERE user_id = priscila_user_id;
        DELETE FROM public.profiles WHERE user_id = priscila_user_id;
    END IF;
END $$;

-- Delete the users from auth.users (this will cascade delete any remaining references)
DELETE FROM auth.users 
WHERE email IN ('ronadias2010@gmail.com', 'priscila.serone@gmail.com');