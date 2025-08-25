-- 1) Fix function: grant_shared_premium_to_partner
-- IMPORTANT: This function is triggered on subscribers table, so NEW refers to subscribers row
CREATE OR REPLACE FUNCTION public.grant_shared_premium_to_partner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
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

  -- Grant shared premium to partner (NEW refers to subscribers table)
  INSERT INTO public.subscribers AS s
    (user_id, email, subscribed, subscription_tier, subscription_end, updated_at)
  VALUES
    (
      partner_id,
      (SELECT u.email FROM auth.users u WHERE u.id = partner_id),
      TRUE,
      'premium',
      NEW.subscription_end,  -- NEW is from subscribers table
      now()
    )
  ON CONFLICT (user_id) DO UPDATE
  SET
    subscribed = TRUE,
    subscription_tier = 'premium',
    subscription_end = GREATEST(COALESCE(s.subscription_end, NEW.subscription_end), NEW.subscription_end),
    updated_at = now();

  -- Also sync the partner's profile table
  UPDATE public.profiles 
  SET 
    subscription_tier = 'premium',
    subscribed = TRUE,
    updated_at = now()
  WHERE user_id = partner_id;

  RETURN NEW;
END;
$$;

-- 2) One-time sync: subscribers -> profiles for all inconsistencies
UPDATE public.profiles p
SET 
  subscription_tier = s.subscription_tier,
  subscribed = s.subscribed,
  updated_at = now()
FROM public.subscribers s
WHERE p.user_id = s.user_id
  AND (
    p.subscription_tier IS DISTINCT FROM s.subscription_tier OR
    p.subscribed IS DISTINCT FROM s.subscribed
  );