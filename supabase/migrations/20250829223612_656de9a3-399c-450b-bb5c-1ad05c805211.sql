-- Fix the remaining functions with missing search_path

-- Fix is_admin_user function
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email IN ('admin@arxexperience.com.br', 'admin@example.com')
  );
$function$;

-- Fix normalize_text_simple function
CREATE OR REPLACE FUNCTION public.normalize_text_simple(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $function$
  SELECT lower(regexp_replace(trim(coalesce(input, '')), '\s+', ' ', 'g'));
$function$;