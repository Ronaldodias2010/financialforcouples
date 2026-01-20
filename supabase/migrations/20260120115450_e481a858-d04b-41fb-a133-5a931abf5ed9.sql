
-- ============================================
-- SUBCATEGORY REFINEMENT MIGRATION - CORRIGIDO
-- ============================================

-- Desabilitar triggers temporariamente
ALTER TABLE subcategories DISABLE TRIGGER tr_validate_subcategory_unique_across_categories;
ALTER TABLE subcategories DISABLE TRIGGER tr_sync_subcategory_to_partner;

-- ============================================
-- ETAPA 1: Remover duplicatas "iFood/Delivery" deixando apenas "delivery"
-- ============================================

-- Primeiro, deletar as entradas iFood/Delivery duplicadas
DELETE FROM subcategories 
WHERE LOWER(name) LIKE '%ifood%' 
  AND EXISTS (
    SELECT 1 FROM subcategories s2 
    WHERE s2.category_id = subcategories.category_id 
    AND LOWER(s2.name) = 'delivery'
    AND s2.id != subcategories.id
  );

-- Atualizar as restantes iFood/Delivery para delivery
UPDATE subcategories 
SET name = 'delivery', name_en = 'Food Delivery', name_es = 'Delivery'
WHERE LOWER(name) LIKE '%ifood%';

-- Update default_subcategories
UPDATE default_subcategories 
SET name = 'delivery', name_pt = 'delivery', name_en = 'Food Delivery', name_es = 'Delivery'
WHERE LOWER(name) LIKE '%ifood%';

-- ============================================
-- ETAPA 2: Capitalizar traduções EN em Investimentos
-- ============================================

UPDATE default_subcategories ds
SET name_en = CASE 
  WHEN LOWER(ds.name) = 'ações' THEN 'Stocks'
  WHEN LOWER(ds.name) = 'cashback' THEN 'Cashback'
  WHEN LOWER(ds.name) = 'corretagem' THEN 'Brokerage'
  WHEN LOWER(ds.name) = 'criptomoedas' THEN 'Cryptocurrency'
  WHEN LOWER(ds.name) = 'dividendos' THEN 'Dividends'
  WHEN LOWER(ds.name) = 'fundos imobiliários' THEN 'Real Estate Funds'
  WHEN LOWER(ds.name) = 'previdência privada' THEN 'Private Pension'
  WHEN LOWER(ds.name) = 'renda fixa' THEN 'Fixed Income'
  WHEN LOWER(ds.name) = 'tesouro direto' THEN 'Government Bonds'
  ELSE ds.name_en
END
WHERE ds.default_category_id = '4b29d2c4-6550-4ddb-b30b-001b07dd9bf0';

-- ============================================
-- ETAPA 3: Inserir subcategorias para EXPENSE
-- ============================================

-- Animais de Estimação
INSERT INTO default_subcategories (default_category_id, name, name_pt, name_en, name_es, sort_order)
SELECT dc.id, vals.name, vals.name, vals.name_en, vals.name_es, vals.sort_order
FROM default_categories dc
CROSS JOIN (VALUES 
  ('ração', 'Pet Food', 'Alimento Mascota', 1),
  ('veterinário', 'Veterinarian', 'Veterinario', 2),
  ('medicamentos pet', 'Pet Medication', 'Medicamentos Mascota', 3),
  ('banho e tosa', 'Grooming', 'Peluquería', 4),
  ('acessórios pet', 'Pet Accessories', 'Accesorios Mascota', 5)
) AS vals(name, name_en, name_es, sort_order)
WHERE LOWER(dc.name_pt) = 'animais de estimação'
AND NOT EXISTS (SELECT 1 FROM default_subcategories WHERE default_category_id = dc.id AND LOWER(name) = LOWER(vals.name));

-- Beleza & Cuidados Pessoais
INSERT INTO default_subcategories (default_category_id, name, name_pt, name_en, name_es, sort_order)
SELECT dc.id, vals.name, vals.name, vals.name_en, vals.name_es, vals.sort_order
FROM default_categories dc
CROSS JOIN (VALUES 
  ('salão e cabeleireiro', 'Hair Salon', 'Peluquería', 1),
  ('barbearia', 'Barbershop', 'Barbería', 2),
  ('manicure e pedicure', 'Nail Salon', 'Manicura', 3),
  ('estética e spa', 'Spa & Aesthetics', 'Estética y Spa', 4),
  ('cosméticos', 'Cosmetics', 'Cosméticos', 5)
) AS vals(name, name_en, name_es, sort_order)
WHERE LOWER(dc.name_pt) = 'beleza & cuidados pessoais'
AND NOT EXISTS (SELECT 1 FROM default_subcategories WHERE default_category_id = dc.id AND LOWER(name) = LOWER(vals.name));

-- Compras Pessoais
INSERT INTO default_subcategories (default_category_id, name, name_pt, name_en, name_es, sort_order)
SELECT dc.id, vals.name, vals.name, vals.name_en, vals.name_es, vals.sort_order
FROM default_categories dc
CROSS JOIN (VALUES 
  ('roupas', 'Clothing', 'Ropa', 1),
  ('calçados', 'Shoes', 'Calzado', 2),
  ('acessórios', 'Accessories', 'Accesorios', 3),
  ('eletrônicos', 'Electronics', 'Electrónicos', 4),
  ('casa e decoração', 'Home & Decor', 'Hogar y Decoración', 5)
) AS vals(name, name_en, name_es, sort_order)
WHERE LOWER(dc.name_pt) = 'compras pessoais'
AND NOT EXISTS (SELECT 1 FROM default_subcategories WHERE default_category_id = dc.id AND LOWER(name) = LOWER(vals.name));

-- Doações & Presentes
INSERT INTO default_subcategories (default_category_id, name, name_pt, name_en, name_es, sort_order)
SELECT dc.id, vals.name, vals.name, vals.name_en, vals.name_es, vals.sort_order
FROM default_categories dc
CROSS JOIN (VALUES 
  ('presentes', 'Gifts', 'Regalos', 1),
  ('doações', 'Donations', 'Donaciones', 2),
  ('caridade', 'Charity', 'Caridad', 3),
  ('dízimo e ofertas', 'Tithe & Offerings', 'Diezmo y Ofrendas', 4)
) AS vals(name, name_en, name_es, sort_order)
WHERE LOWER(dc.name_pt) = 'doações & presentes'
AND NOT EXISTS (SELECT 1 FROM default_subcategories WHERE default_category_id = dc.id AND LOWER(name) = LOWER(vals.name));

-- Família & Filhos
INSERT INTO default_subcategories (default_category_id, name, name_pt, name_en, name_es, sort_order)
SELECT dc.id, vals.name, vals.name, vals.name_en, vals.name_es, vals.sort_order
FROM default_categories dc
CROSS JOIN (VALUES 
  ('escola e creche', 'School & Daycare', 'Escuela y Guardería', 1),
  ('atividades extras', 'Extracurricular', 'Actividades Extras', 2),
  ('mesada', 'Allowance', 'Mesada', 3),
  ('brinquedos', 'Toys', 'Juguetes', 4),
  ('fraldas e higiene', 'Diapers & Hygiene', 'Pañales e Higiene', 5)
) AS vals(name, name_en, name_es, sort_order)
WHERE LOWER(dc.name_pt) = 'família & filhos'
AND NOT EXISTS (SELECT 1 FROM default_subcategories WHERE default_category_id = dc.id AND LOWER(name) = LOWER(vals.name));

-- Finanças & Serviços
INSERT INTO default_subcategories (default_category_id, name, name_pt, name_en, name_es, sort_order)
SELECT dc.id, vals.name, vals.name, vals.name_en, vals.name_es, vals.sort_order
FROM default_categories dc
CROSS JOIN (VALUES 
  ('taxas bancárias', 'Bank Fees', 'Tasas Bancarias', 1),
  ('anuidade cartão', 'Card Annual Fee', 'Anualidad Tarjeta', 2),
  ('juros', 'Interest', 'Intereses', 3),
  ('IOF', 'IOF Tax', 'Impuesto IOF', 4),
  ('seguros', 'Insurance', 'Seguros', 5),
  ('contabilidade', 'Accounting', 'Contabilidad', 6)
) AS vals(name, name_en, name_es, sort_order)
WHERE LOWER(dc.name_pt) = 'finanças & serviços'
AND NOT EXISTS (SELECT 1 FROM default_subcategories WHERE default_category_id = dc.id AND LOWER(name) = LOWER(vals.name));

-- Lazer & Entretenimento
INSERT INTO default_subcategories (default_category_id, name, name_pt, name_en, name_es, sort_order)
SELECT dc.id, vals.name, vals.name, vals.name_en, vals.name_es, vals.sort_order
FROM default_categories dc
CROSS JOIN (VALUES 
  ('cinema', 'Movies', 'Cine', 1),
  ('shows e eventos', 'Concerts & Events', 'Shows y Eventos', 2),
  ('esportes', 'Sports', 'Deportes', 3),
  ('streaming', 'Streaming', 'Streaming', 4),
  ('jogos', 'Games', 'Juegos', 5),
  ('hobbies', 'Hobbies', 'Pasatiempos', 6),
  ('bar e balada', 'Bar & Nightclub', 'Bar y Discoteca', 7)
) AS vals(name, name_en, name_es, sort_order)
WHERE LOWER(dc.name_pt) = 'lazer & entretenimento'
AND NOT EXISTS (SELECT 1 FROM default_subcategories WHERE default_category_id = dc.id AND LOWER(name) = LOWER(vals.name));

-- Outros (expense)
INSERT INTO default_subcategories (default_category_id, name, name_pt, name_en, name_es, sort_order)
SELECT dc.id, vals.name, vals.name, vals.name_en, vals.name_es, vals.sort_order
FROM default_categories dc
CROSS JOIN (VALUES 
  ('diversos', 'Miscellaneous', 'Varios', 1),
  ('não categorizado', 'Uncategorized', 'Sin Categoría', 2)
) AS vals(name, name_en, name_es, sort_order)
WHERE LOWER(dc.name_pt) = 'outros' AND dc.category_type = 'expense'
AND NOT EXISTS (SELECT 1 FROM default_subcategories WHERE default_category_id = dc.id AND LOWER(name) = LOWER(vals.name));

-- Quitação Dívida Crédito
INSERT INTO default_subcategories (default_category_id, name, name_pt, name_en, name_es, sort_order)
SELECT dc.id, vals.name, vals.name, vals.name_en, vals.name_es, vals.sort_order
FROM default_categories dc
CROSS JOIN (VALUES 
  ('fatura cartão', 'Credit Card Bill', 'Factura Tarjeta', 1),
  ('empréstimo', 'Loan Payment', 'Pago Préstamo', 2),
  ('financiamento', 'Financing', 'Financiación', 3),
  ('cheque especial', 'Overdraft', 'Sobregiro', 4),
  ('parcelamento', 'Installment', 'Cuotas', 5)
) AS vals(name, name_en, name_es, sort_order)
WHERE LOWER(dc.name_pt) = 'quitação dívida crédito'
AND NOT EXISTS (SELECT 1 FROM default_subcategories WHERE default_category_id = dc.id AND LOWER(name) = LOWER(vals.name));

-- Reforma & Construção
INSERT INTO default_subcategories (default_category_id, name, name_pt, name_en, name_es, sort_order)
SELECT dc.id, vals.name, vals.name, vals.name_en, vals.name_es, vals.sort_order
FROM default_categories dc
CROSS JOIN (VALUES 
  ('materiais', 'Materials', 'Materiales', 1),
  ('mão de obra', 'Labor', 'Mano de Obra', 2),
  ('móveis planejados', 'Custom Furniture', 'Muebles a Medida', 3),
  ('pintura', 'Painting', 'Pintura', 4),
  ('acabamentos', 'Finishing', 'Acabados', 5)
) AS vals(name, name_en, name_es, sort_order)
WHERE LOWER(dc.name_pt) = 'reforma & construção'
AND NOT EXISTS (SELECT 1 FROM default_subcategories WHERE default_category_id = dc.id AND LOWER(name) = LOWER(vals.name));

-- Saque
INSERT INTO default_subcategories (default_category_id, name, name_pt, name_en, name_es, sort_order)
SELECT dc.id, vals.name, vals.name, vals.name_en, vals.name_es, vals.sort_order
FROM default_categories dc
CROSS JOIN (VALUES 
  ('caixa eletrônico', 'ATM', 'Cajero Automático', 1),
  ('transferência pessoal', 'Personal Transfer', 'Transferencia Personal', 2)
) AS vals(name, name_en, name_es, sort_order)
WHERE LOWER(dc.name_pt) = 'saque'
AND NOT EXISTS (SELECT 1 FROM default_subcategories WHERE default_category_id = dc.id AND LOWER(name) = LOWER(vals.name));

-- Tecnologia & Assinaturas Digitais
INSERT INTO default_subcategories (default_category_id, name, name_pt, name_en, name_es, sort_order)
SELECT dc.id, vals.name, vals.name, vals.name_en, vals.name_es, vals.sort_order
FROM default_categories dc
CROSS JOIN (VALUES 
  ('apps e serviços', 'Apps & Services', 'Apps y Servicios', 1),
  ('software', 'Software', 'Software', 2),
  ('armazenamento cloud', 'Cloud Storage', 'Almacenamiento Nube', 3),
  ('assinaturas', 'Subscriptions', 'Suscripciones', 4),
  ('equipamentos tech', 'Tech Equipment', 'Equipos Tech', 5)
) AS vals(name, name_en, name_es, sort_order)
WHERE LOWER(dc.name_pt) = 'tecnologia & assinaturas digitais'
AND NOT EXISTS (SELECT 1 FROM default_subcategories WHERE default_category_id = dc.id AND LOWER(name) = LOWER(vals.name));

-- Trabalho & Negócios
INSERT INTO default_subcategories (default_category_id, name, name_pt, name_en, name_es, sort_order)
SELECT dc.id, vals.name, vals.name, vals.name_en, vals.name_es, vals.sort_order
FROM default_categories dc
CROSS JOIN (VALUES 
  ('material escritório', 'Office Supplies', 'Material Oficina', 1),
  ('equipamentos', 'Equipment', 'Equipos', 2),
  ('coworking', 'Coworking', 'Coworking', 3),
  ('marketing', 'Marketing', 'Marketing', 4),
  ('serviços profissionais', 'Professional Services', 'Servicios Profesionales', 5)
) AS vals(name, name_en, name_es, sort_order)
WHERE LOWER(dc.name_pt) = 'trabalho & negócios'
AND NOT EXISTS (SELECT 1 FROM default_subcategories WHERE default_category_id = dc.id AND LOWER(name) = LOWER(vals.name));

-- Veículos & Financiamentos
INSERT INTO default_subcategories (default_category_id, name, name_pt, name_en, name_es, sort_order)
SELECT dc.id, vals.name, vals.name, vals.name_en, vals.name_es, vals.sort_order
FROM default_categories dc
CROSS JOIN (VALUES 
  ('financiamento veículo', 'Vehicle Financing', 'Financiación Vehículo', 1),
  ('seguro veículo', 'Vehicle Insurance', 'Seguro Vehículo', 2),
  ('IPVA e licenciamento', 'Vehicle Tax & Registration', 'Impuesto y Registro Vehículo', 3),
  ('manutenção', 'Maintenance', 'Mantenimiento', 4),
  ('lavagem', 'Car Wash', 'Lavado', 5),
  ('multas', 'Fines', 'Multas', 6)
) AS vals(name, name_en, name_es, sort_order)
WHERE LOWER(dc.name_pt) = 'veículos & financiamentos'
AND NOT EXISTS (SELECT 1 FROM default_subcategories WHERE default_category_id = dc.id AND LOWER(name) = LOWER(vals.name));

-- Viagens
INSERT INTO default_subcategories (default_category_id, name, name_pt, name_en, name_es, sort_order)
SELECT dc.id, vals.name, vals.name, vals.name_en, vals.name_es, vals.sort_order
FROM default_categories dc
CROSS JOIN (VALUES 
  ('hospedagem', 'Accommodation', 'Hospedaje', 1),
  ('passagens', 'Tickets', 'Pasajes', 2),
  ('alimentação viagem', 'Travel Food', 'Alimentación Viaje', 3),
  ('passeios e tours', 'Tours', 'Tours', 4),
  ('transporte local', 'Local Transport', 'Transporte Local', 5)
) AS vals(name, name_en, name_es, sort_order)
WHERE LOWER(dc.name_pt) = 'viagens'
AND NOT EXISTS (SELECT 1 FROM default_subcategories WHERE default_category_id = dc.id AND LOWER(name) = LOWER(vals.name));

-- ============================================
-- ETAPA 4: Inserir subcategorias para INCOME
-- ============================================

-- Aluguel Recebido
INSERT INTO default_subcategories (default_category_id, name, name_pt, name_en, name_es, sort_order)
SELECT dc.id, vals.name, vals.name, vals.name_en, vals.name_es, vals.sort_order
FROM default_categories dc
CROSS JOIN (VALUES 
  ('imóvel residencial', 'Residential Rental', 'Alquiler Residencial', 1),
  ('imóvel comercial', 'Commercial Rental', 'Alquiler Comercial', 2),
  ('temporada e airbnb', 'Vacation Rental', 'Alquiler Vacacional', 3)
) AS vals(name, name_en, name_es, sort_order)
WHERE LOWER(dc.name_pt) = 'aluguel recebido'
AND NOT EXISTS (SELECT 1 FROM default_subcategories WHERE default_category_id = dc.id AND LOWER(name) = LOWER(vals.name));

-- Bônus
INSERT INTO default_subcategories (default_category_id, name, name_pt, name_en, name_es, sort_order)
SELECT dc.id, vals.name, vals.name, vals.name_en, vals.name_es, vals.sort_order
FROM default_categories dc
CROSS JOIN (VALUES 
  ('bônus anual', 'Annual Bonus', 'Bono Anual', 1),
  ('gratificação', 'Gratuity', 'Gratificación', 2),
  ('prêmio desempenho', 'Performance Bonus', 'Premio Desempeño', 3)
) AS vals(name, name_en, name_es, sort_order)
WHERE LOWER(dc.name_pt) = 'bônus'
AND NOT EXISTS (SELECT 1 FROM default_subcategories WHERE default_category_id = dc.id AND LOWER(name) = LOWER(vals.name));

-- Freelance
INSERT INTO default_subcategories (default_category_id, name, name_pt, name_en, name_es, sort_order)
SELECT dc.id, vals.name, vals.name, vals.name_en, vals.name_es, vals.sort_order
FROM default_categories dc
CROSS JOIN (VALUES 
  ('projeto', 'Project', 'Proyecto', 1),
  ('consultoria', 'Consulting', 'Consultoría', 2),
  ('serviço pontual', 'One-time Service', 'Servicio Puntual', 3)
) AS vals(name, name_en, name_es, sort_order)
WHERE LOWER(dc.name_pt) = 'freelance'
AND NOT EXISTS (SELECT 1 FROM default_subcategories WHERE default_category_id = dc.id AND LOWER(name) = LOWER(vals.name));

-- Outros (income)
INSERT INTO default_subcategories (default_category_id, name, name_pt, name_en, name_es, sort_order)
SELECT dc.id, vals.name, vals.name, vals.name_en, vals.name_es, vals.sort_order
FROM default_categories dc
CROSS JOIN (VALUES 
  ('diversos', 'Miscellaneous', 'Varios', 1),
  ('não categorizado', 'Uncategorized', 'Sin Categoría', 2)
) AS vals(name, name_en, name_es, sort_order)
WHERE LOWER(dc.name_pt) = 'outros' AND dc.category_type = 'income'
AND NOT EXISTS (SELECT 1 FROM default_subcategories WHERE default_category_id = dc.id AND LOWER(name) = LOWER(vals.name));

-- Vendas
INSERT INTO default_subcategories (default_category_id, name, name_pt, name_en, name_es, sort_order)
SELECT dc.id, vals.name, vals.name, vals.name_en, vals.name_es, vals.sort_order
FROM default_categories dc
CROSS JOIN (VALUES 
  ('produtos', 'Products', 'Productos', 1),
  ('usados e seminovos', 'Used Items', 'Artículos Usados', 2),
  ('artesanato', 'Handmade', 'Artesanía', 3)
) AS vals(name, name_en, name_es, sort_order)
WHERE LOWER(dc.name_pt) = 'vendas'
AND NOT EXISTS (SELECT 1 FROM default_subcategories WHERE default_category_id = dc.id AND LOWER(name) = LOWER(vals.name));

-- ============================================
-- ETAPA 5: Migração retroativa para usuários (com proteção contra duplicatas)
-- ============================================

-- Criar subcategorias para todas as categorias de usuários que ainda não têm
INSERT INTO subcategories (category_id, user_id, name, name_en, name_es)
SELECT DISTINCT ON (c.id, LOWER(TRIM(ds.name)))
  c.id as category_id,
  c.user_id,
  ds.name,
  ds.name_en,
  ds.name_es
FROM categories c
JOIN default_categories dc ON dc.id = c.default_category_id
JOIN default_subcategories ds ON ds.default_category_id = dc.id
WHERE c.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM subcategories s 
    WHERE s.category_id = c.id 
      AND s.user_id = c.user_id
      AND LOWER(TRIM(s.name)) = LOWER(TRIM(ds.name))
  )
ON CONFLICT (user_id, category_id, name) DO NOTHING;

-- ============================================
-- Reabilitar triggers
-- ============================================
ALTER TABLE subcategories ENABLE TRIGGER tr_validate_subcategory_unique_across_categories;
ALTER TABLE subcategories ENABLE TRIGGER tr_sync_subcategory_to_partner;
