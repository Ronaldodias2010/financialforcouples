-- Corrigir search_path para todas as funções criadas
CREATE OR REPLACE FUNCTION ensure_subcategory_translations()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.name_en IS NULL OR NEW.name_en = '' THEN
    NEW.name_en := NEW.name;
  END IF;
  
  IF NEW.name_es IS NULL OR NEW.name_es = '' THEN
    NEW.name_es := NEW.name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION validate_subcategory_not_category()
RETURNS TRIGGER AS $$
DECLARE
  v_category_exists BOOLEAN;
  v_category_name TEXT;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.categories 
    WHERE deleted_at IS NULL
      AND (user_id = NEW.user_id 
           OR user_id IN (
             SELECT CASE WHEN user1_id = NEW.user_id THEN user2_id ELSE user1_id END
             FROM public.user_couples WHERE status = 'active' 
               AND (user1_id = NEW.user_id OR user2_id = NEW.user_id)
           ))
      AND (LOWER(TRIM(name)) = LOWER(TRIM(NEW.name)) 
           OR LOWER(TRIM(name)) = LOWER(TRIM(NEW.name_en))
           OR LOWER(TRIM(name)) = LOWER(TRIM(NEW.name_es)))
  ) INTO v_category_exists;
  
  IF v_category_exists THEN
    SELECT name INTO v_category_name FROM public.categories 
    WHERE deleted_at IS NULL
      AND (LOWER(TRIM(name)) = LOWER(TRIM(NEW.name)) 
           OR LOWER(TRIM(name)) = LOWER(TRIM(NEW.name_en))
           OR LOWER(TRIM(name)) = LOWER(TRIM(NEW.name_es)))
    LIMIT 1;
    
    RAISE EXCEPTION 'SUBCATEGORY_IS_CATEGORY:O nome "%" já existe como categoria', COALESCE(v_category_name, NEW.name);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION validate_subcategory_unique_across_categories()
RETURNS TRIGGER AS $$
DECLARE
  v_duplicate_exists BOOLEAN;
  v_existing_category TEXT;
  v_existing_subcategory TEXT;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.subcategories s
    WHERE s.deleted_at IS NULL
      AND s.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND s.category_id != NEW.category_id
      AND (s.user_id = NEW.user_id 
           OR s.user_id IN (
             SELECT CASE WHEN user1_id = NEW.user_id THEN user2_id ELSE user1_id END
             FROM public.user_couples WHERE status = 'active' 
               AND (user1_id = NEW.user_id OR user2_id = NEW.user_id)
           ))
      AND (LOWER(TRIM(s.name)) = LOWER(TRIM(NEW.name))
           OR LOWER(TRIM(s.name)) = LOWER(TRIM(NEW.name_en))
           OR LOWER(TRIM(s.name)) = LOWER(TRIM(NEW.name_es))
           OR LOWER(TRIM(s.name_en)) = LOWER(TRIM(NEW.name))
           OR LOWER(TRIM(s.name_es)) = LOWER(TRIM(NEW.name)))
  ) INTO v_duplicate_exists;
  
  IF v_duplicate_exists THEN
    SELECT c.name, s.name INTO v_existing_category, v_existing_subcategory
    FROM public.subcategories s
    JOIN public.categories c ON s.category_id = c.id
    WHERE s.deleted_at IS NULL
      AND s.category_id != NEW.category_id
      AND (LOWER(TRIM(s.name)) = LOWER(TRIM(NEW.name))
           OR LOWER(TRIM(s.name)) = LOWER(TRIM(NEW.name_en))
           OR LOWER(TRIM(s.name)) = LOWER(TRIM(NEW.name_es)))
    LIMIT 1;
    
    RAISE EXCEPTION 'SUBCATEGORY_DUPLICATE:Subcategoria "%" já existe na categoria "%"', COALESCE(v_existing_subcategory, NEW.name), v_existing_category;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION sync_subcategory_to_partner()
RETURNS TRIGGER AS $$
DECLARE
  v_partner_id UUID;
  v_partner_category_id UUID;
  v_default_category_id UUID;
BEGIN
  SELECT CASE 
    WHEN user1_id = NEW.user_id THEN user2_id 
    ELSE user1_id 
  END INTO v_partner_id
  FROM public.user_couples
  WHERE status = 'active' 
    AND (user1_id = NEW.user_id OR user2_id = NEW.user_id);
  
  IF v_partner_id IS NOT NULL THEN
    SELECT default_category_id INTO v_default_category_id
    FROM public.categories WHERE id = NEW.category_id;
    
    SELECT id INTO v_partner_category_id
    FROM public.categories 
    WHERE user_id = v_partner_id 
      AND default_category_id = v_default_category_id
      AND deleted_at IS NULL;
    
    IF v_partner_category_id IS NOT NULL THEN
      INSERT INTO public.subcategories (user_id, category_id, name, name_en, name_es, color, icon, is_system)
      VALUES (v_partner_id, v_partner_category_id, NEW.name, NEW.name_en, NEW.name_es, NEW.color, NEW.icon, NEW.is_system)
      ON CONFLICT (user_id, category_id, name) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;