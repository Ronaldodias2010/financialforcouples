-- Fix security warnings by setting proper search_path for functions that were missing it

-- Fix the auto_translate_category_name function
CREATE OR REPLACE FUNCTION public.auto_translate_category_name(input_name text, from_lang text DEFAULT 'pt'::text)
RETURNS TABLE(pt_name text, en_name text, es_name text, pt_description text, en_description text, es_description text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  normalized_input TEXT;
  default_cat RECORD;
BEGIN
  normalized_input := lower(regexp_replace(trim(coalesce(input_name, '')), '\s+', ' ', 'g'));
  
  -- Buscar na tabela de categorias padrão
  SELECT name_pt, name_en, name_es, description_pt, description_en, description_es INTO default_cat
  FROM public.default_categories
  WHERE 
    lower(regexp_replace(trim(name_pt), '\s+', ' ', 'g')) = normalized_input OR
    lower(regexp_replace(trim(name_en), '\s+', ' ', 'g')) = normalized_input OR
    lower(regexp_replace(trim(name_es), '\s+', ' ', 'g')) = normalized_input
  LIMIT 1;
  
  IF FOUND THEN
    pt_name := default_cat.name_pt;
    en_name := default_cat.name_en;
    es_name := default_cat.name_es;
    pt_description := default_cat.description_pt;
    en_description := default_cat.description_en;
    es_description := default_cat.description_es;
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Se não encontrou, retornar o nome original sem descrições
  pt_name := input_name;
  en_name := input_name;
  es_name := input_name;
  pt_description := NULL;
  en_description := NULL;
  es_description := NULL;
  RETURN NEXT;
END;
$function$;

-- Fix the get_user_daily_ai_usage function 
CREATE OR REPLACE FUNCTION public.get_user_daily_ai_usage(p_user_id uuid, p_date date DEFAULT CURRENT_DATE)
RETURNS TABLE(requests_count integer, tokens_used integer, estimated_cost_brl numeric)
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    COALESCE(requests_count, 0) as requests_count,
    COALESCE(tokens_used, 0) as tokens_used,
    COALESCE(estimated_cost_brl, 0) as estimated_cost_brl
  FROM ai_usage_tracking 
  WHERE user_id = p_user_id AND date = p_date
  UNION ALL
  SELECT 0, 0, 0
  WHERE NOT EXISTS (
    SELECT 1 FROM ai_usage_tracking 
    WHERE user_id = p_user_id AND date = p_date
  )
  LIMIT 1;
$function$;

-- Fix the determine_owner_user function
CREATE OR REPLACE FUNCTION public.determine_owner_user(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM public.user_couples uc
      WHERE uc.status = 'active' AND uc.user1_id = p_user_id
    ) THEN 'user1'
    WHEN EXISTS (
      SELECT 1 FROM public.user_couples uc
      WHERE uc.status = 'active' AND uc.user2_id = p_user_id
    ) THEN 'user2'
    ELSE 'user1'
  END;
$function$;