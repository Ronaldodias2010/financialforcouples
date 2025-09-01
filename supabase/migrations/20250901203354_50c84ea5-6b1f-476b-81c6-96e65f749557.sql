-- Fix SECURITY DEFINER views by calling the existing function
SELECT public.fix_security_definer_views();