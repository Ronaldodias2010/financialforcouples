-- Fix database category and tag issues (corrected)

-- First, let's fix the duplicate "Receita Extraordinária" entries by keeping only one
WITH duplicate_entries AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM public.default_categories 
  WHERE name_pt = 'Receita Extraordinária'
)
DELETE FROM public.default_categories 
WHERE id IN (
  SELECT id FROM duplicate_entries WHERE rn > 1
);

-- Link existing user categories to default categories based on normalized names
UPDATE public.categories c
SET default_category_id = (
  SELECT dc.id 
  FROM public.default_categories dc
  WHERE dc.category_type = c.category_type
    AND public.normalize_text_simple(dc.name_pt) = public.normalize_text_simple(c.name)
  LIMIT 1
)
WHERE c.default_category_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.default_categories dc
    WHERE dc.category_type = c.category_type
      AND public.normalize_text_simple(dc.name_pt) = public.normalize_text_simple(c.name)
  );