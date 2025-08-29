-- Fix the function with immutable that might still have issues
-- Let me try to find the specific functions causing issues

-- Update the fix_security_definer_views function  
CREATE OR REPLACE FUNCTION public.fix_security_definer_views()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  view_record RECORD;
  new_definition TEXT;
BEGIN
  -- Only admins can run this
  IF NOT public.is_admin_user() THEN
    RETURN 'Access denied';
  END IF;

  -- Find views with SECURITY DEFINER and fix them
  FOR view_record IN 
    SELECT schemaname, viewname, definition 
    FROM pg_views 
    WHERE schemaname = 'public' 
      AND definition ILIKE '%security definer%'
  LOOP
    -- Remove SECURITY DEFINER from definition
    new_definition := REPLACE(
      REPLACE(view_record.definition, 'SECURITY DEFINER', ''),
      '  ', ' '  -- Clean up extra spaces
    );
    
    -- Drop and recreate view
    EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', 
                   view_record.schemaname, view_record.viewname);
    EXECUTE new_definition;
  END LOOP;

  RETURN 'Fixed SECURITY DEFINER views';
END;
$function$;

-- Update check_manual_premium_expiration function
CREATE OR REPLACE FUNCTION public.check_manual_premium_expiration()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update expired manual premium access
  UPDATE public.manual_premium_access
  SET status = 'expired',
      updated_at = now()
  WHERE status = 'active'
    AND end_date < CURRENT_DATE;
END;
$function$;