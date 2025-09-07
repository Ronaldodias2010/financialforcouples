-- Update the function to add missing categories instead of checking if any exist
CREATE OR REPLACE FUNCTION public.create_default_categories_for_user(user_id uuid, user_language text DEFAULT 'pt'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  default_cat RECORD;
  category_name TEXT;
  existing_category_id UUID;
BEGIN
  -- Loop through all default categories
  FOR default_cat IN 
    SELECT 
      id, name_pt, name_en, name_es, color, icon, category_type, description_pt, description_en, description_es
    FROM public.default_categories 
  LOOP
    -- Select category name based on language
    category_name := CASE 
      WHEN user_language = 'en' THEN default_cat.name_en
      WHEN user_language = 'es' THEN default_cat.name_es
      ELSE default_cat.name_pt
    END;

    -- Check if user already has this category (by default_category_id or normalized name)
    SELECT id INTO existing_category_id
    FROM public.categories 
    WHERE user_id = create_default_categories_for_user.user_id 
      AND (
        default_category_id = default_cat.id 
        OR (
          category_type = default_cat.category_type 
          AND public.normalize_text_simple(name) = public.normalize_text_simple(category_name)
        )
      )
    LIMIT 1;

    -- If category doesn't exist, create it
    IF existing_category_id IS NULL THEN
      INSERT INTO public.categories (
        name, color, icon, category_type, owner_user, user_id, default_category_id, description
      ) VALUES (
        category_name,
        default_cat.color,
        default_cat.icon,
        default_cat.category_type,
        'user1',
        create_default_categories_for_user.user_id,
        default_cat.id,
        CASE 
          WHEN user_language = 'en' THEN default_cat.description_en
          WHEN user_language = 'es' THEN default_cat.description_es
          ELSE default_cat.description_pt
        END
      );
    ELSE
      -- Update existing category to link with default_category_id if not set
      UPDATE public.categories 
      SET default_category_id = default_cat.id,
          description = CASE 
            WHEN user_language = 'en' THEN default_cat.description_en
            WHEN user_language = 'es' THEN default_cat.description_es
            ELSE default_cat.description_pt
          END,
          updated_at = now()
      WHERE id = existing_category_id 
        AND default_category_id IS NULL;
    END IF;
  END LOOP;
END;
$function$;

-- Clean up duplicate categories (keep the one with default_category_id or the first one)
WITH ranked_categories AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, category_type, public.normalize_text_simple(name) 
      ORDER BY 
        CASE WHEN default_category_id IS NOT NULL THEN 1 ELSE 2 END,
        created_at ASC
    ) as rn
  FROM public.categories
)
DELETE FROM public.categories 
WHERE id IN (
  SELECT id FROM ranked_categories WHERE rn > 1
);

-- Run the updated function for all existing users
DO $$
DECLARE
  user_record RECORD;
  user_lang TEXT;
BEGIN
  FOR user_record IN 
    SELECT DISTINCT user_id FROM public.categories
  LOOP
    -- Get user language preference
    SELECT 
      COALESCE(
        CASE 
          WHEN raw_user_meta_data->>'preferred_language' IS NOT NULL 
          THEN raw_user_meta_data->>'preferred_language'
          ELSE 'pt'
        END, 'pt'
      ) INTO user_lang
    FROM auth.users 
    WHERE id = user_record.user_id;
    
    -- Create missing default categories
    PERFORM public.create_default_categories_for_user(user_record.user_id, COALESCE(user_lang, 'pt'));
  END LOOP;
END;
$$;