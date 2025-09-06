
-- 1) Remover relações e categorias padrão de SAÍDA (expense), e limpar tags órfãs
WITH exp_cats AS (
  SELECT id
  FROM public.default_categories
  WHERE category_type = 'expense'
)
DELETE FROM public.category_tag_relations
WHERE category_id IN (SELECT id FROM exp_cats);

DELETE FROM public.default_categories
WHERE id IN (SELECT id FROM exp_cats);

-- Remover tags órfãs (que não estejam relacionadas a nenhuma categoria)
DELETE FROM public.category_tags t
WHERE NOT EXISTS (
  SELECT 1 FROM public.category_tag_relations r
  WHERE r.tag_id = t.id
);

-- 2) Inserir as 12 novas categorias de SAÍDA (duplicando PT para EN/ES para manter não-nulos)
WITH new_cats AS (
  INSERT INTO public.default_categories
    (name_pt,               name_en,               name_es,               description_pt, description_en, description_es, color,     icon, category_type)
  VALUES
    ('Alimentação',         'Alimentação',         'Alimentação',         NULL,           NULL,           NULL,           '#6366f1', NULL,  'expense'),
    ('Transporte',          'Transporte',          'Transporte',          NULL,           NULL,           NULL,           '#6366f1', NULL,  'expense'),
    ('Moradia',             'Moradia',             'Moradia',             NULL,           NULL,           NULL,           '#6366f1', NULL,  'expense'),
    ('Saúde',               'Saúde',               'Saúde',               NULL,           NULL,           NULL,           '#6366f1', NULL,  'expense'),
    ('Educação',            'Educação',            'Educação',            NULL,           NULL,           NULL,           '#6366f1', NULL,  'expense'),
    ('Lazer & Entretenimento','Lazer & Entretenimento','Lazer & Entretenimento',NULL,     NULL,           NULL,           '#6366f1', NULL,  'expense'),
    ('Compras Pessoais',    'Compras Pessoais',    'Compras Pessoais',    NULL,           NULL,           NULL,           '#6366f1', NULL,  'expense'),
    ('Família & Filhos',    'Família & Filhos',    'Família & Filhos',    NULL,           NULL,           NULL,           '#6366f1', NULL,  'expense'),
    ('Finanças & Serviços', 'Finanças & Serviços', 'Finanças & Serviços', NULL,           NULL,           NULL,           '#6366f1', NULL,  'expense'),
    ('Trabalho & Negócios', 'Trabalho & Negócios', 'Trabalho & Negócios', NULL,           NULL,           NULL,           '#6366f1', NULL,  'expense'),
    ('Doações & Presentes', 'Doações & Presentes', 'Doações & Presentes', NULL,           NULL,           NULL,           '#6366f1', NULL,  'expense'),
    ('Outros',              'Outros',              'Outros',              NULL,           NULL,           NULL,           '#6366f1', NULL,  'expense')
  RETURNING name_pt, id
),
-- 3) Inserir tags (evitando duplicatas por nome_pt, case-insensitive)
inserted_tags AS (
  WITH tag_list(name_pt) AS (
    VALUES
      ('supermercado'), ('padaria'), ('restaurante'), ('lanchonete'), ('delivery'), ('feira'), ('café'), ('fast food'),
      ('combustível'), ('uber/99'), ('ônibus'), ('metrô'), ('pedágio'), ('estacionamento'), ('manutenção veículo'), ('táxi'),
      ('aluguel'), ('condomínio'), ('luz'), ('água'), ('gás'), ('internet'), ('telefone fixo'), ('manutenção'), ('móveis'), ('eletrodomésticos'),
      ('farmácia'), ('plano de saúde'), ('exames'), ('consultas'), ('academia'), ('hospital'), ('terapia'),
      ('faculdade'), ('curso online'), ('livros'), ('material escolar'), ('palestras'), ('treinamentos'),
      ('cinema'), ('shows'), ('streaming (Netflix, Spotify, etc.)'), ('bar'), ('viagem'), ('festas'), ('hobbies'), ('esportes'),
      ('roupas'), ('calçados'), ('acessórios'), ('eletrônicos'), ('cosméticos'), ('perfumaria'),
      ('escola'), ('creche'), ('brinquedos'), ('roupas infantis'), ('mesada'), ('cuidados'),
      ('taxas bancárias'), ('seguros'), ('investimentos'), ('impostos'), ('mensalidades'), ('assinatura de serviços'),
      ('coworking'), ('software'), ('equipamentos'), ('viagens de trabalho'), ('marketing'), ('impostos PJ'),
      ('presentes'), ('doações'), ('caridade'), ('festas de aniversário'), ('casamentos'),
      ('emergências'), ('imprevistos'), ('não categorizados')
  )
  INSERT INTO public.category_tags (name_pt, name_en, name_es, color, icon, keywords_pt, keywords_en, keywords_es)
  SELECT
    tl.name_pt,
    tl.name_pt, -- TEMP: replicar para EN
    tl.name_pt, -- TEMP: replicar para ES
    '#6366f1',
    NULL,
    ARRAY[tl.name_pt],
    ARRAY[tl.name_pt],
    ARRAY[tl.name_pt]
  FROM tag_list tl
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.category_tags ct
    WHERE lower(ct.name_pt) = lower(tl.name_pt)
  )
  RETURNING name_pt, id
),
-- Consolidar o conjunto completo de tags (as já existentes + as recém inseridas)
all_tags AS (
  SELECT name_pt, id
  FROM inserted_tags
  UNION
  SELECT ct.name_pt, ct.id
  FROM public.category_tags ct
  WHERE lower(ct.name_pt) IN (
    SELECT lower(name_pt) FROM (VALUES
      ('supermercado'), ('padaria'), ('restaurante'), ('lanchonete'), ('delivery'), ('feira'), ('café'), ('fast food'),
      ('combustível'), ('uber/99'), ('ônibus'), ('metrô'), ('pedágio'), ('estacionamento'), ('manutenção veículo'), ('táxi'),
      ('aluguel'), ('condomínio'), ('luz'), ('água'), ('gás'), ('internet'), ('telefone fixo'), ('manutenção'), ('móveis'), ('eletrodomésticos'),
      ('farmácia'), ('plano de saúde'), ('exames'), ('consultas'), ('academia'), ('hospital'), ('terapia'),
      ('faculdade'), ('curso online'), ('livros'), ('material escolar'), ('palestras'), ('treinamentos'),
      ('cinema'), ('shows'), ('streaming (Netflix, Spotify, etc.)'), ('bar'), ('viagem'), ('festas'), ('hobbies'), ('esportes'),
      ('roupas'), ('calçados'), ('acessórios'), ('eletrônicos'), ('cosméticos'), ('perfumaria'),
      ('escola'), ('creche'), ('brinquedos'), ('roupas infantis'), ('mesada'), ('cuidados'),
      ('taxas bancárias'), ('seguros'), ('investimentos'), ('impostos'), ('mensalidades'), ('assinatura de serviços'),
      ('coworking'), ('software'), ('equipamentos'), ('viagens de trabalho'), ('marketing'), ('impostos PJ'),
      ('presentes'), ('doações'), ('caridade'), ('festas de aniversário'), ('casamentos'),
      ('emergências'), ('imprevistos'), ('não categorizados')
    ) t(name_pt)
  )
)

-- 4) Vincular tags às categorias correspondentes

-- Alimentação
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT (SELECT id FROM new_cats WHERE name_pt = 'Alimentação'), at.id
FROM all_tags at
WHERE lower(at.name_pt) IN ('supermercado','padaria','restaurante','lanchonete','delivery','feira','café','fast food');

-- Transporte
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT (SELECT id FROM new_cats WHERE name_pt = 'Transporte'), at.id
FROM all_tags at
WHERE lower(at.name_pt) IN ('combustível','uber/99','ônibus','metrô','pedágio','estacionamento','manutenção veículo','táxi');

-- Moradia
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT (SELECT id FROM new_cats WHERE name_pt = 'Moradia'), at.id
FROM all_tags at
WHERE lower(at.name_pt) IN ('aluguel','condomínio','luz','água','gás','internet','telefone fixo','manutenção','móveis','eletrodomésticos');

-- Saúde
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT (SELECT id FROM new_cats WHERE name_pt = 'Saúde'), at.id
FROM all_tags at
WHERE lower(at.name_pt) IN ('farmácia','plano de saúde','exames','consultas','academia','hospital','terapia');

-- Educação
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT (SELECT id FROM new_cats WHERE name_pt = 'Educação'), at.id
FROM all_tags at
WHERE lower(at.name_pt) IN ('faculdade','curso online','livros','material escolar','palestras','treinamentos');

-- Lazer & Entretenimento
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT (SELECT id FROM new_cats WHERE name_pt = 'Lazer & Entretenimento'), at.id
FROM all_tags at
WHERE lower(at.name_pt) IN ('cinema','shows','streaming (netflix, spotify, etc.)','bar','viagem','festas','hobbies','esportes');

-- Compras Pessoais
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT (SELECT id FROM new_cats WHERE name_pt = 'Compras Pessoais'), at.id
FROM all_tags at
WHERE lower(at.name_pt) IN ('roupas','calçados','acessórios','eletrônicos','cosméticos','perfumaria');

-- Família & Filhos
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT (SELECT id FROM new_cats WHERE name_pt = 'Família & Filhos'), at.id
FROM all_tags at
WHERE lower(at.name_pt) IN ('escola','creche','brinquedos','roupas infantis','mesada','cuidados');

-- Finanças & Serviços
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT (SELECT id FROM new_cats WHERE name_pt = 'Finanças & Serviços'), at.id
FROM all_tags at
WHERE lower(at.name_pt) IN ('taxas bancárias','seguros','investimentos','impostos','mensalidades','assinatura de serviços');

-- Trabalho & Negócios
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT (SELECT id FROM new_cats WHERE name_pt = 'Trabalho & Negócios'), at.id
FROM all_tags at
WHERE lower(at.name_pt) IN ('coworking','software','equipamentos','viagens de trabalho','marketing','impostos pj');

-- Doações & Presentes
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT (SELECT id FROM new_cats WHERE name_pt = 'Doações & Presentes'), at.id
FROM all_tags at
WHERE lower(at.name_pt) IN ('presentes','doações','caridade','festas de aniversário','casamentos');

-- Outros
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT (SELECT id FROM new_cats WHERE name_pt = 'Outros'), at.id
FROM all_tags at
WHERE lower(at.name_pt) IN ('emergências','imprevistos','não categorizados');
