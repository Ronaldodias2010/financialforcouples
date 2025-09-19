-- Fix functions with mutable search_path vulnerability
-- Update functions to set search_path properly

-- Fix update_manual_future_expenses_updated_at function
CREATE OR REPLACE FUNCTION public.update_manual_future_expenses_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix update_user_category_tags_updated_at function  
CREATE OR REPLACE FUNCTION public.update_user_category_tags_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix update_moblix_offers_updated_at function
CREATE OR REPLACE FUNCTION public.update_moblix_offers_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix hash_temp_password_trigger function
CREATE OR REPLACE FUNCTION public.hash_temp_password_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Hash temp_password_hash if it's being set as plaintext
  IF NEW.temp_password_hash IS NOT NULL AND OLD.temp_password_hash IS DISTINCT FROM NEW.temp_password_hash THEN
    -- Only hash if it doesn't look like it's already hashed (bcrypt hashes start with $2)
    IF NEW.temp_password_hash !~ '^\$2[aby]?\$[0-9]+\$' THEN
      NEW.temp_password_hash := public.hash_temp_password(NEW.temp_password_hash);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Fix audit_manual_premium_access function
CREATE OR REPLACE FUNCTION public.audit_manual_premium_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log the action
  INSERT INTO public.manual_premium_access_audit (
    action_type,
    target_record_id,
    target_email,
    performed_by_admin_id
  ) VALUES (
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
      WHEN TG_OP = 'DELETE' THEN 'deleted'
    END,
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.email, OLD.email),
    COALESCE(NEW.created_by_admin_id, OLD.created_by_admin_id, auth.uid())
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Fix sync_category_across_couple function  
CREATE OR REPLACE FUNCTION public.sync_category_across_couple()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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