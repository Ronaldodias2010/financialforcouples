-- Remove redundant tables that are empty and unused
DROP TABLE IF EXISTS public.premium_expiration_emails CASCADE;
DROP TABLE IF EXISTS public.promo_code_usage CASCADE;