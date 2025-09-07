-- Corrigir unificação de "Investimentos" sem usar updated_at
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
    -- Padroniza nomes para plural e traduções (sem atualizar updated_at)
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

-- Limpeza de duplicados nas categorias de usuários (qualquer tipo)
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

-- Garantir existência da categoria padrão "Receita Extraordinária" (income)
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

-- Inserir/garantir tags para "Receita Extraordinária"
DO $$
DECLARE
  rec_ext_id uuid;
  tag_defs TEXT[][] := ARRAY[
    ARRAY['Herança','Inheritance','Herencia'],
    ARRAY['Doações Recebidas','Donations Received','Donaciones Recibidas'],
    ARRAY['Loteria','Lottery','Lotería'],
    ARRAY['Indenizações','Compensation','Indemnizaciones'],
    ARRAY['Restituição de Impostos','Tax Refund','Devolución de Impuestos']
  ];
  kw_pt TEXT[][] := ARRAY[
    ARRAY['herança','heranca','hereditário','hereditario','patrimônio'],
    ARRAY['doação','doacoes','doado','doacao','doações recebidas'],
    ARRAY['loteria','mega sena','prêmio','premio','premiação','sorteio','aposta'],
    ARRAY['indenização','indenizacao','acordo','seguro','ressarcimento','danos morais'],
    ARRAY['restituição','restituicao','imposto de renda','ir','reembolso de imposto','impostos']
  ];
  kw_en TEXT[][] := ARRAY[
    ARRAY['inheritance','estate','bequest'],
    ARRAY['donation','donations received','gift income'],
    ARRAY['lottery','jackpot','prize','raffle','winnings'],
    ARRAY['compensation','settlement','insurance payout','damages'],
    ARRAY['tax refund','income tax refund','tax return refund']
  ];
  kw_es TEXT[][] := ARRAY[
    ARRAY['herencia','heredado','legado'],
    ARRAY['donación','donaciones recibidas','regalo'],
    ARRAY['lotería','premio','bote','rifa'],
    ARRAY['indemnización','acuerdo','pago de seguro','daños'],
    ARRAY['devolución de impuestos','reembolso de impuestos','impuesto sobre la renta']
  ];
  i INT;
  v_tag_id uuid;
BEGIN
  -- Obter id da categoria padrão de Receita Extraordinária
  SELECT id INTO rec_ext_id
  FROM public.default_categories
  WHERE category_type = 'income'
    AND public.normalize_text_simple(name_pt) = public.normalize_text_simple('Receita Extraordinária')
  LIMIT 1;

  IF rec_ext_id IS NULL THEN
    RAISE EXCEPTION 'Categoria padrão "Receita Extraordinária" não encontrada';
  END IF;

  -- Para cada tag
  FOR i IN 1..array_length(tag_defs, 1) LOOP
    -- Upsert-like para category_tags sem ON CONFLICT
    SELECT id INTO v_tag_id
    FROM public.category_tags
    WHERE public.normalize_text_simple(name_pt) = public.normalize_text_simple(tag_defs[i][1])
    LIMIT 1;

    IF v_tag_id IS NULL THEN
      INSERT INTO public.category_tags (
        name_pt, name_en, name_es,
        keywords_pt, keywords_en, keywords_es,
        color, icon
      ) VALUES (
        tag_defs[i][1], tag_defs[i][2], tag_defs[i][3],
        kw_pt[i], kw_en[i], kw_es[i],
        '#6366f1', NULL
      ) RETURNING id INTO v_tag_id;
    END IF;

    -- Relacionar com categoria se necessário
    IF NOT EXISTS (
      SELECT 1 FROM public.category_tag_relations ctr
      WHERE ctr.category_id = rec_ext_id AND ctr.tag_id = v_tag_id
    ) THEN
      INSERT INTO public.category_tag_relations (category_id, tag_id, is_active)
      VALUES (rec_ext_id, v_tag_id, true);
    END IF;
  END LOOP;
END $$;
