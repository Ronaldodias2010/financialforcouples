-- Drop and recreate the function with improved logic
CREATE OR REPLACE FUNCTION public.check_manual_premium_expiration()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  expired_user RECORD;
  has_other_manual_access BOOLEAN;
  has_stripe_subscription BOOLEAN;
BEGIN
  -- 1. Mark expired records as 'expired'
  UPDATE public.manual_premium_access
  SET status = 'expired', updated_at = now()
  WHERE status = 'active' AND end_date < CURRENT_DATE;
  
  -- 2. For each user with recently expired access, check if they still have access
  FOR expired_user IN 
    SELECT DISTINCT user_id, email FROM public.manual_premium_access
    WHERE status = 'expired' 
      AND end_date >= (CURRENT_DATE - INTERVAL '7 days')::date
      AND end_date < CURRENT_DATE
  LOOP
    -- Check if user has another active manual access
    SELECT EXISTS (
      SELECT 1 FROM public.manual_premium_access
      WHERE user_id = expired_user.user_id 
        AND status = 'active'
        AND start_date <= CURRENT_DATE 
        AND end_date >= CURRENT_DATE
    ) INTO has_other_manual_access;
    
    -- Check if user has active Stripe subscription
    SELECT EXISTS (
      SELECT 1 FROM public.subscribers
      WHERE user_id = expired_user.user_id 
        AND subscribed = true
        AND stripe_customer_id IS NOT NULL
        AND (subscription_end IS NULL OR subscription_end > CURRENT_DATE)
    ) INTO has_stripe_subscription;
    
    -- Only downgrade if no other access exists
    IF NOT has_other_manual_access AND NOT has_stripe_subscription THEN
      -- Downgrade to essential in subscribers
      UPDATE public.subscribers
      SET subscribed = false, 
          subscription_tier = 'essential', 
          updated_at = now()
      WHERE user_id = expired_user.user_id;
      
      -- Downgrade to essential in profiles
      UPDATE public.profiles
      SET subscribed = false, 
          subscription_tier = 'essential',
          updated_at = now()
      WHERE user_id = expired_user.user_id;
      
      RAISE NOTICE 'User % downgraded to essential (no active access)', expired_user.email;
    ELSE
      RAISE NOTICE 'User % still has active access (manual: %, stripe: %)', 
        expired_user.email, has_other_manual_access, has_stripe_subscription;
    END IF;
  END LOOP;
END;
$function$;

-- Also run an immediate update for already expired records
UPDATE public.manual_premium_access
SET status = 'expired', updated_at = now()
WHERE status = 'active' AND end_date < CURRENT_DATE;