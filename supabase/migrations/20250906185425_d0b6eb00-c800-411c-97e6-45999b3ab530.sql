-- 1. Criar tabela de tags com traduções
CREATE TABLE IF NOT EXISTS public.category_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_pt TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_es TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  icon TEXT,
  keywords_pt TEXT[], -- palavras-chave para reconhecimento automático
  keywords_en TEXT[],
  keywords_es TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Criar tabela de relacionamento categoria-tags
CREATE TABLE IF NOT EXISTS public.category_tag_relations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL,
  tag_id UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category_id, tag_id)
);

-- 3. Adicionar coluna de tags às transações
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS tag_id UUID;

-- 4. Limpar categorias padrão existentes e recriar estrutura padronizada
TRUNCATE public.default_categories;

-- 5. Inserir as 12 categorias de despesa padronizadas
INSERT INTO public.default_categories (name_pt, name_en, name_es, color, icon, category_type, description_pt, description_en, description_es) VALUES
('Alimentação', 'Food & Dining', 'Alimentación', '#ef4444', 'utensils', 'expense', 'Gastos com alimentação e refeições', 'Food and dining expenses', 'Gastos de alimentación y comidas'),
('Transporte', 'Transportation', 'Transporte', '#3b82f6', 'car', 'expense', 'Gastos com transporte e mobilidade', 'Transportation and mobility expenses', 'Gastos de transporte y movilidad'),
('Moradia', 'Housing', 'Vivienda', '#10b981', 'home', 'expense', 'Gastos com moradia e habitação', 'Housing and accommodation expenses', 'Gastos de vivienda y alojamiento'),
('Saúde', 'Health', 'Salud', '#f59e0b', 'heart', 'expense', 'Gastos com saúde e bem-estar', 'Health and wellness expenses', 'Gastos de salud y bienestar'),
('Educação', 'Education', 'Educación', '#8b5cf6', 'book-open', 'expense', 'Gastos com educação e aprendizado', 'Education and learning expenses', 'Gastos de educación y aprendizaje'),
('Lazer & Entretenimento', 'Entertainment', 'Entretenimiento', '#ec4899', 'gamepad-2', 'expense', 'Gastos com lazer e entretenimento', 'Entertainment and leisure expenses', 'Gastos de ocio y entretenimiento'),
('Compras Pessoais', 'Personal Shopping', 'Compras Personales', '#06b6d4', 'shopping-bag', 'expense', 'Gastos com compras pessoais', 'Personal shopping expenses', 'Gastos de compras personales'),
('Família & Filhos', 'Family & Children', 'Familia e Hijos', '#84cc16', 'baby', 'expense', 'Gastos com família e filhos', 'Family and children expenses', 'Gastos de familia e hijos'),
('Finanças & Serviços', 'Finance & Services', 'Finanzas y Servicios', '#6366f1', 'banknote', 'expense', 'Gastos com finanças e serviços', 'Finance and services expenses', 'Gastos de finanzas y servicios'),
('Trabalho & Negócios', 'Work & Business', 'Trabajo y Negocios', '#0891b2', 'briefcase', 'expense', 'Gastos com trabalho e negócios', 'Work and business expenses', 'Gastos de trabajo y negocios'),
('Doações & Presentes', 'Donations & Gifts', 'Donaciones y Regalos', '#dc2626', 'gift', 'expense', 'Gastos com doações e presentes', 'Donations and gifts expenses', 'Gastos de donaciones y regalos'),
('Outros', 'Other', 'Otros', '#6b7280', 'help-circle', 'expense', 'Outros gastos não categorizados', 'Other uncategorized expenses', 'Otros gastos no categorizados');

-- 6. Inserir categorias de receita (sem tags)
INSERT INTO public.default_categories (name_pt, name_en, name_es, color, icon, category_type, description_pt, description_en, description_es) VALUES
('Salário', 'Salary', 'Salario', '#10b981', 'banknote', 'income', 'Renda de salário e trabalho', 'Salary and work income', 'Ingresos de salario y trabajo'),
('Freelance', 'Freelance', 'Freelance', '#3b82f6', 'laptop', 'income', 'Renda de trabalho freelance', 'Freelance work income', 'Ingresos de trabajo freelance'),
('Bônus', 'Bonus', 'Bonificación', '#f59e0b', 'star', 'income', 'Bônus e gratificações', 'Bonus and rewards', 'Bonificaciones y recompensas'),
('Investimentos', 'Investments', 'Inversiones', '#8b5cf6', 'trending-up', 'income', 'Renda de investimentos', 'Investment income', 'Ingresos de inversiones'),
('Vendas', 'Sales', 'Ventas', '#ec4899', 'shopping-cart', 'income', 'Renda de vendas', 'Sales income', 'Ingresos de ventas'),
('Aluguel Recebido', 'Rental Income', 'Ingresos de Alquiler', '#06b6d4', 'home', 'income', 'Renda de aluguéis', 'Rental income received', 'Ingresos de alquileres'),
('Outros', 'Other', 'Otros', '#6b7280', 'plus-circle', 'income', 'Outras receitas', 'Other income', 'Otros ingresos');

-- 7. Inserir tags para cada categoria de despesa
-- Tags para Alimentação
INSERT INTO public.category_tags (name_pt, name_en, name_es, keywords_pt, keywords_en, keywords_es) VALUES
('Supermercado', 'Supermarket', 'Supermercado', ARRAY['supermercado', 'mercado', 'compras'], ARRAY['supermarket', 'grocery', 'market'], ARRAY['supermercado', 'mercado', 'compras']),
('Padaria', 'Bakery', 'Panadería', ARRAY['padaria', 'pão', 'confeitaria'], ARRAY['bakery', 'bread', 'pastry'], ARRAY['panadería', 'pan', 'confitería']),
('Restaurante', 'Restaurant', 'Restaurante', ARRAY['restaurante', 'jantar', 'almoço'], ARRAY['restaurant', 'dinner', 'lunch'], ARRAY['restaurante', 'cena', 'almuerzo']),
('Lanchonete', 'Snack Bar', 'Bar de Bocadillos', ARRAY['lanchonete', 'lanche', 'sanduíche'], ARRAY['snack bar', 'snack', 'sandwich'], ARRAY['bar de bocadillos', 'bocadillo', 'sándwich']),
('Delivery', 'Delivery', 'Delivery', ARRAY['delivery', 'entrega', 'ifood', 'uber eats'], ARRAY['delivery', 'takeout', 'ifood', 'uber eats'], ARRAY['delivery', 'entrega', 'ifood', 'uber eats']),
('Feira', 'Market', 'Feria', ARRAY['feira', 'feira livre', 'verduras'], ARRAY['market', 'farmers market', 'vegetables'], ARRAY['feria', 'mercado libre', 'verduras']),
('Café', 'Coffee', 'Café', ARRAY['café', 'cafeteria', 'starbucks'], ARRAY['coffee', 'cafe', 'starbucks'], ARRAY['café', 'cafetería', 'starbucks']),
('Fast Food', 'Fast Food', 'Comida Rápida', ARRAY['fast food', 'mcdonald', 'burger king', 'kfc'], ARRAY['fast food', 'mcdonald', 'burger king', 'kfc'], ARRAY['comida rápida', 'mcdonald', 'burger king', 'kfc']);

-- Tags para Transporte
INSERT INTO public.category_tags (name_pt, name_en, name_es, keywords_pt, keywords_en, keywords_es) VALUES
('Combustível', 'Fuel', 'Combustible', ARRAY['combustível', 'gasolina', 'álcool', 'shell', 'petrobras', 'posto'], ARRAY['fuel', 'gasoline', 'gas', 'shell', 'station'], ARRAY['combustible', 'gasolina', 'gas', 'shell', 'estación']),
('Uber/99', 'Rideshare', 'Transporte Compartido', ARRAY['uber', '99', 'rideshare', 'corrida'], ARRAY['uber', '99', 'rideshare', 'ride'], ARRAY['uber', '99', 'transporte compartido', 'viaje']),
('Ônibus', 'Bus', 'Autobús', ARRAY['ônibus', 'transporte público', 'bilhete único'], ARRAY['bus', 'public transport', 'bus ticket'], ARRAY['autobús', 'transporte público', 'boleto']),
('Metrô', 'Subway', 'Metro', ARRAY['metrô', 'metro', 'trem', 'cptm'], ARRAY['subway', 'metro', 'train'], ARRAY['metro', 'tren', 'subterráneo']),
('Pedágio', 'Toll', 'Peaje', ARRAY['pedágio', 'sem parar', 'conectcar'], ARRAY['toll', 'toll road', 'highway'], ARRAY['peaje', 'autopista', 'carretera']),
('Estacionamento', 'Parking', 'Estacionamiento', ARRAY['estacionamento', 'zona azul', 'parking'], ARRAY['parking', 'parking lot', 'meter'], ARRAY['estacionamiento', 'parking', 'aparcamiento']),
('Manutenção Veículo', 'Vehicle Maintenance', 'Mantenimiento Vehículo', ARRAY['manutenção', 'mecânico', 'oficina', 'revisão'], ARRAY['maintenance', 'mechanic', 'repair', 'service'], ARRAY['mantenimiento', 'mecánico', 'taller', 'revisión']),
('Táxi', 'Taxi', 'Taxi', ARRAY['táxi', 'taxi', 'corrida'], ARRAY['taxi', 'cab', 'ride'], ARRAY['taxi', 'viaje', 'carrera']);

-- Tags para Moradia
INSERT INTO public.category_tags (name_pt, name_en, name_es, keywords_pt, keywords_en, keywords_es) VALUES
('Aluguel', 'Rent', 'Alquiler', ARRAY['aluguel', 'rent', 'aluguer'], ARRAY['rent', 'rental', 'lease'], ARRAY['alquiler', 'renta', 'arriendo']),
('Condomínio', 'Condo Fee', 'Condominio', ARRAY['condomínio', 'taxa condominial', 'síndico'], ARRAY['condo fee', 'maintenance fee', 'hoa'], ARRAY['condominio', 'cuota condominial', 'administración']),
('Luz', 'Electricity', 'Electricidad', ARRAY['luz', 'energia', 'enel', 'eletricidade'], ARRAY['electricity', 'power', 'electric bill'], ARRAY['electricidad', 'luz', 'energía']),
('Água', 'Water', 'Agua', ARRAY['água', 'saneamento', 'sabesp'], ARRAY['water', 'water bill', 'utilities'], ARRAY['agua', 'saneamiento', 'servicios']),
('Gás', 'Gas', 'Gas', ARRAY['gás', 'botijão', 'comgás'], ARRAY['gas', 'propane', 'natural gas'], ARRAY['gas', 'bombona', 'gas natural']),
('Internet', 'Internet', 'Internet', ARRAY['internet', 'wifi', 'banda larga', 'vivo', 'tim'], ARRAY['internet', 'wifi', 'broadband'], ARRAY['internet', 'wifi', 'banda ancha']),
('Telefone Fixo', 'Landline', 'Teléfono Fijo', ARRAY['telefone fixo', 'telefone', 'linha'], ARRAY['landline', 'phone', 'telephone'], ARRAY['teléfono fijo', 'teléfono', 'línea']),
('Manutenção', 'Maintenance', 'Mantenimiento', ARRAY['manutenção', 'reparo', 'conserto'], ARRAY['maintenance', 'repair', 'fix'], ARRAY['mantenimiento', 'reparación', 'arreglo']),
('Móveis', 'Furniture', 'Muebles', ARRAY['móveis', 'mobília', 'ikea'], ARRAY['furniture', 'furnishing', 'ikea'], ARRAY['muebles', 'mobiliario', 'ikea']),
('Eletrodomésticos', 'Appliances', 'Electrodomésticos', ARRAY['eletrodomésticos', 'geladeira', 'fogão'], ARRAY['appliances', 'refrigerator', 'stove'], ARRAY['electrodomésticos', 'refrigerador', 'estufa']);

-- Tags para Saúde
INSERT INTO public.category_tags (name_pt, name_en, name_es, keywords_pt, keywords_en, keywords_es) VALUES
('Farmácia', 'Pharmacy', 'Farmacia', ARRAY['farmácia', 'drogaria', 'remédio', 'drogasil'], ARRAY['pharmacy', 'drugstore', 'medicine'], ARRAY['farmacia', 'medicamento', 'droguería']),
('Plano de Saúde', 'Health Insurance', 'Seguro de Salud', ARRAY['plano de saúde', 'unimed', 'bradesco saúde'], ARRAY['health insurance', 'medical plan'], ARRAY['seguro de salud', 'plan médico']),
('Exames', 'Medical Tests', 'Exámenes', ARRAY['exames', 'laboratório', 'raio-x'], ARRAY['medical tests', 'lab', 'x-ray'], ARRAY['exámenes', 'laboratorio', 'rayos-x']),
('Consultas', 'Medical Appointments', 'Consultas', ARRAY['consulta', 'médico', 'doutor'], ARRAY['appointment', 'doctor', 'physician'], ARRAY['consulta', 'médico', 'doctor']),
('Academia', 'Gym', 'Gimnasio', ARRAY['academia', 'gym', 'smartfit', 'musculação'], ARRAY['gym', 'fitness', 'workout'], ARRAY['gimnasio', 'fitness', 'ejercicio']),
('Hospital', 'Hospital', 'Hospital', ARRAY['hospital', 'emergência', 'pronto socorro'], ARRAY['hospital', 'emergency', 'er'], ARRAY['hospital', 'emergencia', 'urgencias']),
('Terapia', 'Therapy', 'Terapia', ARRAY['terapia', 'psicólogo', 'fisioterapia'], ARRAY['therapy', 'psychologist', 'physical therapy'], ARRAY['terapia', 'psicólogo', 'fisioterapia']);

-- Tags para Educação
INSERT INTO public.category_tags (name_pt, name_en, name_es, keywords_pt, keywords_en, keywords_es) VALUES
('Faculdade', 'College', 'Universidad', ARRAY['faculdade', 'universidade', 'mensalidade'], ARRAY['college', 'university', 'tuition'], ARRAY['universidad', 'colegio', 'matrícula']),
('Curso Online', 'Online Course', 'Curso Online', ARRAY['curso online', 'udemy', 'coursera'], ARRAY['online course', 'udemy', 'coursera'], ARRAY['curso online', 'udemy', 'coursera']),
('Livros', 'Books', 'Libros', ARRAY['livros', 'livraria', 'amazon'], ARRAY['books', 'bookstore', 'amazon'], ARRAY['libros', 'librería', 'amazon']),
('Material Escolar', 'School Supplies', 'Material Escolar', ARRAY['material escolar', 'papelaria', 'caderno'], ARRAY['school supplies', 'stationery', 'notebook'], ARRAY['material escolar', 'papelería', 'cuaderno']),
('Palestras', 'Lectures', 'Conferencias', ARRAY['palestra', 'seminário', 'workshop'], ARRAY['lecture', 'seminar', 'workshop'], ARRAY['conferencia', 'seminario', 'taller']),
('Treinamentos', 'Training', 'Capacitación', ARRAY['treinamento', 'capacitação', 'certificação'], ARRAY['training', 'certification', 'course'], ARRAY['capacitación', 'entrenamiento', 'certificación']);

-- Tags para Lazer & Entretenimento
INSERT INTO public.category_tags (name_pt, name_en, name_es, keywords_pt, keywords_en, keywords_es) VALUES
('Cinema', 'Cinema', 'Cine', ARRAY['cinema', 'filme', 'ingresso'], ARRAY['cinema', 'movie', 'ticket'], ARRAY['cine', 'película', 'entrada']),
('Shows', 'Shows', 'Espectáculos', ARRAY['show', 'concerto', 'música'], ARRAY['show', 'concert', 'music'], ARRAY['espectáculo', 'concierto', 'música']),
('Streaming', 'Streaming', 'Streaming', ARRAY['streaming', 'netflix', 'spotify', 'disney+'], ARRAY['streaming', 'netflix', 'spotify', 'disney+'], ARRAY['streaming', 'netflix', 'spotify', 'disney+']),
('Bar', 'Bar', 'Bar', ARRAY['bar', 'bebida', 'cerveja'], ARRAY['bar', 'drink', 'beer'], ARRAY['bar', 'bebida', 'cerveza']),
('Viagem', 'Travel', 'Viaje', ARRAY['viagem', 'hotel', 'passagem'], ARRAY['travel', 'hotel', 'flight'], ARRAY['viaje', 'hotel', 'pasaje']),
('Festas', 'Parties', 'Fiestas', ARRAY['festa', 'aniversário', 'celebração'], ARRAY['party', 'birthday', 'celebration'], ARRAY['fiesta', 'cumpleaños', 'celebración']),
('Hobbies', 'Hobbies', 'Pasatiempos', ARRAY['hobby', 'passatempo', 'coleção'], ARRAY['hobby', 'pastime', 'collection'], ARRAY['pasatiempo', 'hobby', 'colección']),
('Esportes', 'Sports', 'Deportes', ARRAY['esporte', 'futebol', 'jogo'], ARRAY['sports', 'football', 'game'], ARRAY['deporte', 'fútbol', 'juego']);

-- Tags para Compras Pessoais
INSERT INTO public.category_tags (name_pt, name_en, name_es, keywords_pt, keywords_en, keywords_es) VALUES
('Roupas', 'Clothing', 'Ropa', ARRAY['roupas', 'vestido', 'camisa'], ARRAY['clothing', 'dress', 'shirt'], ARRAY['ropa', 'vestido', 'camisa']),
('Calçados', 'Shoes', 'Calzado', ARRAY['calçados', 'sapato', 'tênis'], ARRAY['shoes', 'sneakers', 'boots'], ARRAY['calzado', 'zapatos', 'tenis']),
('Acessórios', 'Accessories', 'Accesorios', ARRAY['acessórios', 'bolsa', 'óculos'], ARRAY['accessories', 'bag', 'glasses'], ARRAY['accesorios', 'bolso', 'gafas']),
('Eletrônicos', 'Electronics', 'Electrónicos', ARRAY['eletrônicos', 'celular', 'notebook'], ARRAY['electronics', 'phone', 'laptop'], ARRAY['electrónicos', 'celular', 'portátil']),
('Cosméticos', 'Cosmetics', 'Cosméticos', ARRAY['cosméticos', 'maquiagem', 'base'], ARRAY['cosmetics', 'makeup', 'foundation'], ARRAY['cosméticos', 'maquillaje', 'base']),
('Perfumaria', 'Perfume', 'Perfumería', ARRAY['perfume', 'colônia', 'fragrância'], ARRAY['perfume', 'cologne', 'fragrance'], ARRAY['perfume', 'colonia', 'fragancia']);

-- Tags para Família & Filhos
INSERT INTO public.category_tags (name_pt, name_en, name_es, keywords_pt, keywords_en, keywords_es) VALUES
('Escola', 'School', 'Escuela', ARRAY['escola', 'colégio', 'educação'], ARRAY['school', 'education', 'tuition'], ARRAY['escuela', 'colegio', 'educación']),
('Creche', 'Daycare', 'Guardería', ARRAY['creche', 'berçário', 'cuidado'], ARRAY['daycare', 'nursery', 'childcare'], ARRAY['guardería', 'jardín infantil', 'cuidado']),
('Brinquedos', 'Toys', 'Juguetes', ARRAY['brinquedos', 'lego', 'boneca'], ARRAY['toys', 'lego', 'doll'], ARRAY['juguetes', 'lego', 'muñeca']),
('Roupas Infantis', 'Kids Clothing', 'Ropa Infantil', ARRAY['roupas infantis', 'criança', 'bebê'], ARRAY['kids clothing', 'children', 'baby'], ARRAY['ropa infantil', 'niños', 'bebé']),
('Mesada', 'Allowance', 'Mesada', ARRAY['mesada', 'dinheiro criança', 'semanada'], ARRAY['allowance', 'pocket money', 'spending money'], ARRAY['mesada', 'dinero niños', 'semanada']),
('Cuidados', 'Childcare', 'Cuidado Infantil', ARRAY['cuidados', 'babá', 'médico pediatra'], ARRAY['childcare', 'babysitter', 'pediatrician'], ARRAY['cuidado infantil', 'niñera', 'pediatra']);

-- Tags para Finanças & Serviços
INSERT INTO public.category_tags (name_pt, name_en, name_es, keywords_pt, keywords_en, keywords_es) VALUES
('Taxas Bancárias', 'Bank Fees', 'Tarifas Bancarias', ARRAY['taxa bancária', 'anuidade', 'banco'], ARRAY['bank fee', 'annual fee', 'banking'], ARRAY['tarifa bancaria', 'anualidad', 'banco']),
('Seguros', 'Insurance', 'Seguros', ARRAY['seguro', 'seguro auto', 'seguro vida'], ARRAY['insurance', 'auto insurance', 'life insurance'], ARRAY['seguro', 'seguro auto', 'seguro de vida']),
('Investimentos', 'Investments', 'Inversiones', ARRAY['investimento', 'ações', 'corretora'], ARRAY['investment', 'stocks', 'broker'], ARRAY['inversión', 'acciones', 'corredor']),
('Impostos', 'Taxes', 'Impuestos', ARRAY['imposto', 'ir', 'iptu'], ARRAY['tax', 'income tax', 'property tax'], ARRAY['impuesto', 'renta', 'predial']),
('Mensalidades', 'Subscriptions', 'Suscripciones', ARRAY['mensalidade', 'assinatura', 'plano'], ARRAY['subscription', 'membership', 'plan'], ARRAY['suscripción', 'membresía', 'plan']),
('Assinatura de Serviços', 'Service Subscriptions', 'Suscripciones de Servicios', ARRAY['assinatura', 'serviços online', 'saas'], ARRAY['subscription', 'online services', 'saas'], ARRAY['suscripción', 'servicios online', 'saas']);

-- Tags para Trabalho & Negócios
INSERT INTO public.category_tags (name_pt, name_en, name_es, keywords_pt, keywords_en, keywords_es) VALUES
('Coworking', 'Coworking', 'Coworking', ARRAY['coworking', 'espaço compartilhado', 'escritório'], ARRAY['coworking', 'shared space', 'office'], ARRAY['coworking', 'espacio compartido', 'oficina']),
('Software', 'Software', 'Software', ARRAY['software', 'licença', 'programa'], ARRAY['software', 'license', 'program'], ARRAY['software', 'licencia', 'programa']),
('Equipamentos', 'Equipment', 'Equipos', ARRAY['equipamento', 'computador', 'material'], ARRAY['equipment', 'computer', 'supplies'], ARRAY['equipo', 'computadora', 'material']),
('Viagens de Trabalho', 'Business Travel', 'Viajes de Trabajo', ARRAY['viagem trabalho', 'negócios', 'corporativo'], ARRAY['business travel', 'corporate', 'work trip'], ARRAY['viaje de trabajo', 'negocios', 'corporativo']),
('Marketing', 'Marketing', 'Marketing', ARRAY['marketing', 'publicidade', 'anúncio'], ARRAY['marketing', 'advertising', 'ads'], ARRAY['marketing', 'publicidad', 'anuncio']),
('Impostos PJ', 'Business Taxes', 'Impuestos Empresariales', ARRAY['imposto pj', 'cnpj', 'pessoa jurídica'], ARRAY['business tax', 'corporate tax', 'company'], ARRAY['impuesto empresarial', 'empresa', 'corporativo']);

-- Tags para Doações & Presentes
INSERT INTO public.category_tags (name_pt, name_en, name_es, keywords_pt, keywords_en, keywords_es) VALUES
('Presentes', 'Gifts', 'Regalos', ARRAY['presente', 'gift', 'lembrança'], ARRAY['gift', 'present', 'souvenir'], ARRAY['regalo', 'presente', 'recuerdo']),
('Doações', 'Donations', 'Donaciones', ARRAY['doação', 'caridade', 'ong'], ARRAY['donation', 'charity', 'ngo'], ARRAY['donación', 'caridad', 'ong']),
('Caridade', 'Charity', 'Caridad', ARRAY['caridade', 'beneficência', 'ajuda'], ARRAY['charity', 'philanthropy', 'help'], ARRAY['caridad', 'beneficencia', 'ayuda']),
('Festas de Aniversário', 'Birthday Parties', 'Fiestas de Cumpleaños', ARRAY['aniversário', 'festa', 'celebração'], ARRAY['birthday', 'party', 'celebration'], ARRAY['cumpleaños', 'fiesta', 'celebración']),
('Casamentos', 'Weddings', 'Bodas', ARRAY['casamento', 'casório', 'noiva'], ARRAY['wedding', 'marriage', 'bride'], ARRAY['boda', 'casamiento', 'novia']);

-- Tags para Outros
INSERT INTO public.category_tags (name_pt, name_en, name_es, keywords_pt, keywords_en, keywords_es) VALUES
('Emergências', 'Emergencies', 'Emergencias', ARRAY['emergência', 'urgente', 'imprevisto'], ARRAY['emergency', 'urgent', 'unexpected'], ARRAY['emergencia', 'urgente', 'imprevisto']),
('Imprevistos', 'Unexpected', 'Imprevistos', ARRAY['imprevisto', 'não planejado', 'surpresa'], ARRAY['unexpected', 'unplanned', 'surprise'], ARRAY['imprevisto', 'no planeado', 'sorpresa']),
('Não Categorizados', 'Uncategorized', 'Sin Categorizar', ARRAY['não categorizado', 'outros', 'diversos'], ARRAY['uncategorized', 'other', 'miscellaneous'], ARRAY['sin categorizar', 'otros', 'diversos']);

-- 8. Criar relacionamentos entre categorias e tags
-- Alimentação
WITH alimentacao AS (SELECT id FROM public.default_categories WHERE name_pt = 'Alimentação' LIMIT 1),
     tags_alimentacao AS (
       SELECT id FROM public.category_tags WHERE name_pt IN (
         'Supermercado', 'Padaria', 'Restaurante', 'Lanchonete', 'Delivery', 'Feira', 'Café', 'Fast Food'
       )
     )
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT alimentacao.id, tags_alimentacao.id
FROM alimentacao CROSS JOIN tags_alimentacao;

-- Transporte
WITH transporte AS (SELECT id FROM public.default_categories WHERE name_pt = 'Transporte' LIMIT 1),
     tags_transporte AS (
       SELECT id FROM public.category_tags WHERE name_pt IN (
         'Combustível', 'Uber/99', 'Ônibus', 'Metrô', 'Pedágio', 'Estacionamento', 'Manutenção Veículo', 'Táxi'
       )
     )
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT transporte.id, tags_transporte.id
FROM transporte CROSS JOIN tags_transporte;

-- Moradia
WITH moradia AS (SELECT id FROM public.default_categories WHERE name_pt = 'Moradia' LIMIT 1),
     tags_moradia AS (
       SELECT id FROM public.category_tags WHERE name_pt IN (
         'Aluguel', 'Condomínio', 'Luz', 'Água', 'Gás', 'Internet', 'Telefone Fixo', 'Manutenção', 'Móveis', 'Eletrodomésticos'
       )
     )
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT moradia.id, tags_moradia.id
FROM moradia CROSS JOIN tags_moradia;

-- Saúde
WITH saude AS (SELECT id FROM public.default_categories WHERE name_pt = 'Saúde' LIMIT 1),
     tags_saude AS (
       SELECT id FROM public.category_tags WHERE name_pt IN (
         'Farmácia', 'Plano de Saúde', 'Exames', 'Consultas', 'Academia', 'Hospital', 'Terapia'
       )
     )
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT saude.id, tags_saude.id
FROM saude CROSS JOIN tags_saude;

-- Educação
WITH educacao AS (SELECT id FROM public.default_categories WHERE name_pt = 'Educação' LIMIT 1),
     tags_educacao AS (
       SELECT id FROM public.category_tags WHERE name_pt IN (
         'Faculdade', 'Curso Online', 'Livros', 'Material Escolar', 'Palestras', 'Treinamentos'
       )
     )
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT educacao.id, tags_educacao.id
FROM educacao CROSS JOIN tags_educacao;

-- Lazer & Entretenimento
WITH lazer AS (SELECT id FROM public.default_categories WHERE name_pt = 'Lazer & Entretenimento' LIMIT 1),
     tags_lazer AS (
       SELECT id FROM public.category_tags WHERE name_pt IN (
         'Cinema', 'Shows', 'Streaming', 'Bar', 'Viagem', 'Festas', 'Hobbies', 'Esportes'
       )
     )
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT lazer.id, tags_lazer.id
FROM lazer CROSS JOIN tags_lazer;

-- Compras Pessoais
WITH compras AS (SELECT id FROM public.default_categories WHERE name_pt = 'Compras Pessoais' LIMIT 1),
     tags_compras AS (
       SELECT id FROM public.category_tags WHERE name_pt IN (
         'Roupas', 'Calçados', 'Acessórios', 'Eletrônicos', 'Cosméticos', 'Perfumaria'
       )
     )
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT compras.id, tags_compras.id
FROM compras CROSS JOIN tags_compras;

-- Família & Filhos
WITH familia AS (SELECT id FROM public.default_categories WHERE name_pt = 'Família & Filhos' LIMIT 1),
     tags_familia AS (
       SELECT id FROM public.category_tags WHERE name_pt IN (
         'Escola', 'Creche', 'Brinquedos', 'Roupas Infantis', 'Mesada', 'Cuidados'
       )
     )
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT familia.id, tags_familia.id
FROM familia CROSS JOIN tags_familia;

-- Finanças & Serviços
WITH financas AS (SELECT id FROM public.default_categories WHERE name_pt = 'Finanças & Serviços' LIMIT 1),
     tags_financas AS (
       SELECT id FROM public.category_tags WHERE name_pt IN (
         'Taxas Bancárias', 'Seguros', 'Investimentos', 'Impostos', 'Mensalidades', 'Assinatura de Serviços'
       )
     )
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT financas.id, tags_financas.id
FROM financas CROSS JOIN tags_financas;

-- Trabalho & Negócios
WITH trabalho AS (SELECT id FROM public.default_categories WHERE name_pt = 'Trabalho & Negócios' LIMIT 1),
     tags_trabalho AS (
       SELECT id FROM public.category_tags WHERE name_pt IN (
         'Coworking', 'Software', 'Equipamentos', 'Viagens de Trabalho', 'Marketing', 'Impostos PJ'
       )
     )
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT trabalho.id, tags_trabalho.id
FROM trabalho CROSS JOIN tags_trabalho;

-- Doações & Presentes
WITH doacoes AS (SELECT id FROM public.default_categories WHERE name_pt = 'Doações & Presentes' LIMIT 1),
     tags_doacoes AS (
       SELECT id FROM public.category_tags WHERE name_pt IN (
         'Presentes', 'Doações', 'Caridade', 'Festas de Aniversário', 'Casamentos'
       )
     )
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT doacoes.id, tags_doacoes.id
FROM doacoes CROSS JOIN tags_doacoes;

-- Outros
WITH outros AS (SELECT id FROM public.default_categories WHERE name_pt = 'Outros' LIMIT 1),
     tags_outros AS (
       SELECT id FROM public.category_tags WHERE name_pt IN (
         'Emergências', 'Imprevistos', 'Não Categorizados'
       )
     )
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT outros.id, tags_outros.id
FROM outros CROSS JOIN tags_outros;

-- 9. Criar função de reconhecimento automático de categoria/tag por IA
CREATE OR REPLACE FUNCTION public.suggest_category_and_tag(
  description TEXT,
  language TEXT DEFAULT 'pt'
) RETURNS TABLE(
  category_id UUID,
  tag_id UUID,
  category_name TEXT,
  tag_name TEXT,
  confidence NUMERIC
) LANGUAGE plpgsql
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
  
  -- Buscar matches nas keywords das tags
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

-- 10. Ativar RLS nas novas tabelas
ALTER TABLE public.category_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_tag_relations ENABLE ROW LEVEL SECURITY;

-- 11. Criar políticas RLS
-- Tags são visíveis para todos os usuários autenticados
CREATE POLICY "Tags are viewable by all authenticated users" 
ON public.category_tags 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Relacionamentos são visíveis para todos os usuários autenticados
CREATE POLICY "Tag relations are viewable by all authenticated users" 
ON public.category_tag_relations 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Apenas admins podem gerenciar tags e relacionamentos
CREATE POLICY "Only admins can manage tags" 
ON public.category_tags 
FOR ALL 
USING (public.is_admin_user());

CREATE POLICY "Only admins can manage tag relations" 
ON public.category_tag_relations 
FOR ALL 
USING (public.is_admin_user());

-- 12. Criar triggers para updated_at
CREATE TRIGGER update_category_tags_updated_at
  BEFORE UPDATE ON public.category_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 13. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_category_tags_keywords_pt ON public.category_tags USING GIN(keywords_pt);
CREATE INDEX IF NOT EXISTS idx_category_tags_keywords_en ON public.category_tags USING GIN(keywords_en);
CREATE INDEX IF NOT EXISTS idx_category_tags_keywords_es ON public.category_tags USING GIN(keywords_es);
CREATE INDEX IF NOT EXISTS idx_category_tag_relations_category ON public.category_tag_relations(category_id);
CREATE INDEX IF NOT EXISTS idx_category_tag_relations_tag ON public.category_tag_relations(tag_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tag_id ON public.transactions(tag_id);