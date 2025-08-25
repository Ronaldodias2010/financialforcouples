-- Sync subscription data from subscribers table to profiles table
-- The subscribers table is the source of truth as it's updated by Stripe functions

UPDATE profiles 
SET 
  subscription_tier = subscribers.subscription_tier,
  subscribed = subscribers.subscribed,
  updated_at = now()
FROM subscribers 
WHERE profiles.user_id = subscribers.user_id
  AND (profiles.subscription_tier != subscribers.subscription_tier 
       OR profiles.subscribed != subscribers.subscribed);

-- Add a comment for future reference
COMMENT ON TABLE profiles IS 'User profiles table. Subscription data should be synced from subscribers table which is the source of truth.';
COMMENT ON TABLE subscribers IS 'Source of truth for subscription data, updated by Stripe edge functions.';