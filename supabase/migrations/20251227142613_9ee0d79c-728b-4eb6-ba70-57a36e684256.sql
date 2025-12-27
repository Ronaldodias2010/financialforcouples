
-- =====================================================
-- FIX 1: Atualizar funções para incluir search_path (sem DROP para evitar problemas com dependências)
-- =====================================================

-- find_tag_case_insensitive - Usar CREATE OR REPLACE
CREATE OR REPLACE FUNCTION public.find_tag_case_insensitive(
  search_name text, 
  search_lang text DEFAULT 'pt'::text
)
RETURNS SETOF public.category_tags
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT * FROM public.category_tags 
  WHERE 
    CASE 
      WHEN search_lang = 'en' THEN LOWER(name_en) = LOWER(search_name)
      WHEN search_lang = 'es' THEN LOWER(name_es) = LOWER(search_name)  
      ELSE LOWER(name_pt) = LOWER(search_name)
    END;
$$;

-- normalize_category_name - Usar CREATE OR REPLACE mantendo a mesma assinatura
CREATE OR REPLACE FUNCTION public.normalize_category_name(input_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT lower(trim(regexp_replace(coalesce(input_name, ''), '\s+', ' ', 'g')));
$$;

-- insert_normalized_user_tag - Usar CREATE OR REPLACE
CREATE OR REPLACE FUNCTION public.insert_normalized_user_tag(
  p_user_id uuid, 
  p_category_id uuid, 
  p_tag_name text, 
  p_color text DEFAULT '#6366f1'::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tag_id UUID;
  v_normalized_name TEXT;
BEGIN
  -- Normalize tag name to lowercase
  v_normalized_name := LOWER(TRIM(p_tag_name));
  
  -- Check if tag already exists for this category (case-insensitive)
  IF EXISTS (
    SELECT 1 FROM public.user_category_tags 
    WHERE user_id = p_user_id 
      AND category_id = p_category_id 
      AND LOWER(tag_name) = v_normalized_name
  ) THEN
    RAISE EXCEPTION 'Tag already exists for this category';
  END IF;
  
  -- Insert normalized tag
  INSERT INTO public.user_category_tags (
    user_id, category_id, tag_name, color
  ) VALUES (
    p_user_id, p_category_id, v_normalized_name, p_color
  ) RETURNING id INTO v_tag_id;
  
  RETURN v_tag_id;
END;
$$;

-- =====================================================
-- FIX 2: Mover pg_net do public para extensions
-- =====================================================
DO $$
BEGIN
  -- Se pg_net existe no public, precisamos movê-lo para extensions
  IF EXISTS (
    SELECT 1 FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = 'pg_net' AND n.nspname = 'public'
  ) THEN
    -- Drop do public e recria em extensions
    DROP EXTENSION IF EXISTS pg_net CASCADE;
    CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
  END IF;
END $$;
