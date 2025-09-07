
DO $$
DECLARE
  v_dc uuid;
BEGIN
  -- Descobrir a categoria padrão "Receita Extraordinária"
  SELECT id INTO v_dc
  FROM public.default_categories
  WHERE lower(name_pt) IN ('receita extraordinária', 'receita extraordinaria')
  LIMIT 1;

  IF v_dc IS NULL THEN
    RAISE NOTICE 'Categoria padrão "Receita Extraordinária" não encontrada em default_categories.';
    RETURN;
  END IF;

  -- Garantir a existência das tags (idempotente)
  -- Herança
  IF NOT EXISTS (SELECT 1 FROM public.category_tags WHERE lower(name_pt) = lower('Herança')) THEN
    INSERT INTO public.category_tags (name_pt, name_en, name_es, color)
    VALUES ('Herança', 'Inheritance', 'Herencia', '#6366f1');
  END IF;

  -- Doações Recebidas
  IF NOT EXISTS (SELECT 1 FROM public.category_tags WHERE lower(name_pt) = lower('Doações Recebidas')) THEN
    INSERT INTO public.category_tags (name_pt, name_en, name_es, color)
    VALUES ('Doações Recebidas', 'Donations received', 'Donaciones recibidas', '#6366f1');
  END IF;

  -- Loteria
  IF NOT EXISTS (SELECT 1 FROM public.category_tags WHERE lower(name_pt) = lower('Loteria')) THEN
    INSERT INTO public.category_tags (name_pt, name_en, name_es, color)
    VALUES ('Loteria', 'Lottery', 'Lotería', '#6366f1');
  END IF;

  -- Indenizações
  IF NOT EXISTS (SELECT 1 FROM public.category_tags WHERE lower(name_pt) = lower('Indenizações')) THEN
    INSERT INTO public.category_tags (name_pt, name_en, name_es, color)
    VALUES ('Indenizações', 'Compensation', 'Indemnizaciones', '#6366f1');
  END IF;

  -- Restituição de Impostos
  IF NOT EXISTS (SELECT 1 FROM public.category_tags WHERE lower(name_pt) = lower('Restituição de Impostos')) THEN
    INSERT INTO public.category_tags (name_pt, name_en, name_es, color)
    VALUES ('Restituição de Impostos', 'Tax refund', 'Devolución de impuestos', '#6366f1');
  END IF;

  -- Garantir os vínculos (idempotente)
  INSERT INTO public.category_tag_relations (category_id, tag_id, is_active)
  SELECT v_dc, ct.id, true
  FROM public.category_tags ct
  WHERE lower(ct.name_pt) IN (
    'herança', 'doações recebidas', 'loteria', 'indenizações', 'restituição de impostos'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.category_tag_relations r
    WHERE r.category_id = v_dc AND r.tag_id = ct.id
  );
END
$$;

-- Atualiza a função para considerar tags personalizadas do usuário, mantendo o comportamento atual como fallback
CREATE OR REPLACE FUNCTION public.suggest_category_and_tag(
  description text,
  language text DEFAULT 'pt',
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE(category_id uuid, tag_id uuid, category_name text, tag_name text, confidence numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  normalized_desc TEXT;
  match_record RECORD;
BEGIN
  normalized_desc := lower(trim(coalesce(description, '')));

  -- 1) Checar tags personalizadas do usuário por ocorrência literal na descrição
  IF p_user_id IS NOT NULL AND normalized_desc <> '' THEN
    FOR match_record IN
      SELECT
        ut.id AS user_tag_id,
        ut.tag_name,
        COALESCE(ut.tag_name_en, ut.tag_name) AS tag_name_en,
        COALESCE(ut.tag_name_es, ut.tag_name) AS tag_name_es,
        c.id AS user_category_id,
        c.default_category_id,
        -- Nome da categoria traduzido a partir de default_categories quando houver vínculo
        CASE
          WHEN language = 'en' THEN COALESCE(dc.name_en, c.name)
          WHEN language = 'es' THEN COALESCE(dc.name_es, c.name)
          ELSE COALESCE(dc.name_pt, c.name)
        END AS translated_cat_name
      FROM public.user_category_tags ut
      JOIN public.categories c ON c.id = ut.category_id
      LEFT JOIN public.default_categories dc ON dc.id = c.default_category_id
      WHERE ut.user_id = p_user_id
    LOOP
      IF normalized_desc LIKE '%' || lower(coalesce(match_record.tag_name, '')) || '%' THEN
        category_id := COALESCE(match_record.default_category_id, match_record.user_category_id);
        tag_id := match_record.user_tag_id;
        category_name := match_record.translated_cat_name;
        tag_name := CASE
          WHEN language = 'en' THEN COALESCE(match_record.tag_name_en, match_record.tag_name)
          WHEN language = 'es' THEN COALESCE(match_record.tag_name_es, match_record.tag_name)
          ELSE match_record.tag_name
        END;
        confidence := 0.85;
        RETURN NEXT;
        RETURN;
      END IF;
    END LOOP;
  END IF;

  -- 2) Heurística existente: keywords das tags do sistema (apenas despesas no modelo original)
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
    WHERE ctr.is_active = true
  ) LOOP
    IF match_record.keywords IS NOT NULL THEN
      FOR i IN 1..COALESCE(array_length(match_record.keywords, 1), 0) LOOP
        IF normalized_desc LIKE '%' || lower(match_record.keywords[i]) || '%' THEN
          category_id := match_record.cat_id;
          tag_id := match_record.tag_id;
          category_name := match_record.cat_name;
          tag_name := match_record.tag_name;
          confidence := 0.8;
          RETURN NEXT;
          RETURN;
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  -- 3) Se não encontrou tag específica, tentar só categoria por nome
  FOR match_record IN (
    SELECT 
      dc.id as cat_id,
      CASE 
        WHEN language = 'en' THEN dc.name_en
        WHEN language = 'es' THEN dc.name_es
        ELSE dc.name_pt
      END as cat_name
    FROM public.default_categories dc
    WHERE normalized_desc LIKE '%' || lower(
      CASE 
        WHEN language = 'en' THEN dc.name_en
        WHEN language = 'es' THEN dc.name_es
        ELSE dc.name_pt
      END
    ) || '%'
    LIMIT 1
  ) LOOP
    category_id := match_record.cat_id;
    tag_id := NULL;
    category_name := match_record.cat_name;
    tag_name := NULL;
    confidence := 0.6;
    RETURN NEXT;
    RETURN;
  END LOOP;

  -- 4) Fallback: "Outros" (se existir); se não, retorna NULLs com baixa confiança
  SELECT dc.id,
         CASE 
           WHEN language = 'en' THEN dc.name_en
           WHEN language = 'es' THEN dc.name_es
           ELSE dc.name_pt
         END
  INTO category_id, category_name
  FROM public.default_categories dc
  WHERE lower(dc.name_pt) = 'outros'
  LIMIT 1;

  tag_id := NULL;
  tag_name := NULL;
  confidence := 0.3;
  RETURN NEXT;
END;
$function$;
