-- Backfill default_category_id for existing user categories
-- This links user categories to their corresponding default categories so tags can be displayed

UPDATE public.categories 
SET default_category_id = (
  SELECT dc.id 
  FROM public.default_categories dc 
  WHERE dc.category_type = categories.category_type
    AND (
      public.normalize_text_simple(dc.name_pt) = public.normalize_text_simple(categories.name) OR
      public.normalize_text_simple(dc.name_en) = public.normalize_text_simple(categories.name) OR
      public.normalize_text_simple(dc.name_es) = public.normalize_text_simple(categories.name)
    )
  LIMIT 1
)
WHERE default_category_id IS NULL;

-- Ensure "Receita Extraordinária" tags exist and are properly linked
-- Insert the category if it doesn't exist
INSERT INTO public.default_categories (name_pt, name_en, name_es, category_type, color, icon)
VALUES ('Receita Extraordinária', 'Extraordinary Income', 'Ingresos Extraordinarios', 'income', '#10b981', 'star')
ON CONFLICT DO NOTHING;

-- Get the category ID for "Receita Extraordinária"
DO $$
DECLARE
  receita_category_id UUID;
  tag_id UUID;
BEGIN
  -- Get category ID
  SELECT id INTO receita_category_id 
  FROM public.default_categories 
  WHERE name_pt = 'Receita Extraordinária' 
  LIMIT 1;
  
  IF receita_category_id IS NOT NULL THEN
    -- Insert the 5 tags and their relations
    
    -- 1. Herança
    INSERT INTO public.category_tags (name_pt, name_en, name_es, color, keywords_pt, keywords_en, keywords_es)
    VALUES ('Herança', 'Inheritance', 'Herencia', '#10b981', 
            ARRAY['herança', 'heranca', 'inventario', 'espólio', 'espolio', 'sucessão'],
            ARRAY['inheritance', 'estate', 'legacy', 'bequest', 'succession'],
            ARRAY['herencia', 'legado', 'testamento', 'sucesión', 'patrimonio'])
    ON CONFLICT DO NOTHING
    RETURNING id INTO tag_id;
    
    IF tag_id IS NULL THEN
      SELECT id INTO tag_id FROM public.category_tags WHERE name_pt = 'Herança' LIMIT 1;
    END IF;
    
    INSERT INTO public.category_tag_relations (category_id, tag_id, is_active)
    VALUES (receita_category_id, tag_id, true)
    ON CONFLICT DO NOTHING;
    
    -- 2. Doações Recebidas  
    INSERT INTO public.category_tags (name_pt, name_en, name_es, color, keywords_pt, keywords_en, keywords_es)
    VALUES ('Doações Recebidas', 'Donations Received', 'Donaciones Recibidas', '#10b981',
            ARRAY['doação', 'doacao', 'presente', 'gift', 'contribuição', 'contribuicao'],
            ARRAY['donation', 'gift', 'contribution', 'charity', 'endowment'],
            ARRAY['donación', 'regalo', 'contribución', 'caridad', 'aportación'])
    ON CONFLICT DO NOTHING
    RETURNING id INTO tag_id;
    
    IF tag_id IS NULL THEN
      SELECT id INTO tag_id FROM public.category_tags WHERE name_pt = 'Doações Recebidas' LIMIT 1;
    END IF;
    
    INSERT INTO public.category_tag_relations (category_id, tag_id, is_active)
    VALUES (receita_category_id, tag_id, true)
    ON CONFLICT DO NOTHING;
    
    -- 3. Loteria
    INSERT INTO public.category_tags (name_pt, name_en, name_es, color, keywords_pt, keywords_en, keywords_es)
    VALUES ('Loteria', 'Lottery', 'Lotería', '#10b981',
            ARRAY['loteria', 'mega-sena', 'quina', 'aposta', 'sorteio', 'prêmio', 'premio'],
            ARRAY['lottery', 'jackpot', 'prize', 'raffle', 'sweepstakes', 'gambling'],
            ARRAY['lotería', 'premio', 'sorteo', 'apuesta', 'juego'])
    ON CONFLICT DO NOTHING
    RETURNING id INTO tag_id;
    
    IF tag_id IS NULL THEN
      SELECT id INTO tag_id FROM public.category_tags WHERE name_pt = 'Loteria' LIMIT 1;
    END IF;
    
    INSERT INTO public.category_tag_relations (category_id, tag_id, is_active)
    VALUES (receita_category_id, tag_id, true)
    ON CONFLICT DO NOTHING;
    
    -- 4. Indenizações
    INSERT INTO public.category_tags (name_pt, name_en, name_es, color, keywords_pt, keywords_en, keywords_es)
    VALUES ('Indenizações', 'Indemnifications', 'Indemnizaciones', '#10b981',
            ARRAY['indenização', 'indenizacao', 'compensação', 'compensacao', 'ressarcimento', 'seguro'],
            ARRAY['indemnification', 'compensation', 'insurance', 'settlement', 'damages'],
            ARRAY['indemnización', 'compensación', 'seguro', 'resarcimiento', 'daños'])
    ON CONFLICT DO NOTHING
    RETURNING id INTO tag_id;
    
    IF tag_id IS NULL THEN
      SELECT id INTO tag_id FROM public.category_tags WHERE name_pt = 'Indenizações' LIMIT 1;
    END IF;
    
    INSERT INTO public.category_tag_relations (category_id, tag_id, is_active)
    VALUES (receita_category_id, tag_id, true)
    ON CONFLICT DO NOTHING;
    
    -- 5. Restituição de Impostos
    INSERT INTO public.category_tags (name_pt, name_en, name_es, color, keywords_pt, keywords_en, keywords_es)
    VALUES ('Restituição de Impostos', 'Tax Refund', 'Devolución de Impuestos', '#10b981',
            ARRAY['restituição', 'restituicao', 'imposto de renda', 'receita federal', 'devolução', 'devolucao'],
            ARRAY['tax refund', 'tax return', 'irs refund', 'income tax', 'refund'],
            ARRAY['devolución fiscal', 'reembolso fiscal', 'renta', 'hacienda', 'impuestos'])
    ON CONFLICT DO NOTHING
    RETURNING id INTO tag_id;
    
    IF tag_id IS NULL THEN
      SELECT id INTO tag_id FROM public.category_tags WHERE name_pt = 'Restituição de Impostos' LIMIT 1;
    END IF;
    
    INSERT INTO public.category_tag_relations (category_id, tag_id, is_active)
    VALUES (receita_category_id, tag_id, true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Update suggest_category_and_tag function to include user-defined tags
CREATE OR REPLACE FUNCTION public.suggest_category_and_tag(description text, language text DEFAULT 'pt'::text)
RETURNS TABLE(category_id uuid, tag_id uuid, category_name text, tag_name text, confidence numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  normalized_desc TEXT;
  keyword_array TEXT[];
  match_record RECORD;
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  normalized_desc := LOWER(TRIM(description));
  
  -- First, search in user-defined tags (highest priority)
  IF current_user_id IS NOT NULL THEN
    FOR match_record IN (
      SELECT 
        uct.category_id as cat_id,
        uct.id as tag_id,
        c.name as cat_name,
        CASE 
          WHEN language = 'en' THEN COALESCE(uct.tag_name_en, uct.tag_name)
          WHEN language = 'es' THEN COALESCE(uct.tag_name_es, uct.tag_name)
          ELSE uct.tag_name
        END as tag_name
      FROM public.user_category_tags uct
      JOIN public.categories c ON uct.category_id = c.id
      WHERE uct.user_id = current_user_id
        AND c.category_type = 'expense'
        AND LOWER(uct.tag_name) LIKE '%' || normalized_desc || '%'
    ) LOOP
      category_id := match_record.cat_id;
      tag_id := match_record.tag_id;
      category_name := match_record.cat_name;
      tag_name := match_record.tag_name;
      confidence := 0.9; -- Highest confidence for user tags
      RETURN NEXT;
      RETURN;
    END LOOP;
  END IF;
  
  -- Then search in system tags (existing logic)
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
  ) LOOP
    -- Check if any keyword matches the description
    keyword_array := match_record.keywords;
    FOR i IN 1..array_length(keyword_array, 1) LOOP
      IF normalized_desc LIKE '%' || LOWER(keyword_array[i]) || '%' THEN
        category_id := match_record.cat_id;
        tag_id := match_record.tag_id;
        category_name := match_record.cat_name;
        tag_name := match_record.tag_name;
        confidence := 0.8; -- High confidence for system tag match
        RETURN NEXT;
        RETURN;
      END IF;
    END LOOP;
  END LOOP;
  
  -- If no tag found, search categories only
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
    confidence := 0.6; -- Medium confidence for category only
    RETURN NEXT;
    RETURN;
  END LOOP;
  
  -- Fallback to "Outros" category
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
  confidence := 0.3; -- Low confidence for fallback
  RETURN NEXT;
END;
$function$;