-- Fix security warning: set search_path on function
CREATE OR REPLACE FUNCTION validate_subcategory_not_category()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if subcategory name matches any category name (case-insensitive)
  IF EXISTS (
    SELECT 1 FROM public.categories 
    WHERE deleted_at IS NULL
      AND LOWER(TRIM(name)) = LOWER(TRIM(NEW.name))
  ) THEN
    RAISE EXCEPTION 'Subcategory name cannot match an existing category name: %', NEW.name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;