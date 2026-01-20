-- Desabilitar temporariamente os triggers de validação
ALTER TABLE subcategories DISABLE TRIGGER tr_validate_subcategory_unique_across_categories;
ALTER TABLE subcategories DISABLE TRIGGER tr_sync_subcategory_to_partner;

-- 1. Inserir default_subcategories para Investimentos
INSERT INTO default_subcategories (default_category_id, name, name_pt, name_en, name_es, sort_order)
SELECT 
  '4b29d2c4-6550-4ddb-b30b-001b07dd9bf0',
  vals.name, vals.name, vals.name_en, vals.name_es, vals.sort_order
FROM (VALUES 
  ('ações', 'stocks', 'acciones', 1),
  ('cashback', 'cashback', 'cashback', 2),
  ('corretagem', 'brokerage', 'corretaje', 3),
  ('criptomoedas', 'cryptocurrency', 'criptomonedas', 4),
  ('dividendos', 'dividends', 'dividendos', 5),
  ('fundos imobiliários', 'real estate funds', 'fondos inmobiliarios', 6),
  ('previdência privada', 'private pension', 'pensión privada', 7),
  ('renda fixa', 'fixed income', 'renta fija', 8),
  ('tesouro direto', 'government bonds', 'bonos del tesoro', 9)
) AS vals(name, name_en, name_es, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM default_subcategories 
  WHERE default_category_id = '4b29d2c4-6550-4ddb-b30b-001b07dd9bf0' AND LOWER(name) = LOWER(vals.name)
);

-- 2. Inserir default_subcategories para Receita Extraordinária
INSERT INTO default_subcategories (default_category_id, name, name_pt, name_en, name_es, sort_order)
SELECT 
  '500097e5-4589-4223-ad9e-74ac334ebeb9',
  vals.name, vals.name, vals.name_en, vals.name_es, vals.sort_order
FROM (VALUES 
  ('auxílio/benefício', 'government aid', 'ayuda gubernamental', 1),
  ('doações recebidas', 'donations received', 'donaciones recibidas', 2),
  ('herança', 'inheritance', 'herencia', 3),
  ('indenizações', 'compensation', 'indemnizaciones', 4),
  ('loteria', 'lottery', 'lotería', 5),
  ('restituição de impostos', 'tax refund', 'devolución de impuestos', 6),
  ('venda de bens', 'asset sales', 'venta de bienes', 7)
) AS vals(name, name_en, name_es, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM default_subcategories 
  WHERE default_category_id = '500097e5-4589-4223-ad9e-74ac334ebeb9' AND LOWER(name) = LOWER(vals.name)
);

-- 3. Inserir default_subcategories para Salário
INSERT INTO default_subcategories (default_category_id, name, name_pt, name_en, name_es, sort_order)
SELECT 
  '23b16cfb-c82a-4134-a1ee-e7ae72f28139',
  vals.name, vals.name, vals.name_en, vals.name_es, vals.sort_order
FROM (VALUES 
  ('13º salário', '13th salary', '13er salario', 1),
  ('plr/participação', 'profit sharing', 'participación utilidades', 2),
  ('salário mensal', 'monthly salary', 'salario mensual', 3)
) AS vals(name, name_en, name_es, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM default_subcategories 
  WHERE default_category_id = '23b16cfb-c82a-4134-a1ee-e7ae72f28139' AND LOWER(name) = LOWER(vals.name)
);

-- 4. Criar subcategorias retroativas para categorias de income que ainda não têm
INSERT INTO subcategories (category_id, user_id, name, name_en, name_es)
SELECT 
  c.id as category_id,
  c.user_id,
  ds.name,
  ds.name_en,
  ds.name_es
FROM categories c
JOIN default_categories dc ON LOWER(dc.name_pt) = LOWER(c.name) AND dc.category_type = 'income'
JOIN default_subcategories ds ON ds.default_category_id = dc.id
WHERE c.category_type = 'income'
  AND c.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM subcategories s 
    WHERE s.category_id = c.id 
      AND LOWER(TRIM(s.name)) = LOWER(TRIM(ds.name))
  );

-- Reabilitar os triggers
ALTER TABLE subcategories ENABLE TRIGGER tr_validate_subcategory_unique_across_categories;
ALTER TABLE subcategories ENABLE TRIGGER tr_sync_subcategory_to_partner;