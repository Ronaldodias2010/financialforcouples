-- Find and fix Security Definer Views
-- First check for views with SECURITY DEFINER
SELECT schemaname, viewname, definition 
FROM pg_views 
WHERE schemaname = 'public' 
  AND definition ILIKE '%security definer%';