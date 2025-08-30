-- Function to sync manual premium access to subscribers table
CREATE OR REPLACE FUNCTION public.sync_manual_premium_to_subscribers()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Handle INSERT and UPDATE of active manual premium access
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status = 'active') THEN
    -- Get user email from auth.users if not provided
    INSERT INTO public.subscribers (user_id, email, subscribed, subscription_tier, subscription_end, updated_at)
    VALUES (
      NEW.user_id,
      NEW.email,
      true,
      'premium',
      NEW.end_date,
      now()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      subscribed = true,
      subscription_tier = 'premium',
      subscription_end = GREATEST(COALESCE(subscribers.subscription_end, NEW.end_date), NEW.end_date),
      updated_at = now();

    -- Also update profiles table
    UPDATE public.profiles 
    SET 
      subscription_tier = 'premium',
      subscribed = true,
      updated_at = now()
    WHERE user_id = NEW.user_id;

  -- Handle UPDATE to expired/revoked status
  ELSIF TG_OP = 'UPDATE' AND NEW.status IN ('expired', 'revoked') THEN
    -- Check if user has any other active manual access or valid subscription
    IF NOT EXISTS (
      SELECT 1 FROM public.manual_premium_access 
      WHERE user_id = NEW.user_id 
        AND status = 'active' 
        AND end_date >= CURRENT_DATE 
        AND id != NEW.id
    ) THEN
      -- Remove premium access if no other active manual access exists
      UPDATE public.subscribers 
      SET 
        subscribed = false,
        subscription_tier = 'essential',
        subscription_end = null,
        updated_at = now()
      WHERE user_id = NEW.user_id 
        AND NOT EXISTS (
          -- Don't remove if they have a valid Stripe subscription
          SELECT 1 FROM public.subscribers s2 
          WHERE s2.user_id = NEW.user_id 
            AND s2.stripe_customer_id IS NOT NULL 
            AND s2.subscription_end > CURRENT_DATE
        );

      -- Also update profiles table
      UPDATE public.profiles 
      SET 
        subscription_tier = 'essential',
        subscribed = false,
        updated_at = now()
      WHERE user_id = NEW.user_id;
    END IF;

  -- Handle DELETE
  ELSIF TG_OP = 'DELETE' THEN
    -- Check if user has any other active manual access
    IF NOT EXISTS (
      SELECT 1 FROM public.manual_premium_access 
      WHERE user_id = OLD.user_id 
        AND status = 'active' 
        AND end_date >= CURRENT_DATE
    ) THEN
      -- Remove premium access if no other active manual access exists
      UPDATE public.subscribers 
      SET 
        subscribed = false,
        subscription_tier = 'essential',
        subscription_end = null,
        updated_at = now()
      WHERE user_id = OLD.user_id 
        AND NOT EXISTS (
          -- Don't remove if they have a valid Stripe subscription
          SELECT 1 FROM public.subscribers s2 
          WHERE s2.user_id = OLD.user_id 
            AND s2.stripe_customer_id IS NOT NULL 
            AND s2.subscription_end > CURRENT_DATE
        );

      -- Also update profiles table
      UPDATE public.profiles 
      SET 
        subscription_tier = 'essential',
        subscribed = false,
        updated_at = now()
      WHERE user_id = OLD.user_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for manual premium access synchronization
DROP TRIGGER IF EXISTS sync_manual_premium_access_trigger ON public.manual_premium_access;
CREATE TRIGGER sync_manual_premium_access_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.manual_premium_access
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_manual_premium_to_subscribers();

-- Sync existing active manual premium access records
INSERT INTO public.subscribers (user_id, email, subscribed, subscription_tier, subscription_end, updated_at)
SELECT 
  mpa.user_id,
  mpa.email,
  true,
  'premium',
  mpa.end_date,
  now()
FROM public.manual_premium_access mpa
WHERE mpa.status = 'active' 
  AND mpa.end_date >= CURRENT_DATE
ON CONFLICT (user_id) 
DO UPDATE SET
  subscribed = true,
  subscription_tier = 'premium',
  subscription_end = GREATEST(COALESCE(subscribers.subscription_end, EXCLUDED.subscription_end), EXCLUDED.subscription_end),
  updated_at = now();