-- Fix search_path for the function
ALTER FUNCTION public.update_webauthn_credentials_updated_at() SET search_path = '';