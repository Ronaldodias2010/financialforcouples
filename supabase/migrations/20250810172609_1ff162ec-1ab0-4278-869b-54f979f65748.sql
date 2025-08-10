-- Create helper function to normalize names (collapse spaces and lowercase)
CREATE OR REPLACE FUNCTION public.normalize_text_simple(input TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(regexp_replace(trim(coalesce(input, '')), '\s+', ' ', 'g'));
$$;

-- Create trigger function to sync categories across couple users
CREATE OR REPLACE FUNCTION public.sync_category_across_couple()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user1 UUID;
  v_user2 UUID;
  v_partner UUID;
  v_partner_cat_id UUID;
BEGIN
  -- Avoid recursive trigger loops
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  -- Find active couple for this user
  SELECT user1_id, user2_id
    INTO v_user1, v_user2
  FROM public.user_couples
  WHERE status = 'active'
    AND (user1_id = NEW.user_id OR user2_id = NEW.user_id)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NEW; -- not part of a couple
  END IF;

  -- Determine partner id
  v_partner := CASE WHEN NEW.user_id = v_user1 THEN v_user2 ELSE v_user1 END;

  -- Try to find an existing partner category with same normalized name and type
  SELECT id INTO v_partner_cat_id
  FROM public.categories c
  WHERE c.user_id = v_partner
    AND c.category_type = NEW.category_type
    AND public.normalize_text_simple(c.name) = public.normalize_text_simple(NEW.name)
  LIMIT 1;

  IF v_partner_cat_id IS NULL THEN
    -- Insert partner category
    INSERT INTO public.categories (name, color, icon, category_type, owner_user, user_id)
    VALUES (NEW.name, NEW.color, NEW.icon, NEW.category_type, NEW.owner_user, v_partner);
  ELSE
    -- Update partner category
    UPDATE public.categories
    SET name = NEW.name,
        color = NEW.color,
        icon = NEW.icon,
        updated_at = now()
    WHERE id = v_partner_cat_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach triggers for INSERT and UPDATE on categories
DROP TRIGGER IF EXISTS trg_sync_category_insert ON public.categories;
CREATE TRIGGER trg_sync_category_insert
AFTER INSERT ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.sync_category_across_couple();

DROP TRIGGER IF EXISTS trg_sync_category_update ON public.categories;
CREATE TRIGGER trg_sync_category_update
AFTER UPDATE OF name, color, icon, category_type ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.sync_category_across_couple();