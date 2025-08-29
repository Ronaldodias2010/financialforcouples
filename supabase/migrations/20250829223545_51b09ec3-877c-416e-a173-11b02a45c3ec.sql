-- Fix the remaining functions missing search_path

-- Check which functions still need fixing by querying the database
SELECT 
    p.proname as function_name,
    n.nspname as schema_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.prosecdef = true  -- SECURITY DEFINER functions
  AND NOT EXISTS (
    SELECT 1 
    FROM pg_proc_config pc 
    WHERE pc.proconfig @> ARRAY['search_path=public']
      AND pc.oid = p.oid
  )
ORDER BY p.proname;