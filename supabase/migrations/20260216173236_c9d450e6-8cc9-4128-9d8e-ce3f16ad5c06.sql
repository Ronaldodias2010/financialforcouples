
-- Fix the circular sync loop in sync_subcategory_to_partner
-- The trigger syncs User->Partner, but then Partner->User creates a duplicate error
-- Solution: Check if the subcategory already exists before inserting (skip if it does)
CREATE OR REPLACE FUNCTION public.sync_subcategory_to_partner()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_partner_id UUID;
  v_partner_category_id UUID;
  v_default_category_id UUID;
BEGIN
  -- Find the active partner
  SELECT CASE 
    WHEN user1_id = NEW.user_id THEN user2_id 
    ELSE user1_id 
  END INTO v_partner_id
  FROM public.user_couples
  WHERE status = 'active' 
    AND (user1_id = NEW.user_id OR user2_id = NEW.user_id);
  
  IF v_partner_id IS NOT NULL THEN
    -- Get the default category ID from the source category
    SELECT default_category_id INTO v_default_category_id
    FROM public.categories WHERE id = NEW.category_id;
    
    -- Find the partner's equivalent category
    SELECT id INTO v_partner_category_id
    FROM public.categories 
    WHERE user_id = v_partner_id 
      AND default_category_id = v_default_category_id
      AND deleted_at IS NULL;
    
    IF v_partner_category_id IS NOT NULL THEN
      -- CRITICAL FIX: Check if partner already has this subcategory (case-insensitive)
      -- This prevents the circular sync loop: User->Partner->User(duplicate!)
      IF NOT EXISTS (
        SELECT 1 FROM public.subcategories
        WHERE user_id = v_partner_id
          AND category_id = v_partner_category_id
          AND LOWER(TRIM(name)) = LOWER(TRIM(NEW.name))
          AND deleted_at IS NULL
      ) THEN
        INSERT INTO public.subcategories (user_id, category_id, name, name_en, name_es, color, icon, is_system)
        VALUES (v_partner_id, v_partner_category_id, NEW.name, NEW.name_en, NEW.name_es, NEW.color, NEW.icon, NEW.is_system)
        ON CONFLICT (user_id, category_id, name) DO NOTHING;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;
