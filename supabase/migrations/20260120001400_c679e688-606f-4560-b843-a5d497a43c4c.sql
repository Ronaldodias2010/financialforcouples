-- ==============================================
-- FASE 1: Criar tabela de subcategorias padrão do sistema
-- ==============================================

CREATE TABLE IF NOT EXISTS default_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  default_category_id UUID REFERENCES default_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_en TEXT,
  name_es TEXT,
  name_pt TEXT,
  color TEXT DEFAULT '#6366f1',
  icon TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(default_category_id, name)
);

-- ==============================================
-- FASE 2: Inserir subcategorias padrão
-- ==============================================

-- Alimentação
INSERT INTO default_subcategories (default_category_id, name, name_en, name_es, name_pt, color, sort_order)
SELECT dc.id, sub.name, sub.name_en, sub.name_es, sub.name_pt, sub.color, sub.sort_order
FROM default_categories dc
CROSS JOIN (VALUES
  ('Supermercado', 'Supermarket', 'Supermercado', 'Supermercado', '#22c55e', 1),
  ('Restaurante', 'Restaurant', 'Restaurante', 'Restaurante', '#f97316', 2),
  ('iFood/Delivery', 'Food Delivery', 'Delivery', 'iFood/Delivery', '#ef4444', 3),
  ('Padaria', 'Bakery', 'Panadería', 'Padaria', '#eab308', 4),
  ('Feira/Hortifruti', 'Farmers Market', 'Feria', 'Feira/Hortifruti', '#84cc16', 5),
  ('Fast Food', 'Fast Food', 'Comida Rápida', 'Fast Food', '#f59e0b', 6),
  ('Café/Lanche', 'Coffee/Snack', 'Café/Merienda', 'Café/Lanche', '#a3a3a3', 7),
  ('Açougue', 'Butcher', 'Carnicería', 'Açougue', '#dc2626', 8)
) AS sub(name, name_en, name_es, name_pt, color, sort_order)
WHERE dc.name_pt = 'Alimentação'
ON CONFLICT (default_category_id, name) DO NOTHING;

-- Transporte
INSERT INTO default_subcategories (default_category_id, name, name_en, name_es, name_pt, color, sort_order)
SELECT dc.id, sub.name, sub.name_en, sub.name_es, sub.name_pt, sub.color, sub.sort_order
FROM default_categories dc
CROSS JOIN (VALUES
  ('Uber/99/Táxi', 'Rideshare/Taxi', 'Uber/Taxi', 'Uber/99/Táxi', '#6366f1', 1),
  ('Combustível', 'Fuel', 'Combustible', 'Combustível', '#f97316', 2),
  ('Estacionamento', 'Parking', 'Estacionamiento', 'Estacionamento', '#3b82f6', 3),
  ('Pedágio', 'Toll', 'Peaje', 'Pedágio', '#8b5cf6', 4),
  ('Transporte Público', 'Public Transit', 'Transporte Público', 'Transporte Público', '#22c55e', 5),
  ('Passagem Aérea', 'Flight', 'Vuelo', 'Passagem Aérea', '#0ea5e9', 6)
) AS sub(name, name_en, name_es, name_pt, color, sort_order)
WHERE dc.name_pt = 'Transporte'
ON CONFLICT (default_category_id, name) DO NOTHING;

-- Moradia
INSERT INTO default_subcategories (default_category_id, name, name_en, name_es, name_pt, color, sort_order)
SELECT dc.id, sub.name, sub.name_en, sub.name_es, sub.name_pt, sub.color, sub.sort_order
FROM default_categories dc
CROSS JOIN (VALUES
  ('Aluguel', 'Rent', 'Alquiler', 'Aluguel', '#3b82f6', 1),
  ('Condomínio', 'HOA/Condo Fee', 'Condominio', 'Condomínio', '#6366f1', 2),
  ('IPTU', 'Property Tax', 'Impuesto Predial', 'IPTU', '#f59e0b', 3),
  ('Luz/Energia', 'Electricity', 'Electricidad', 'Luz/Energia', '#eab308', 4),
  ('Água', 'Water', 'Agua', 'Água', '#0ea5e9', 5),
  ('Gás', 'Gas', 'Gas', 'Gás', '#f97316', 6),
  ('Internet', 'Internet', 'Internet', 'Internet', '#8b5cf6', 7),
  ('Hidráulica', 'Plumbing', 'Plomería', 'Hidráulica', '#06b6d4', 8),
  ('Elétrica', 'Electrical', 'Electricidad', 'Elétrica', '#fbbf24', 9),
  ('Manutenção', 'Maintenance', 'Mantenimiento', 'Manutenção', '#a3a3a3', 10)
) AS sub(name, name_en, name_es, name_pt, color, sort_order)
WHERE dc.name_pt = 'Moradia'
ON CONFLICT (default_category_id, name) DO NOTHING;

-- Saúde
INSERT INTO default_subcategories (default_category_id, name, name_en, name_es, name_pt, color, sort_order)
SELECT dc.id, sub.name, sub.name_en, sub.name_es, sub.name_pt, sub.color, sub.sort_order
FROM default_categories dc
CROSS JOIN (VALUES
  ('Farmácia', 'Pharmacy', 'Farmacia', 'Farmácia', '#22c55e', 1),
  ('Consulta Médica', 'Doctor Visit', 'Consulta Médica', 'Consulta Médica', '#3b82f6', 2),
  ('Exames', 'Lab Tests', 'Exámenes', 'Exames', '#6366f1', 3),
  ('Plano de Saúde', 'Health Insurance', 'Seguro de Salud', 'Plano de Saúde', '#ef4444', 4),
  ('Dentista', 'Dentist', 'Dentista', 'Dentista', '#0ea5e9', 5),
  ('Hospital', 'Hospital', 'Hospital', 'Hospital', '#dc2626', 6),
  ('Terapia', 'Therapy', 'Terapia', 'Terapia', '#8b5cf6', 7)
) AS sub(name, name_en, name_es, name_pt, color, sort_order)
WHERE dc.name_pt = 'Saúde'
ON CONFLICT (default_category_id, name) DO NOTHING;

-- Lazer
INSERT INTO default_subcategories (default_category_id, name, name_en, name_es, name_pt, color, sort_order)
SELECT dc.id, sub.name, sub.name_en, sub.name_es, sub.name_pt, sub.color, sub.sort_order
FROM default_categories dc
CROSS JOIN (VALUES
  ('Cinema/Teatro', 'Movies/Theater', 'Cine/Teatro', 'Cinema/Teatro', '#f97316', 1),
  ('Streaming', 'Streaming', 'Streaming', 'Streaming', '#6366f1', 2),
  ('Viagem', 'Travel', 'Viaje', 'Viagem', '#0ea5e9', 3),
  ('Festas/Eventos', 'Parties/Events', 'Fiestas/Eventos', 'Festas/Eventos', '#ec4899', 4),
  ('Hobby', 'Hobby', 'Hobby', 'Hobby', '#8b5cf6', 5),
  ('Jogos', 'Games', 'Juegos', 'Jogos', '#22c55e', 6),
  ('Academia', 'Gym', 'Gimnasio', 'Academia', '#f59e0b', 7)
) AS sub(name, name_en, name_es, name_pt, color, sort_order)
WHERE dc.name_pt = 'Lazer'
ON CONFLICT (default_category_id, name) DO NOTHING;

-- Veículos
INSERT INTO default_subcategories (default_category_id, name, name_en, name_es, name_pt, color, sort_order)
SELECT dc.id, sub.name, sub.name_en, sub.name_es, sub.name_pt, sub.color, sub.sort_order
FROM default_categories dc
CROSS JOIN (VALUES
  ('Prestação', 'Car Payment', 'Cuota', 'Prestação', '#3b82f6', 1),
  ('Seguro', 'Insurance', 'Seguro', 'Seguro', '#6366f1', 2),
  ('Manutenção', 'Maintenance', 'Mantenimiento', 'Manutenção', '#f97316', 3),
  ('IPVA', 'Vehicle Tax', 'Impuesto Vehicular', 'IPVA', '#eab308', 4),
  ('Licenciamento', 'Registration', 'Matriculación', 'Licenciamento', '#8b5cf6', 5),
  ('Multas', 'Fines', 'Multas', 'Multas', '#ef4444', 6),
  ('Mecânico', 'Mechanic', 'Mecánico', 'Mecânico', '#a3a3a3', 7),
  ('Lavagem', 'Car Wash', 'Lavado', 'Lavagem', '#0ea5e9', 8)
) AS sub(name, name_en, name_es, name_pt, color, sort_order)
WHERE dc.name_pt = 'Veículos'
ON CONFLICT (default_category_id, name) DO NOTHING;

-- Educação
INSERT INTO default_subcategories (default_category_id, name, name_en, name_es, name_pt, color, sort_order)
SELECT dc.id, sub.name, sub.name_en, sub.name_es, sub.name_pt, sub.color, sub.sort_order
FROM default_categories dc
CROSS JOIN (VALUES
  ('Mensalidade', 'Tuition', 'Mensualidad', 'Mensalidade', '#3b82f6', 1),
  ('Material Escolar', 'School Supplies', 'Material Escolar', 'Material Escolar', '#22c55e', 2),
  ('Cursos', 'Courses', 'Cursos', 'Cursos', '#6366f1', 3),
  ('Livros', 'Books', 'Libros', 'Livros', '#f97316', 4),
  ('Uniforme', 'Uniform', 'Uniforme', 'Uniforme', '#8b5cf6', 5)
) AS sub(name, name_en, name_es, name_pt, color, sort_order)
WHERE dc.name_pt = 'Educação'
ON CONFLICT (default_category_id, name) DO NOTHING;

-- Compras
INSERT INTO default_subcategories (default_category_id, name, name_en, name_es, name_pt, color, sort_order)
SELECT dc.id, sub.name, sub.name_en, sub.name_es, sub.name_pt, sub.color, sub.sort_order
FROM default_categories dc
CROSS JOIN (VALUES
  ('Roupas', 'Clothing', 'Ropa', 'Roupas', '#ec4899', 1),
  ('Eletrônicos', 'Electronics', 'Electrónicos', 'Eletrônicos', '#3b82f6', 2),
  ('Casa/Decoração', 'Home/Decor', 'Casa/Decoración', 'Casa/Decoração', '#f97316', 3),
  ('Presentes', 'Gifts', 'Regalos', 'Presentes', '#8b5cf6', 4),
  ('Calçados', 'Footwear', 'Calzado', 'Calçados', '#6366f1', 5)
) AS sub(name, name_en, name_es, name_pt, color, sort_order)
WHERE dc.name_pt = 'Compras'
ON CONFLICT (default_category_id, name) DO NOTHING;

-- ==============================================
-- FASE 3: Função e Trigger para copiar subcategorias
-- ==============================================

CREATE OR REPLACE FUNCTION copy_default_subcategories_to_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subcategories (user_id, category_id, name, name_en, name_es, color, icon, is_system)
  SELECT 
    NEW.user_id,
    NEW.id,
    ds.name,
    ds.name_en,
    ds.name_es,
    ds.color,
    ds.icon,
    true
  FROM default_subcategories ds
  INNER JOIN default_categories dc ON dc.id = ds.default_category_id
  WHERE NEW.default_category_id = dc.id
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_copy_default_subcategories ON categories;
CREATE TRIGGER trigger_copy_default_subcategories
  AFTER INSERT ON categories
  FOR EACH ROW
  WHEN (NEW.default_category_id IS NOT NULL)
  EXECUTE FUNCTION copy_default_subcategories_to_user();

-- ==============================================
-- FASE 4: Copiar subcategorias para categorias existentes
-- ==============================================

INSERT INTO subcategories (user_id, category_id, name, name_en, name_es, color, icon, is_system)
SELECT DISTINCT
  c.user_id,
  c.id,
  ds.name,
  ds.name_en,
  ds.name_es,
  ds.color,
  ds.icon,
  true
FROM categories c
INNER JOIN default_categories dc ON dc.id = c.default_category_id
INNER JOIN default_subcategories ds ON ds.default_category_id = dc.id
WHERE c.deleted_at IS NULL
AND NOT EXISTS (
  SELECT 1 FROM subcategories s 
  WHERE s.category_id = c.id 
  AND s.name = ds.name
  AND s.deleted_at IS NULL
)
ON CONFLICT DO NOTHING;