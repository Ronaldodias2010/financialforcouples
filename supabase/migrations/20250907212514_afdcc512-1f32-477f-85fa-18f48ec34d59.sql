-- Ensure all existing users have the new "Veículos & Financiamentos" category
-- This will create the category for users who don't have it yet
DO $$
DECLARE
  user_record RECORD;
  user_lang TEXT;
  category_name TEXT;
  existing_category_id UUID;
  vehicles_default_id UUID;
BEGIN
  -- Get the default category ID for "Veículos & Financiamentos"
  SELECT id INTO vehicles_default_id 
  FROM public.default_categories 
  WHERE name_pt = 'Veículos & Financiamentos';
  
  -- Loop through all users who have profiles
  FOR user_record IN 
    SELECT DISTINCT p.user_id 
    FROM public.profiles p 
  LOOP
    -- Try to get user language preference
    SELECT 
      CASE 
        WHEN raw_user_meta_data->>'preferred_language' IS NOT NULL 
        THEN raw_user_meta_data->>'preferred_language'
        ELSE 'pt'
      END INTO user_lang
    FROM auth.users 
    WHERE id = user_record.user_id;
    
    -- Set category name based on language
    category_name := CASE 
      WHEN user_lang = 'en' THEN 'Vehicles & Financing'
      WHEN user_lang = 'es' THEN 'Vehículos y Financiación'
      ELSE 'Veículos & Financiamentos'
    END;
    
    -- Check if user already has this category
    SELECT id INTO existing_category_id
    FROM public.categories 
    WHERE user_id = user_record.user_id 
      AND (
        default_category_id = vehicles_default_id 
        OR (
          category_type = 'expense' 
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
        '#DC2626',
        'car',
        'expense',
        public.determine_owner_user(user_record.user_id),
        user_record.user_id,
        vehicles_default_id,
        CASE 
          WHEN user_lang = 'en' THEN 'Expenses related to personal vehicles and financing'
          WHEN user_lang = 'es' THEN 'Gastos relacionados con vehículos propios y financiación'
          ELSE 'Gastos relacionados a veículos próprios e financiamentos'
        END
      );
      
      RAISE NOTICE 'Created "Veículos & Financiamentos" category for user: %', user_record.user_id;
    ELSE
      RAISE NOTICE 'User % already has "Veículos & Financiamentos" category', user_record.user_id;
    END IF;
    
  END LOOP;
  
  RAISE NOTICE 'Finished ensuring all users have "Veículos & Financiamentos" category';
END $$;