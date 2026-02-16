
-- 1. Remove duplicate trigger (keep only tr_validate_subcategory_not_category)
DROP TRIGGER IF EXISTS validate_subcategory_not_category_trigger ON public.subcategories;

-- 2. Fix the validate_subcategory_not_category function to filter by user_id
CREATE OR REPLACE FUNCTION public.validate_subcategory_not_category()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Check if subcategory name matches any category name FOR THIS USER (case-insensitive)
  IF EXISTS (
    SELECT 1 FROM public.categories 
    WHERE deleted_at IS NULL
      AND user_id = NEW.user_id
      AND LOWER(TRIM(name)) = LOWER(TRIM(NEW.name))
  ) THEN
    RAISE EXCEPTION 'Subcategory name cannot match an existing category name: %', NEW.name;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Clean up duplicate farmácia tags (keep the most complete one: 4701a325)
DELETE FROM public.category_tag_relations 
WHERE tag_id IN (
  'c668432d-9c37-4970-b008-ed41ba4cbcff',
  'd78e1c4a-b8c1-47c1-98f8-7d5bbc061d64',
  'e998b9ef-47ce-4702-b229-0e49176e99f1'
);

DELETE FROM public.category_tags 
WHERE id IN (
  'c668432d-9c37-4970-b008-ed41ba4cbcff',
  'd78e1c4a-b8c1-47c1-98f8-7d5bbc061d64',
  'e998b9ef-47ce-4702-b229-0e49176e99f1'
);
