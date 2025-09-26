-- Remover a função com todas suas dependências usando CASCADE
DROP FUNCTION IF EXISTS public.grant_shared_premium_to_partner() CASCADE;

-- Agora fazer a atualização dos dados sem interferência do trigger
UPDATE public.subscribers 
SET 
  subscribed = true,
  subscription_tier = 'premium',
  subscription_end = '2025-10-26 01:46:58+00'::timestamp with time zone,
  updated_at = now()
WHERE email IN ('ronadias2010@gmail.com', 'priscila.serone@gmail.com');

-- Atualizar os perfis também
UPDATE public.profiles 
SET 
  subscribed = true,
  subscription_tier = 'premium',
  updated_at = now()
WHERE user_id IN (
  SELECT user_id FROM public.subscribers 
  WHERE email IN ('ronadias2010@gmail.com', 'priscila.serone@gmail.com')
);