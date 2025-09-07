-- Step 1: Create normalization function for consistent text comparison
CREATE OR REPLACE FUNCTION public.normalize_category_name(input_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $function$
  SELECT lower(trim(regexp_replace(coalesce(input_name, ''), '\s+', ' ', 'g')));
$function$;

-- Step 2: Clean up "Investimento" vs "Investimentos" duplicates
-- First, find and merge all "Investimento" categories to "Investimentos"
DO $$
DECLARE
  user_record RECORD;
  investimento_cat_id UUID;
  investimentos_cat_id UUID;
BEGIN
  -- For each user, check if they have both "Investimento" and "Investimentos"
  FOR user_record IN 
    SELECT DISTINCT user_id 
    FROM public.categories 
    WHERE normalize_category_name(name) IN ('investimento', 'investimentos')
  LOOP
    -- Find "Investimento" category
    SELECT id INTO investimento_cat_id
    FROM public.categories
    WHERE user_id = user_record.user_id 
      AND normalize_category_name(name) = 'investimento'
    LIMIT 1;
    
    -- Find "Investimentos" category  
    SELECT id INTO investimentos_cat_id
    FROM public.categories
    WHERE user_id = user_record.user_id 
      AND normalize_category_name(name) = 'investimentos'
    LIMIT 1;
    
    -- If user has both, merge them
    IF investimento_cat_id IS NOT NULL AND investimentos_cat_id IS NOT NULL THEN
      -- Update all references from "Investimento" to "Investimentos"
      UPDATE public.transactions 
      SET category_id = investimentos_cat_id 
      WHERE category_id = investimento_cat_id;
      
      UPDATE public.manual_future_expenses 
      SET category_id = investimentos_cat_id 
      WHERE category_id = investimento_cat_id;
      
      UPDATE public.future_expense_payments 
      SET category_id = investimentos_cat_id 
      WHERE category_id = investimento_cat_id;
      
      -- Delete the duplicate "Investimento" category
      DELETE FROM public.categories WHERE id = investimento_cat_id;
      
    -- If user only has "Investimento", rename it to "Investimentos"
    ELSIF investimento_cat_id IS NOT NULL AND investimentos_cat_id IS NULL THEN
      UPDATE public.categories 
      SET name = 'Investimentos' 
      WHERE id = investimento_cat_id;
    END IF;
  END LOOP;
END $$;

-- Step 3: Link user categories to default categories for proper tag display
-- Update categories with their corresponding default_category_id
UPDATE public.categories 
SET default_category_id = dc.id
FROM public.default_categories dc
WHERE categories.default_category_id IS NULL
  AND normalize_category_name(categories.name) = normalize_category_name(dc.name_pt)
  AND categories.category_type = dc.category_type;

-- Step 4: Create unique constraints to prevent future duplicates
-- For categories: prevent duplicate normalized names per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_unique_normalized_name 
ON public.categories (user_id, normalize_category_name(name), category_type);

-- For user category tags: prevent duplicate normalized tags per category per user  
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_category_tags_unique_normalized
ON public.user_category_tags (user_id, category_id, normalize_category_name(tag_name));

-- For user category tag exclusions: prevent duplicate exclusions
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_tag_exclusions_unique
ON public.user_category_tag_exclusions (user_id, category_id, system_tag_id);

-- Step 5: Add trigger to prevent duplicate category creation
CREATE OR REPLACE FUNCTION public.prevent_duplicate_category_names()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Check for existing category with same normalized name, type, and user
  IF EXISTS (
    SELECT 1 FROM public.categories
    WHERE user_id = NEW.user_id 
      AND category_type = NEW.category_type
      AND normalize_category_name(name) = normalize_category_name(NEW.name)
      AND (TG_OP = 'INSERT' OR id != NEW.id)
  ) THEN
    RAISE EXCEPTION 'duplicate_category_name' 
    USING HINT = 'Já existe uma categoria com este nome para este usuário.';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Apply the trigger
DROP TRIGGER IF EXISTS prevent_duplicate_category_names_trigger ON public.categories;
CREATE TRIGGER prevent_duplicate_category_names_trigger
  BEFORE INSERT OR UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_duplicate_category_names();