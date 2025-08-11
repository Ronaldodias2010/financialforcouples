-- Grant shared premium to partner when a user becomes premium
-- Safely create trigger function and trigger

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION public.grant_shared_premium_to_partner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  couple_record RECORD;
  partner_id UUID;
BEGIN
  -- Only proceed if the user is actually premium and subscribed
  IF NEW.subscribed IS DISTINCT FROM TRUE OR NEW.subscription_tier IS DISTINCT FROM 'premium' THEN
    RETURN NEW;
  END IF;

  -- Find active couple for this user
  SELECT uc.user1_id, uc.user2_id
    INTO couple_record
  FROM public.user_couples uc
  WHERE (uc.user1_id = NEW.user_id OR uc.user2_id = NEW.user_id)
    AND uc.status = 'active'
  ORDER BY COALESCE(uc.updated_at, uc.created_at) DESC
  LIMIT 1;

  IF couple_record IS NULL THEN
    RETURN NEW;
  END IF;

  partner_id := CASE WHEN couple_record.user1_id = NEW.user_id THEN couple_record.user2_id ELSE couple_record.user1_id END;

  -- Upsert premium status for partner without touching Stripe fields
  -- Assumes a unique constraint exists on subscribers(user_id)
  INSERT INTO public.subscribers AS s
    (user_id, email, subscribed, subscription_tier, subscription_end, updated_at)
  VALUES
    (
      partner_id,
      COALESCE(
        (SELECT p.email FROM public.profiles p WHERE p.user_id = partner_id),
        (SELECT u.email FROM auth.users u WHERE u.id = partner_id)
      ),
      TRUE,
      'premium',
      NEW.subscription_end,
      now()
    )
  ON CONFLICT (user_id) DO UPDATE
  SET
    subscribed = TRUE,
    subscription_tier = 'premium',
    subscription_end = GREATEST(COALESCE(s.subscription_end, NEW.subscription_end), NEW.subscription_end),
    updated_at = now();

  RETURN NEW;
END;
$$;

-- Drop and recreate trigger to ensure latest definition is used
DROP TRIGGER IF EXISTS trg_grant_shared_premium_to_partner ON public.subscribers;
CREATE TRIGGER trg_grant_shared_premium_to_partner
AFTER INSERT OR UPDATE OF subscribed, subscription_tier, subscription_end ON public.subscribers
FOR EACH ROW
WHEN (NEW.subscribed = TRUE AND NEW.subscription_tier = 'premium')
EXECUTE FUNCTION public.grant_shared_premium_to_partner();

-- Optional: comments for maintainers
COMMENT ON FUNCTION public.grant_shared_premium_to_partner() IS 'When a user becomes premium, automatically grants premium to their active partner (if any).';