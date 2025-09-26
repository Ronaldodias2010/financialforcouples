-- Fix Security Definer Views by converting them to regular views
-- This addresses the critical security error

-- List all views with SECURITY DEFINER to identify them
SELECT schemaname, viewname, definition 
FROM pg_views 
WHERE schemaname = 'public' 
  AND definition ILIKE '%security definer%';

-- Fix views by removing SECURITY DEFINER property
-- We'll recreate them as regular views to maintain functionality while fixing security issues

-- The fix_security_definer_views function should handle this automatically
SELECT public.fix_security_definer_views();