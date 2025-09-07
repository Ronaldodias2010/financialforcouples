-- Corrigir unificação de "Investimentos" e adicionar tags para "Receita Extraordinária"
-- Passo 1: Unificar categoria de receita "Investimentos" (remover duplicados)
DO $$
DECLARE
  keep_id uuid;
  dup_ids uuid[];
BEGIN
  WITH invest_cats AS (
    SELECT id, name_pt, created_at,
           CASE WHEN public.normalize_text_simple(name_pt) = 'investimentos' THEN 1 ELSE 0 END AS is_plural
    FROM public.default_categories
    WHERE category_type = 'income'
      AND public.normalize_text_simple(name_pt) IN ('investimento','investimentos')
  ), sel AS (
    SELECT id,
           ROW_NUMBER() OVER (ORDER BY is_plural DESC, created_at ASC) rn
    FROM invest_cats
  )
  SELECT id INTO keep_id FROM sel WHERE rn = 1;

  IF keep_id IS NOT NULL THEN
    -- Padroniza nomes para plural e traduções
    UPDATE public.default_categories
      SET name_pt = 'Investimentos',
          name_en = COALESCE(name_en, 'Investments'),
          name_es = COALESCE(name_es, 'Inversiones')
    WHERE id = keep_id;

    -- Coletar duplicados (se houver)
    SELECT COALESCE(array_agg(id), ARRAY[]::uuid[]) INTO dup_ids
    FROM (
      SELECT id FROM public.default_categories
      WHERE category_type = 'income'
        AND public.normalize_text_simple(name_pt) IN ('investimento','investimentos')
        AND id <> keep_id
    ) t;

    IF array_length(dup_ids,1) IS NOT NULL THEN
      -- Atualizar referências para o mantido
      UPDATE public.categories
        SET default_category_id = keep_id
      WHERE default_category_id = ANY(dup_ids);

      UPDATE public.category_tag_relations
        SET category_id = keep_id
      WHERE category_id = ANY(dup_ids);

      -- Remover duplicados da tabela de categorias padrão
      DELETE FROM public.default_categories WHERE id = ANY(dup_ids);
    END IF;
  END IF;
END $$;

-- Passo 2: Limpeza de duplicados nas categorias de usuários
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, category_type, public.normalize_text_simple(name)
           ORDER BY CASE WHEN default_category_id IS NOT NULL THEN 0 ELSE 1 END,
                    created_at ASC
         ) AS rn
  FROM public.categories
)
DELETE FROM public.categories c
USING ranked r
WHERE c.id = r.id AND r.rn > 1;

-- Passo 3: Garantir categoria "Receita Extraordinária"
DO $$
DECLARE
  rec_ext_id uuid;
BEGIN
  SELECT id INTO rec_ext_id
  FROM public.default_categories
  WHERE category_type = 'income'
    AND public.normalize_text_simple(name_pt) = public.normalize_text_simple('Receita Extraordinária')
  LIMIT 1;

  IF rec_ext_id IS NULL THEN
    INSERT INTO public.default_categories (name_pt, name_en, name_es, description_pt, description_en, description_es, category_type, icon, color)
    VALUES (
      'Receita Extraordinária',
      'Extraordinary Income',
      'Ingreso Extraordinario',
      'Receitas não recorrentes como herança, prêmios, indenizações',
      'Non-recurring income like inheritance, prizes, compensation',
      'Ingresos no recurrentes como herencia, premios, indemnizaciones',
      'income',
      'gift',
      '#6366f1'
    );
  END IF;
END $$;

-- Passo 4: Inserir tags individuais para "Receita Extraordinária"
-- Tag 1: Herança
DO $$
DECLARE
  rec_ext_id uuid;
  v_tag_id uuid;
BEGIN
  SELECT id INTO rec_ext_id FROM public.default_categories 
  WHERE category_type = 'income' AND public.normalize_text_simple(name_pt) = public.normalize_text_simple('Receita Extraordinária') LIMIT 1;

  SELECT id INTO v_tag_id FROM public.category_tags 
  WHERE public.normalize_text_simple(name_pt) = 'herança' LIMIT 1;

  IF v_tag_id IS NULL THEN
    INSERT INTO public.category_tags (name_pt, name_en, name_es, keywords_pt, keywords_en, keywords_es, color, icon)
    VALUES ('Herança', 'Inheritance', 'Herencia', 
            ARRAY['herança','heranca','hereditário','hereditario','patrimônio'],
            ARRAY['inheritance','estate','bequest'], 
            ARRAY['herencia','heredado','legado'],
            '#6366f1', NULL) RETURNING id INTO v_tag_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.category_tag_relations WHERE category_id = rec_ext_id AND tag_id = v_tag_id) THEN
    INSERT INTO public.category_tag_relations (category_id, tag_id, is_active) VALUES (rec_ext_id, v_tag_id, true);
  END IF;
END $$;

-- Tag 2: Doações Recebidas
DO $$
DECLARE
  rec_ext_id uuid;
  v_tag_id uuid;
BEGIN
  SELECT id INTO rec_ext_id FROM public.default_categories 
  WHERE category_type = 'income' AND public.normalize_text_simple(name_pt) = public.normalize_text_simple('Receita Extraordinária') LIMIT 1;

  SELECT id INTO v_tag_id FROM public.category_tags 
  WHERE public.normalize_text_simple(name_pt) = 'doações recebidas' LIMIT 1;

  IF v_tag_id IS NULL THEN
    INSERT INTO public.category_tags (name_pt, name_en, name_es, keywords_pt, keywords_en, keywords_es, color, icon)
    VALUES ('Doações Recebidas', 'Donations Received', 'Donaciones Recibidas',
            ARRAY['doação','doacoes','doado','doacao','doações recebidas'],
            ARRAY['donation','donations received','gift income'],
            ARRAY['donación','donaciones recibidas','regalo'],
            '#6366f1', NULL) RETURNING id INTO v_tag_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.category_tag_relations WHERE category_id = rec_ext_id AND tag_id = v_tag_id) THEN
    INSERT INTO public.category_tag_relations (category_id, tag_id, is_active) VALUES (rec_ext_id, v_tag_id, true);
  END IF;
END $$;

-- Tag 3: Loteria
DO $$
DECLARE
  rec_ext_id uuid;
  v_tag_id uuid;
BEGIN
  SELECT id INTO rec_ext_id FROM public.default_categories 
  WHERE category_type = 'income' AND public.normalize_text_simple(name_pt) = public.normalize_text_simple('Receita Extraordinária') LIMIT 1;

  SELECT id INTO v_tag_id FROM public.category_tags 
  WHERE public.normalize_text_simple(name_pt) = 'loteria' LIMIT 1;

  IF v_tag_id IS NULL THEN
    INSERT INTO public.category_tags (name_pt, name_en, name_es, keywords_pt, keywords_en, keywords_es, color, icon)
    VALUES ('Loteria', 'Lottery', 'Lotería',
            ARRAY['loteria','mega sena','prêmio','premio','premiação','sorteio','aposta'],
            ARRAY['lottery','jackpot','prize','raffle','winnings'],
            ARRAY['lotería','premio','bote','rifa'],
            '#6366f1', NULL) RETURNING id INTO v_tag_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.category_tag_relations WHERE category_id = rec_ext_id AND tag_id = v_tag_id) THEN
    INSERT INTO public.category_tag_relations (category_id, tag_id, is_active) VALUES (rec_ext_id, v_tag_id, true);
  END IF;
END $$;

-- Tag 4: Indenizações
DO $$
DECLARE
  rec_ext_id uuid;
  v_tag_id uuid;
BEGIN
  SELECT id INTO rec_ext_id FROM public.default_categories 
  WHERE category_type = 'income' AND public.normalize_text_simple(name_pt) = public.normalize_text_simple('Receita Extraordinária') LIMIT 1;

  SELECT id INTO v_tag_id FROM public.category_tags 
  WHERE public.normalize_text_simple(name_pt) = 'indenizações' LIMIT 1;

  IF v_tag_id IS NULL THEN
    INSERT INTO public.category_tags (name_pt, name_en, name_es, keywords_pt, keywords_en, keywords_es, color, icon)
    VALUES ('Indenizações', 'Compensation', 'Indemnizaciones',
            ARRAY['indenização','indenizacao','acordo','seguro','ressarcimento','danos morais'],
            ARRAY['compensation','settlement','insurance payout','damages'],
            ARRAY['indemnización','acuerdo','pago de seguro','daños'],
            '#6366f1', NULL) RETURNING id INTO v_tag_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.category_tag_relations WHERE category_id = rec_ext_id AND tag_id = v_tag_id) THEN
    INSERT INTO public.category_tag_relations (category_id, tag_id, is_active) VALUES (rec_ext_id, v_tag_id, true);
  END IF;
END $$;

-- Tag 5: Restituição de Impostos
DO $$
DECLARE
  rec_ext_id uuid;
  v_tag_id uuid;
BEGIN
  SELECT id INTO rec_ext_id FROM public.default_categories 
  WHERE category_type = 'income' AND public.normalize_text_simple(name_pt) = public.normalize_text_simple('Receita Extraordinária') LIMIT 1;

  SELECT id INTO v_tag_id FROM public.category_tags 
  WHERE public.normalize_text_simple(name_pt) = 'restituição de impostos' LIMIT 1;

  IF v_tag_id IS NULL THEN
    INSERT INTO public.category_tags (name_pt, name_en, name_es, keywords_pt, keywords_en, keywords_es, color, icon)
    VALUES ('Restituição de Impostos', 'Tax Refund', 'Devolución de Impuestos',
            ARRAY['restituição','restituicao','imposto de renda','ir','reembolso de imposto','impostos'],
            ARRAY['tax refund','income tax refund','tax return refund'],
            ARRAY['devolución de impuestos','reembolso de impuestos','impuesto sobre la renta'],
            '#6366f1', NULL) RETURNING id INTO v_tag_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.category_tag_relations WHERE category_id = rec_ext_id AND tag_id = v_tag_id) THEN
    INSERT INTO public.category_tag_relations (category_id, tag_id, is_active) VALUES (rec_ext_id, v_tag_id, true);
  END IF;
END $$;