-- Fix database category and tag issues

-- First, let's fix the duplicate "Receita Extraordinária" entries by keeping only one
DELETE FROM public.default_categories 
WHERE name_pt = 'Receita Extraordinária' 
  AND id NOT IN (
    SELECT MIN(id) 
    FROM public.default_categories 
    WHERE name_pt = 'Receita Extraordinária'
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

-- Ensure all default categories have proper tag relations
-- This will help system tags display correctly for all categories
DO $$
DECLARE
  default_cat RECORD;
  tag_rec RECORD;
  relation_exists BOOLEAN;
BEGIN
  -- For each default category, ensure it has at least some basic tag relations
  FOR default_cat IN 
    SELECT id, name_pt, category_type FROM public.default_categories
  LOOP
    -- Check if this category already has tag relations
    SELECT EXISTS(
      SELECT 1 FROM public.category_tag_relations ctr
      WHERE EXISTS(
        SELECT 1 FROM public.categories c 
        WHERE c.default_category_id = default_cat.id
      )
    ) INTO relation_exists;
    
    -- If no relations exist, create some basic ones based on category type
    IF NOT relation_exists THEN
      -- Add some common tags for each category type
      IF default_cat.category_type = 'expense' THEN
        -- Add basic expense tags if they exist
        FOR tag_rec IN 
          SELECT id FROM public.category_tags ct
          WHERE ct.name_pt IN ('Gastos Essenciais', 'Gastos Variáveis', 'Compras', 'Serviços')
          LIMIT 3
        LOOP
          INSERT INTO public.category_tag_relations (category_id, tag_id, is_active)
          SELECT c.id, tag_rec.id, true
          FROM public.categories c
          WHERE c.default_category_id = default_cat.id
          ON CONFLICT DO NOTHING;
        END LOOP;
      ELSIF default_cat.category_type = 'income' THEN
        -- Add basic income tags if they exist
        FOR tag_rec IN 
          SELECT id FROM public.category_tags ct
          WHERE ct.name_pt IN ('Renda Fixa', 'Renda Variável', 'Receitas', 'Salário')
          LIMIT 3
        LOOP
          INSERT INTO public.category_tag_relations (category_id, tag_id, is_active)
          SELECT c.id, tag_rec.id, true
          FROM public.categories c
          WHERE c.default_category_id = default_cat.id
          ON CONFLICT DO NOTHING;
        END LOOP;
      END IF;
    END IF;
  END LOOP;
END $$;