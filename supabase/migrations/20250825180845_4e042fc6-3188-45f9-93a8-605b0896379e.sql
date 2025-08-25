-- Sync inconsistent data: subscribers (source of truth) -> profiles
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