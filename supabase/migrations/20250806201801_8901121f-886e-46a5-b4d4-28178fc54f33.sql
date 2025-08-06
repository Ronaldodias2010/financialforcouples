-- Transfer admin to premium users
UPDATE public.subscribers 
SET subscribed = true,
    subscription_tier = 'premium',
    subscription_end = '2025-12-31 23:59:59+00'
WHERE email = 'admin@arxexperience.com.br';

-- Also update the profile to match
UPDATE public.profiles 
SET subscribed = true,
    subscription_tier = 'premium'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'admin@arxexperience.com.br'
);