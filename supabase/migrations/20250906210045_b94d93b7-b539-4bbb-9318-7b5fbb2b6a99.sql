-- Insert system tags for the 12 default categories (only if not exists)
INSERT INTO public.category_tags (name_pt, name_en, name_es, color, keywords_pt, keywords_en, keywords_es) 
SELECT * FROM (VALUES
-- Alimentação tags
('supermercado', 'supermarket', 'supermercado', '#ef4444', ARRAY['supermercado', 'mercado', 'compras'], ARRAY['supermarket', 'grocery', 'shopping'], ARRAY['supermercado', 'mercado', 'compras']),
('padaria', 'bakery', 'panadería', '#f97316', ARRAY['padaria', 'pão', 'doce'], ARRAY['bakery', 'bread', 'pastry'], ARRAY['panadería', 'pan', 'dulce']),
('restaurante', 'restaurant', 'restaurante', '#eab308', ARRAY['restaurante', 'jantar', 'almoço'], ARRAY['restaurant', 'dinner', 'lunch'], ARRAY['restaurante', 'cena', 'almuerzo']),
('lanchonete', 'snack bar', 'cafetería', '#84cc16', ARRAY['lanchonete', 'lanche', 'snack'], ARRAY['snack bar', 'snack', 'cafe'], ARRAY['cafetería', 'merienda', 'snack']),
('delivery', 'delivery', 'delivery', '#06b6d4', ARRAY['delivery', 'entrega', 'ifood'], ARRAY['delivery', 'food delivery', 'uber eats'], ARRAY['delivery', 'entrega', 'comida']),
('feira', 'market', 'mercado', '#8b5cf6', ARRAY['feira', 'frutas', 'verduras'], ARRAY['market', 'fruits', 'vegetables'], ARRAY['mercado', 'frutas', 'verduras']),
('café', 'coffee', 'café', '#ec4899', ARRAY['café', 'cafeteria', 'cappuccino'], ARRAY['coffee', 'cafe', 'cappuccino'], ARRAY['café', 'cafetería', 'cappuccino']),
('fast food', 'fast food', 'comida rápida', '#f59e0b', ARRAY['fast food', 'mcdonalds', 'burger'], ARRAY['fast food', 'mcdonalds', 'burger'], ARRAY['comida rápida', 'mcdonalds', 'hamburguesa']),

-- Transporte tags
('combustível', 'fuel', 'combustible', '#dc2626', ARRAY['gasolina', 'álcool', 'diesel'], ARRAY['gasoline', 'gas', 'diesel'], ARRAY['gasolina', 'alcohol', 'diesel']),
('uber/99', 'uber/lyft', 'uber/cabify', '#000000', ARRAY['uber', '99', 'corrida'], ARRAY['uber', 'lyft', 'ride'], ARRAY['uber', 'cabify', 'viaje']),
('ônibus', 'bus', 'autobús', '#2563eb', ARRAY['ônibus', 'coletivo', 'transporte'], ARRAY['bus', 'public transport', 'transit'], ARRAY['autobús', 'transporte público', 'colectivo']),
('metrô', 'subway', 'metro', '#7c3aed', ARRAY['metrô', 'metro', 'trem'], ARRAY['subway', 'metro', 'train'], ARRAY['metro', 'subterráneo', 'tren']),
('pedágio', 'toll', 'peaje', '#059669', ARRAY['pedágio', 'praça', 'rodovia'], ARRAY['toll', 'highway', 'road'], ARRAY['peaje', 'autopista', 'carretera']),
('estacionamento', 'parking', 'estacionamiento', '#0891b2', ARRAY['estacionamento', 'parquímetro', 'zona azul'], ARRAY['parking', 'parking meter', 'garage'], ARRAY['estacionamiento', 'parquímetro', 'garage']),
('manutenção veículo', 'vehicle maintenance', 'mantenimiento vehículo', '#ea580c', ARRAY['oficina', 'mecânico', 'reparo'], ARRAY['garage', 'mechanic', 'repair'], ARRAY['taller', 'mecánico', 'reparación']),
('táxi', 'taxi', 'taxi', '#facc15', ARRAY['táxi', 'corrida', 'motorista'], ARRAY['taxi', 'cab', 'ride'], ARRAY['taxi', 'viaje', 'conductor']),

-- Moradia tags  
('aluguel', 'rent', 'alquiler', '#dc2626', ARRAY['aluguel', 'imóvel', 'casa'], ARRAY['rent', 'rental', 'house'], ARRAY['alquiler', 'renta', 'casa']),
('condomínio', 'condo fees', 'condominio', '#f97316', ARRAY['condomínio', 'taxa', 'administração'], ARRAY['condo', 'hoa', 'maintenance'], ARRAY['condominio', 'administración', 'cuota']),
('luz', 'electricity', 'electricidad', '#eab308', ARRAY['luz', 'energia', 'conta'], ARRAY['electricity', 'power', 'bill'], ARRAY['electricidad', 'energía', 'factura']),
('água', 'water', 'agua', '#06b6d4', ARRAY['água', 'saneamento', 'conta'], ARRAY['water', 'bill', 'utility'], ARRAY['agua', 'saneamiento', 'factura']),
('gás', 'gas', 'gas', '#8b5cf6', ARRAY['gás', 'botijão', 'cozinha'], ARRAY['gas', 'propane', 'cooking'], ARRAY['gas', 'bombona', 'cocina']),
('internet', 'internet', 'internet', '#ec4899', ARRAY['internet', 'wifi', 'banda larga'], ARRAY['internet', 'wifi', 'broadband'], ARRAY['internet', 'wifi', 'banda ancha']),
('telefone fixo', 'landline', 'teléfono fijo', '#f59e0b', ARRAY['telefone', 'fixo', 'linha'], ARRAY['landline', 'phone', 'home phone'], ARRAY['teléfono fijo', 'línea', 'casa']),
('manutenção', 'maintenance', 'mantenimiento', '#84cc16', ARRAY['reparo', 'conserto', 'manutenção'], ARRAY['repair', 'maintenance', 'fix'], ARRAY['reparación', 'mantenimiento', 'arreglo']),
('móveis', 'furniture', 'muebles', '#a855f7', ARRAY['móveis', 'sofá', 'mesa'], ARRAY['furniture', 'sofa', 'table'], ARRAY['muebles', 'sofá', 'mesa']),
('eletrodomésticos', 'appliances', 'electrodomésticos', '#10b981', ARRAY['geladeira', 'fogão', 'máquina'], ARRAY['refrigerator', 'stove', 'washing machine'], ARRAY['refrigerador', 'estufa', 'lavadora'])
) AS v(name_pt, name_en, name_es, color, keywords_pt, keywords_en, keywords_es)
WHERE NOT EXISTS (SELECT 1 FROM public.category_tags WHERE category_tags.name_pt = v.name_pt);

-- Continue with more tags (part 2)
INSERT INTO public.category_tags (name_pt, name_en, name_es, color, keywords_pt, keywords_en, keywords_es) 
SELECT * FROM (VALUES
-- Saúde tags
('farmácia', 'pharmacy', 'farmacia', '#ef4444', ARRAY['farmácia', 'remédio', 'medicamento'], ARRAY['pharmacy', 'medicine', 'prescription'], ARRAY['farmacia', 'medicina', 'medicamento']),
('plano de saúde', 'health insurance', 'seguro médico', '#f97316', ARRAY['plano', 'convênio', 'saúde'], ARRAY['health insurance', 'medical plan', 'coverage'], ARRAY['seguro médico', 'plan de salud', 'cobertura']),
('exames', 'exams', 'exámenes', '#eab308', ARRAY['exame', 'laboratório', 'análise'], ARRAY['exam', 'lab', 'test'], ARRAY['examen', 'laboratorio', 'análisis']),
('consultas', 'consultations', 'consultas', '#84cc16', ARRAY['consulta', 'médico', 'doutor'], ARRAY['consultation', 'doctor', 'appointment'], ARRAY['consulta', 'médico', 'doctor']),
('academia', 'gym', 'gimnasio', '#06b6d4', ARRAY['academia', 'ginástica', 'musculação'], ARRAY['gym', 'fitness', 'workout'], ARRAY['gimnasio', 'fitness', 'ejercicio']),
('hospital', 'hospital', 'hospital', '#8b5cf6', ARRAY['hospital', 'emergência', 'internação'], ARRAY['hospital', 'emergency', 'admission'], ARRAY['hospital', 'emergencia', 'internación']),
('terapia', 'therapy', 'terapia', '#ec4899', ARRAY['terapia', 'psicólogo', 'tratamento'], ARRAY['therapy', 'psychologist', 'treatment'], ARRAY['terapia', 'psicólogo', 'tratamiento']),

-- Educação tags
('faculdade', 'college', 'universidad', '#f59e0b', ARRAY['faculdade', 'universidade', 'mensalidade'], ARRAY['college', 'university', 'tuition'], ARRAY['universidad', 'facultad', 'colegiatura']),
('curso online', 'online course', 'curso online', '#dc2626', ARRAY['curso', 'online', 'udemy'], ARRAY['course', 'online', 'udemy'], ARRAY['curso', 'online', 'udemy']),
('livros', 'books', 'libros', '#f97316', ARRAY['livro', 'literatura', 'estudo'], ARRAY['book', 'literature', 'study'], ARRAY['libro', 'literatura', 'estudio']),
('material escolar', 'school supplies', 'material escolar', '#eab308', ARRAY['caderno', 'lápis', 'material'], ARRAY['notebook', 'pencil', 'supplies'], ARRAY['cuaderno', 'lápiz', 'material']),
('palestras', 'lectures', 'conferencias', '#84cc16', ARRAY['palestra', 'seminário', 'evento'], ARRAY['lecture', 'seminar', 'event'], ARRAY['conferencia', 'seminario', 'evento']),
('treinamentos', 'training', 'entrenamientos', '#06b6d4', ARRAY['treinamento', 'capacitação', 'workshop'], ARRAY['training', 'workshop', 'skills'], ARRAY['entrenamiento', 'capacitación', 'taller'])
) AS v(name_pt, name_en, name_es, color, keywords_pt, keywords_en, keywords_es)
WHERE NOT EXISTS (SELECT 1 FROM public.category_tags WHERE category_tags.name_pt = v.name_pt);

-- Link tags to categories (only if not exists)
WITH category_mappings AS (
  SELECT 
    dc.id as default_category_id,
    dc.name_pt as category_name,
    CASE 
      WHEN dc.name_pt = 'Alimentação' THEN ARRAY['supermercado', 'padaria', 'restaurante', 'lanchonete', 'delivery', 'feira', 'café', 'fast food']
      WHEN dc.name_pt = 'Transporte' THEN ARRAY['combustível', 'uber/99', 'ônibus', 'metrô', 'pedágio', 'estacionamento', 'manutenção veículo', 'táxi']
      WHEN dc.name_pt = 'Moradia' THEN ARRAY['aluguel', 'condomínio', 'luz', 'água', 'gás', 'internet', 'telefone fixo', 'manutenção', 'móveis', 'eletrodomésticos']
      WHEN dc.name_pt = 'Saúde' THEN ARRAY['farmácia', 'plano de saúde', 'exames', 'consultas', 'academia', 'hospital', 'terapia']
      WHEN dc.name_pt = 'Educação' THEN ARRAY['faculdade', 'curso online', 'livros', 'material escolar', 'palestras', 'treinamentos']
      ELSE ARRAY[]::text[]
    END as tag_names
  FROM public.default_categories dc
  WHERE dc.category_type = 'expense'
)
INSERT INTO public.category_tag_relations (category_id, tag_id, is_active)
SELECT DISTINCT
  cm.default_category_id,
  ct.id,
  true
FROM category_mappings cm
CROSS JOIN LATERAL unnest(cm.tag_names) as tag_name
JOIN public.category_tags ct ON ct.name_pt = tag_name
WHERE NOT EXISTS (
  SELECT 1 FROM public.category_tag_relations ctr 
  WHERE ctr.category_id = cm.default_category_id AND ctr.tag_id = ct.id
);