-- Move "Escola" tag from "Família & Filhos" to "Educação" category
-- First, get the IDs we need to work with
DO $$
DECLARE
    escola_tag_id UUID;
    familia_category_id UUID;
    educacao_category_id UUID;
BEGIN
    -- Get the "Escola" tag ID
    SELECT id INTO escola_tag_id 
    FROM public.category_tags 
    WHERE name_pt = 'Escola';
    
    -- Get "Família & Filhos" category ID
    SELECT id INTO familia_category_id 
    FROM public.default_categories 
    WHERE name_pt = 'Família & Filhos';
    
    -- Get "Educação" category ID  
    SELECT id INTO educacao_category_id 
    FROM public.default_categories 
    WHERE name_pt = 'Educação';
    
    -- Only proceed if all IDs are found
    IF escola_tag_id IS NOT NULL AND familia_category_id IS NOT NULL AND educacao_category_id IS NOT NULL THEN
        -- Remove the old relation
        DELETE FROM public.category_tag_relations 
        WHERE tag_id = escola_tag_id AND category_id = familia_category_id;
        
        -- Add the new relation if it doesn't exist
        INSERT INTO public.category_tag_relations (category_id, tag_id, is_active)
        VALUES (educacao_category_id, escola_tag_id, true)
        ON CONFLICT (category_id, tag_id) DO NOTHING;
        
        RAISE NOTICE 'Successfully moved "Escola" tag from "Família & Filhos" to "Educação"';
    ELSE
        RAISE NOTICE 'Could not find required categories or tag';
    END IF;
END $$;

-- Update the suggest_category_and_tag function to respect user exclusions
CREATE OR REPLACE FUNCTION public.suggest_category_and_tag(description text, language text DEFAULT 'pt'::text, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(category_id uuid, tag_id uuid, category_name text, tag_name text, confidence numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  normalized_desc TEXT;
  keyword_array TEXT[];
  match_record RECORD;
BEGIN
  -- Normalizar descrição
  normalized_desc := LOWER(TRIM(description));
  
  -- Buscar matches nas keywords das tags, considerando exclusões do usuário
  FOR match_record IN (
    SELECT 
      dc.id as cat_id,
      ct.id as tag_id,
      CASE 
        WHEN language = 'en' THEN dc.name_en
        WHEN language = 'es' THEN dc.name_es
        ELSE dc.name_pt
      END as cat_name,
      CASE 
        WHEN language = 'en' THEN ct.name_en
        WHEN language = 'es' THEN ct.name_es
        ELSE ct.name_pt
      END as tag_name,
      CASE 
        WHEN language = 'en' THEN ct.keywords_en
        WHEN language = 'es' THEN ct.keywords_es
        ELSE ct.keywords_pt
      END as keywords
    FROM public.default_categories dc
    JOIN public.category_tag_relations ctr ON dc.id = ctr.category_id
    JOIN public.category_tags ct ON ctr.tag_id = ct.id
    WHERE dc.category_type = 'expense'
      AND ctr.is_active = true
      -- Exclude tags that the user has specifically excluded
      AND (p_user_id IS NULL OR NOT EXISTS (
        SELECT 1 FROM public.user_category_tag_exclusions ucte
        WHERE ucte.user_id = p_user_id 
          AND ucte.system_tag_id = ct.id 
          AND ucte.category_id = dc.id
      ))
  ) LOOP
    -- Verificar se alguma keyword está na descrição
    keyword_array := match_record.keywords;
    FOR i IN 1..array_length(keyword_array, 1) LOOP
      IF normalized_desc LIKE '%' || LOWER(keyword_array[i]) || '%' THEN
        category_id := match_record.cat_id;
        tag_id := match_record.tag_id;
        category_name := match_record.cat_name;
        tag_name := match_record.tag_name;
        confidence := 0.8; -- Alta confiança para match exato
        RETURN NEXT;
        RETURN; -- Retorna o primeiro match encontrado
      END IF;
    END LOOP;
  END LOOP;
  
  -- Se não encontrou tag específica, buscar só categoria
  FOR match_record IN (
    SELECT 
      dc.id as cat_id,
      CASE 
        WHEN language = 'en' THEN dc.name_en
        WHEN language = 'es' THEN dc.name_es
        ELSE dc.name_pt
      END as cat_name
    FROM public.default_categories dc
    WHERE dc.category_type = 'expense'
      AND (
        normalized_desc LIKE '%' || LOWER(
          CASE 
            WHEN language = 'en' THEN dc.name_en
            WHEN language = 'es' THEN dc.name_es
            ELSE dc.name_pt
          END
        ) || '%'
      )
    LIMIT 1
  ) LOOP
    category_id := match_record.cat_id;
    tag_id := NULL;
    category_name := match_record.cat_name;
    tag_name := NULL;
    confidence := 0.6; -- Média confiança para categoria geral
    RETURN NEXT;
    RETURN;
  END LOOP;
  
  -- Se não encontrou nada, retornar categoria "Outros"
  SELECT dc.id, 
         CASE 
           WHEN language = 'en' THEN dc.name_en
           WHEN language = 'es' THEN dc.name_es
           ELSE dc.name_pt
         END
  INTO category_id, category_name
  FROM public.default_categories dc
  WHERE dc.name_pt = 'Outros' AND dc.category_type = 'expense'
  LIMIT 1;
  
  tag_id := NULL;
  tag_name := NULL;
  confidence := 0.3; -- Baixa confiança para fallback
  RETURN NEXT;
END;
$function$;

-- Create a function to get active tags for a category considering user exclusions
CREATE OR REPLACE FUNCTION public.get_active_tags_for_category(p_category_id uuid, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(tag_id uuid, tag_name_pt text, tag_name_en text, tag_name_es text, color text, icon text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    ct.id as tag_id,
    ct.name_pt,
    ct.name_en, 
    ct.name_es,
    ct.color,
    ct.icon
  FROM public.category_tags ct
  JOIN public.category_tag_relations ctr ON ct.id = ctr.tag_id
  WHERE ctr.category_id = p_category_id
    AND ctr.is_active = true
    -- Exclude tags that the user has specifically excluded
    AND (p_user_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.user_category_tag_exclusions ucte
      WHERE ucte.user_id = p_user_id 
        AND ucte.system_tag_id = ct.id 
        AND ucte.category_id = p_category_id
    ))
  ORDER BY ct.name_pt;
$function$;

-- Create a function to synchronize user tag preferences
CREATE OR REPLACE FUNCTION public.sync_user_tag_preferences(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- This function can be called to ensure all user tag preferences are properly synchronized
  -- For now, it's a placeholder that can be extended as needed
  
  -- Log the synchronization event
  INSERT INTO public.ai_history (user_id, entry_type, message)
  VALUES (p_user_id, 'system', 'User tag preferences synchronized')
  ON CONFLICT DO NOTHING;
  
END;
$function$;