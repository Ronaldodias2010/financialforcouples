-- Add new default expense categories
INSERT INTO default_categories (name_pt, name_en, name_es, description_pt, description_en, description_es, category_type, icon, color) VALUES
('Animais de Estimação', 'Pets', 'Mascotas', 'Gastos com animais de estimação', 'Pet-related expenses', 'Gastos relacionados con mascotas', 'expense', '🐕', '#10b981'),
('Viagens', 'Travel', 'Viajes', 'Despesas com viagens e turismo', 'Travel and tourism expenses', 'Gastos de viajes y turismo', 'expense', '✈️', '#3b82f6'),
('Beleza & Cuidados Pessoais', 'Beauty & Personal Care', 'Belleza y Cuidado Personal', 'Gastos com beleza e cuidados pessoais', 'Beauty and personal care expenses', 'Gastos de belleza y cuidado personal', 'expense', '💄', '#ec4899'),
('Tecnologia & Assinaturas Digitais', 'Technology & Digital Subscriptions', 'Tecnología y Suscripciones Digitales', 'Gastos com tecnologia e serviços digitais', 'Technology and digital services expenses', 'Gastos de tecnología y servicios digitales', 'expense', '💻', '#8b5cf6'),
('Reforma & Construção', 'Renovation & Construction', 'Reforma y Construcción', 'Gastos com reformas e construção', 'Renovation and construction expenses', 'Gastos de reforma y construcción', 'expense', '🔨', '#f59e0b');

-- Add new default income category
INSERT INTO default_categories (name_pt, name_en, name_es, description_pt, description_en, description_es, category_type, icon, color) VALUES
('Receita Extraordinária', 'Extraordinary Income', 'Ingresos Extraordinarios', 'Receitas não recorrentes e extraordinárias', 'Non-recurring and extraordinary income', 'Ingresos no recurrentes y extraordinarios', 'income', '💰', '#059669');

-- Add tags for Animais de Estimação / Pets / Mascotas
INSERT INTO category_tags (name_pt, name_en, name_es, color, icon, keywords_pt, keywords_en, keywords_es) VALUES
('ração', 'pet food', 'comida para mascotas', '#10b981', '🥘', ARRAY['ração', 'comida', 'alimentação'], ARRAY['food', 'feed', 'nutrition'], ARRAY['comida', 'alimento', 'nutrición']),
('pet shop', 'pet store', 'tienda de mascotas', '#10b981', '🏪', ARRAY['pet shop', 'loja', 'animais'], ARRAY['pet store', 'shop', 'animals'], ARRAY['tienda', 'mascotas', 'animales']),
('veterinário', 'veterinarian', 'veterinario', '#10b981', '👨‍⚕️', ARRAY['veterinário', 'consulta', 'médico'], ARRAY['vet', 'veterinarian', 'doctor'], ARRAY['veterinario', 'consulta', 'médico']),
('vacinas', 'vaccines', 'vacunas', '#10b981', '💉', ARRAY['vacina', 'imunização', 'prevenção'], ARRAY['vaccine', 'immunization', 'prevention'], ARRAY['vacuna', 'inmunización', 'prevención']),
('banho & tosa', 'grooming', 'peluquería canina', '#10b981', '🛁', ARRAY['banho', 'tosa', 'higiene'], ARRAY['grooming', 'bath', 'hygiene'], ARRAY['baño', 'peluquería', 'higiene']),
('acessórios', 'accessories', 'accesorios', '#10b981', '🦴', ARRAY['acessórios', 'brinquedos', 'coleira'], ARRAY['accessories', 'toys', 'collar'], ARRAY['accesorios', 'juguetes', 'collar']);

-- Add tags for Viagens / Travel / Viajes
INSERT INTO category_tags (name_pt, name_en, name_es, color, icon, keywords_pt, keywords_en, keywords_es) VALUES
('passagens aéreas', 'airline tickets', 'boletos aéreos', '#3b82f6', '🎫', ARRAY['passagem', 'voo', 'avião'], ARRAY['ticket', 'flight', 'airplane'], ARRAY['boleto', 'vuelo', 'avión']),
('hospedagem', 'accommodation', 'alojamiento', '#3b82f6', '🏨', ARRAY['hotel', 'pousada', 'hospedagem'], ARRAY['hotel', 'lodging', 'accommodation'], ARRAY['hotel', 'alojamiento', 'hospedaje']),
('seguro viagem', 'travel insurance', 'seguro de viaje', '#3b82f6', '🛡️', ARRAY['seguro', 'proteção', 'viagem'], ARRAY['insurance', 'protection', 'travel'], ARRAY['seguro', 'protección', 'viaje']),
('aluguel de carro', 'car rental', 'alquiler de coche', '#3b82f6', '🚗', ARRAY['aluguel', 'carro', 'locadora'], ARRAY['rental', 'car', 'vehicle'], ARRAY['alquiler', 'coche', 'vehículo']),
('pacotes turísticos', 'tour packages', 'paquetes turísticos', '#3b82f6', '📦', ARRAY['pacote', 'turismo', 'excursão'], ARRAY['package', 'tour', 'excursion'], ARRAY['paquete', 'turismo', 'excursión']),
('alimentação viagem', 'travel meals', 'comidas de viaje', '#3b82f6', '🍽️', ARRAY['alimentação', 'restaurante', 'comida'], ARRAY['meals', 'restaurant', 'food'], ARRAY['comidas', 'restaurante', 'alimentación']);

-- Add tags for Beleza & Cuidados Pessoais / Beauty & Personal Care / Belleza y Cuidado Personal
INSERT INTO category_tags (name_pt, name_en, name_es, color, icon, keywords_pt, keywords_en, keywords_es) VALUES
('salão de beleza', 'beauty salon', 'salón de belleza', '#ec4899', '💇‍♀️', ARRAY['salão', 'beleza', 'cabelo'], ARRAY['salon', 'beauty', 'hair'], ARRAY['salón', 'belleza', 'cabello']),
('barbearia', 'barbershop', 'barbería', '#ec4899', '💈', ARRAY['barbearia', 'corte', 'cabelo'], ARRAY['barbershop', 'haircut', 'hair'], ARRAY['barbería', 'corte', 'cabello']),
('manicure', 'manicure', 'manicura', '#ec4899', '💅', ARRAY['manicure', 'unhas', 'esmaltação'], ARRAY['manicure', 'nails', 'polish'], ARRAY['manicura', 'uñas', 'esmalte']),
('estética', 'aesthetics', 'estética', '#ec4899', '✨', ARRAY['estética', 'tratamento', 'procedimento'], ARRAY['aesthetics', 'treatment', 'procedure'], ARRAY['estética', 'tratamiento', 'procedimiento']),
('produtos de higiene', 'hygiene products', 'productos de higiene', '#ec4899', '🧴', ARRAY['higiene', 'produtos', 'cosméticos'], ARRAY['hygiene', 'products', 'cosmetics'], ARRAY['higiene', 'productos', 'cosméticos']),
('maquiagem', 'makeup', 'maquillaje', '#ec4899', '💄', ARRAY['maquiagem', 'cosmético', 'beleza'], ARRAY['makeup', 'cosmetic', 'beauty'], ARRAY['maquillaje', 'cosmético', 'belleza']);

-- Add tags for Tecnologia & Assinaturas Digitais / Technology & Digital Subscriptions / Tecnología y Suscripciones Digitales
INSERT INTO category_tags (name_pt, name_en, name_es, color, icon, keywords_pt, keywords_en, keywords_es) VALUES
('celular', 'mobile phone', 'teléfono móvil', '#8b5cf6', '📱', ARRAY['celular', 'smartphone', 'telefone'], ARRAY['mobile', 'smartphone', 'phone'], ARRAY['móvil', 'smartphone', 'teléfono']),
('notebook', 'laptop', 'portátil', '#8b5cf6', '💻', ARRAY['notebook', 'laptop', 'computador'], ARRAY['laptop', 'notebook', 'computer'], ARRAY['portátil', 'laptop', 'computadora']),
('aplicativos', 'apps', 'aplicaciones', '#8b5cf6', '📱', ARRAY['aplicativos', 'apps', 'software'], ARRAY['apps', 'applications', 'software'], ARRAY['aplicaciones', 'apps', 'software']),
('antivírus', 'antivirus', 'antivirus', '#8b5cf6', '🛡️', ARRAY['antivírus', 'segurança', 'proteção'], ARRAY['antivirus', 'security', 'protection'], ARRAY['antivirus', 'seguridad', 'protección']),
('softwares', 'software', 'software', '#8b5cf6', '⚙️', ARRAY['software', 'programa', 'aplicação'], ARRAY['software', 'program', 'application'], ARRAY['software', 'programa', 'aplicación']),
('domínio/site', 'domain/website', 'dominio/sitio web', '#8b5cf6', '🌐', ARRAY['domínio', 'site', 'hospedagem'], ARRAY['domain', 'website', 'hosting'], ARRAY['dominio', 'sitio', 'hosting']),
('armazenamento em nuvem', 'cloud storage', 'almacenamiento en la nube', '#8b5cf6', '☁️', ARRAY['nuvem', 'armazenamento', 'backup'], ARRAY['cloud', 'storage', 'backup'], ARRAY['nube', 'almacenamiento', 'backup']);

-- Add tags for Reforma & Construção / Renovation & Construction / Reforma y Construcción
INSERT INTO category_tags (name_pt, name_en, name_es, color, icon, keywords_pt, keywords_en, keywords_es) VALUES
('material de construção', 'construction materials', 'materiales de construcción', '#f59e0b', '🧱', ARRAY['material', 'construção', 'obra'], ARRAY['materials', 'construction', 'building'], ARRAY['materiales', 'construcción', 'obra']),
('ferramentas', 'tools', 'herramientas', '#f59e0b', '🔧', ARRAY['ferramentas', 'equipamentos', 'utensílios'], ARRAY['tools', 'equipment', 'instruments'], ARRAY['herramientas', 'equipos', 'instrumentos']),
('mão de obra', 'labor', 'mano de obra', '#f59e0b', '👷', ARRAY['mão de obra', 'trabalho', 'serviços'], ARRAY['labor', 'work', 'services'], ARRAY['mano de obra', 'trabajo', 'servicios']),
('decoração', 'decoration', 'decoración', '#f59e0b', '🎨', ARRAY['decoração', 'design', 'móveis'], ARRAY['decoration', 'design', 'furniture'], ARRAY['decoración', 'diseño', 'muebles']),
('jardinagem', 'gardening', 'jardinería', '#f59e0b', '🌱', ARRAY['jardinagem', 'plantas', 'jardim'], ARRAY['gardening', 'plants', 'garden'], ARRAY['jardinería', 'plantas', 'jardín']),
('elétrica', 'electrical', 'eléctrica', '#f59e0b', '⚡', ARRAY['elétrica', 'instalação', 'fiação'], ARRAY['electrical', 'installation', 'wiring'], ARRAY['eléctrica', 'instalación', 'cableado']),
('hidráulica', 'plumbing', 'fontanería', '#f59e0b', '🔧', ARRAY['hidráulica', 'encanamento', 'água'], ARRAY['plumbing', 'pipes', 'water'], ARRAY['fontanería', 'tuberías', 'agua']);

-- Add tags for Receita Extraordinária / Extraordinary Income / Ingresos Extraordinarios
INSERT INTO category_tags (name_pt, name_en, name_es, color, icon, keywords_pt, keywords_en, keywords_es) VALUES
('herança', 'inheritance', 'herencia', '#059669', '👴', ARRAY['herança', 'legado', 'testamento'], ARRAY['inheritance', 'legacy', 'will'], ARRAY['herencia', 'legado', 'testamento']),
('doações recebidas', 'donations received', 'donaciones recibidas', '#059669', '🎁', ARRAY['doação', 'presente', 'ajuda'], ARRAY['donation', 'gift', 'help'], ARRAY['donación', 'regalo', 'ayuda']),
('loteria', 'lottery', 'lotería', '#059669', '🎰', ARRAY['loteria', 'prêmio', 'sorteio'], ARRAY['lottery', 'prize', 'raffle'], ARRAY['lotería', 'premio', 'sorteo']),
('indenizações', 'compensation', 'indemnizaciones', '#059669', '⚖️', ARRAY['indenização', 'compensação', 'ressarcimento'], ARRAY['compensation', 'indemnity', 'reimbursement'], ARRAY['indemnización', 'compensación', 'resarcimiento']),
('restituição de impostos', 'tax refund', 'devolución de impuestos', '#059669', '💰', ARRAY['restituição', 'imposto', 'devolução'], ARRAY['refund', 'tax', 'return'], ARRAY['devolución', 'impuesto', 'reembolso']),
('venda de bens', 'asset sales', 'venta de bienes', '#059669', '🏷️', ARRAY['venda', 'bens', 'patrimônio'], ARRAY['sale', 'assets', 'property'], ARRAY['venta', 'bienes', 'patrimonio']);

-- Get the category IDs for creating tag relations
DO $$
DECLARE
    pets_category_id uuid;
    travel_category_id uuid;
    beauty_category_id uuid;
    tech_category_id uuid;
    construction_category_id uuid;
    extraordinary_income_category_id uuid;
    
    -- Tag IDs for pets
    pet_food_tag_id uuid;
    pet_shop_tag_id uuid;
    vet_tag_id uuid;
    vaccines_tag_id uuid;
    grooming_tag_id uuid;
    accessories_tag_id uuid;
    
    -- Tag IDs for travel
    airline_tickets_tag_id uuid;
    accommodation_tag_id uuid;
    travel_insurance_tag_id uuid;
    car_rental_tag_id uuid;
    tour_packages_tag_id uuid;
    travel_meals_tag_id uuid;
    
    -- Tag IDs for beauty
    beauty_salon_tag_id uuid;
    barbershop_tag_id uuid;
    manicure_tag_id uuid;
    aesthetics_tag_id uuid;
    hygiene_products_tag_id uuid;
    makeup_tag_id uuid;
    
    -- Tag IDs for tech
    mobile_tag_id uuid;
    laptop_tag_id uuid;
    apps_tag_id uuid;
    antivirus_tag_id uuid;
    software_tag_id uuid;
    domain_tag_id uuid;
    cloud_storage_tag_id uuid;
    
    -- Tag IDs for construction
    construction_materials_tag_id uuid;
    tools_tag_id uuid;
    labor_tag_id uuid;
    decoration_tag_id uuid;
    gardening_tag_id uuid;
    electrical_tag_id uuid;
    plumbing_tag_id uuid;
    
    -- Tag IDs for extraordinary income
    inheritance_tag_id uuid;
    donations_tag_id uuid;
    lottery_tag_id uuid;
    compensation_tag_id uuid;
    tax_refund_tag_id uuid;
    asset_sales_tag_id uuid;
BEGIN
    -- Get category IDs
    SELECT id INTO pets_category_id FROM default_categories WHERE name_pt = 'Animais de Estimação';
    SELECT id INTO travel_category_id FROM default_categories WHERE name_pt = 'Viagens';
    SELECT id INTO beauty_category_id FROM default_categories WHERE name_pt = 'Beleza & Cuidados Pessoais';
    SELECT id INTO tech_category_id FROM default_categories WHERE name_pt = 'Tecnologia & Assinaturas Digitais';
    SELECT id INTO construction_category_id FROM default_categories WHERE name_pt = 'Reforma & Construção';
    SELECT id INTO extraordinary_income_category_id FROM default_categories WHERE name_pt = 'Receita Extraordinária';
    
    -- Get tag IDs for pets
    SELECT id INTO pet_food_tag_id FROM category_tags WHERE name_pt = 'ração';
    SELECT id INTO pet_shop_tag_id FROM category_tags WHERE name_pt = 'pet shop';
    SELECT id INTO vet_tag_id FROM category_tags WHERE name_pt = 'veterinário';
    SELECT id INTO vaccines_tag_id FROM category_tags WHERE name_pt = 'vacinas';
    SELECT id INTO grooming_tag_id FROM category_tags WHERE name_pt = 'banho & tosa';
    SELECT id INTO accessories_tag_id FROM category_tags WHERE name_pt = 'acessórios';
    
    -- Get tag IDs for travel
    SELECT id INTO airline_tickets_tag_id FROM category_tags WHERE name_pt = 'passagens aéreas';
    SELECT id INTO accommodation_tag_id FROM category_tags WHERE name_pt = 'hospedagem';
    SELECT id INTO travel_insurance_tag_id FROM category_tags WHERE name_pt = 'seguro viagem';
    SELECT id INTO car_rental_tag_id FROM category_tags WHERE name_pt = 'aluguel de carro';
    SELECT id INTO tour_packages_tag_id FROM category_tags WHERE name_pt = 'pacotes turísticos';
    SELECT id INTO travel_meals_tag_id FROM category_tags WHERE name_pt = 'alimentação viagem';
    
    -- Get tag IDs for beauty
    SELECT id INTO beauty_salon_tag_id FROM category_tags WHERE name_pt = 'salão de beleza';
    SELECT id INTO barbershop_tag_id FROM category_tags WHERE name_pt = 'barbearia';
    SELECT id INTO manicure_tag_id FROM category_tags WHERE name_pt = 'manicure';
    SELECT id INTO aesthetics_tag_id FROM category_tags WHERE name_pt = 'estética';
    SELECT id INTO hygiene_products_tag_id FROM category_tags WHERE name_pt = 'produtos de higiene';
    SELECT id INTO makeup_tag_id FROM category_tags WHERE name_pt = 'maquiagem';
    
    -- Get tag IDs for tech
    SELECT id INTO mobile_tag_id FROM category_tags WHERE name_pt = 'celular';
    SELECT id INTO laptop_tag_id FROM category_tags WHERE name_pt = 'notebook';
    SELECT id INTO apps_tag_id FROM category_tags WHERE name_pt = 'aplicativos';
    SELECT id INTO antivirus_tag_id FROM category_tags WHERE name_pt = 'antivírus';
    SELECT id INTO software_tag_id FROM category_tags WHERE name_pt = 'softwares';
    SELECT id INTO domain_tag_id FROM category_tags WHERE name_pt = 'domínio/site';
    SELECT id INTO cloud_storage_tag_id FROM category_tags WHERE name_pt = 'armazenamento em nuvem';
    
    -- Get tag IDs for construction
    SELECT id INTO construction_materials_tag_id FROM category_tags WHERE name_pt = 'material de construção';
    SELECT id INTO tools_tag_id FROM category_tags WHERE name_pt = 'ferramentas';
    SELECT id INTO labor_tag_id FROM category_tags WHERE name_pt = 'mão de obra';
    SELECT id INTO decoration_tag_id FROM category_tags WHERE name_pt = 'decoração';
    SELECT id INTO gardening_tag_id FROM category_tags WHERE name_pt = 'jardinagem';
    SELECT id INTO electrical_tag_id FROM category_tags WHERE name_pt = 'elétrica';
    SELECT id INTO plumbing_tag_id FROM category_tags WHERE name_pt = 'hidráulica';
    
    -- Get tag IDs for extraordinary income
    SELECT id INTO inheritance_tag_id FROM category_tags WHERE name_pt = 'herança';
    SELECT id INTO donations_tag_id FROM category_tags WHERE name_pt = 'doações recebidas';
    SELECT id INTO lottery_tag_id FROM category_tags WHERE name_pt = 'loteria';
    SELECT id INTO compensation_tag_id FROM category_tags WHERE name_pt = 'indenizações';
    SELECT id INTO tax_refund_tag_id FROM category_tags WHERE name_pt = 'restituição de impostos';
    SELECT id INTO asset_sales_tag_id FROM category_tags WHERE name_pt = 'venda de bens';
    
    -- Create tag relations for pets category
    INSERT INTO category_tag_relations (category_id, tag_id) VALUES
    (pets_category_id, pet_food_tag_id),
    (pets_category_id, pet_shop_tag_id),
    (pets_category_id, vet_tag_id),
    (pets_category_id, vaccines_tag_id),
    (pets_category_id, grooming_tag_id),
    (pets_category_id, accessories_tag_id);
    
    -- Create tag relations for travel category
    INSERT INTO category_tag_relations (category_id, tag_id) VALUES
    (travel_category_id, airline_tickets_tag_id),
    (travel_category_id, accommodation_tag_id),
    (travel_category_id, travel_insurance_tag_id),
    (travel_category_id, car_rental_tag_id),
    (travel_category_id, tour_packages_tag_id),
    (travel_category_id, travel_meals_tag_id);
    
    -- Create tag relations for beauty category
    INSERT INTO category_tag_relations (category_id, tag_id) VALUES
    (beauty_category_id, beauty_salon_tag_id),
    (beauty_category_id, barbershop_tag_id),
    (beauty_category_id, manicure_tag_id),
    (beauty_category_id, aesthetics_tag_id),
    (beauty_category_id, hygiene_products_tag_id),
    (beauty_category_id, makeup_tag_id);
    
    -- Create tag relations for tech category
    INSERT INTO category_tag_relations (category_id, tag_id) VALUES
    (tech_category_id, mobile_tag_id),
    (tech_category_id, laptop_tag_id),
    (tech_category_id, apps_tag_id),
    (tech_category_id, antivirus_tag_id),
    (tech_category_id, software_tag_id),
    (tech_category_id, domain_tag_id),
    (tech_category_id, cloud_storage_tag_id);
    
    -- Create tag relations for construction category
    INSERT INTO category_tag_relations (category_id, tag_id) VALUES
    (construction_category_id, construction_materials_tag_id),
    (construction_category_id, tools_tag_id),
    (construction_category_id, labor_tag_id),
    (construction_category_id, decoration_tag_id),
    (construction_category_id, gardening_tag_id),
    (construction_category_id, electrical_tag_id),
    (construction_category_id, plumbing_tag_id);
    
    -- Create tag relations for extraordinary income category
    INSERT INTO category_tag_relations (category_id, tag_id) VALUES
    (extraordinary_income_category_id, inheritance_tag_id),
    (extraordinary_income_category_id, donations_tag_id),
    (extraordinary_income_category_id, lottery_tag_id),
    (extraordinary_income_category_id, compensation_tag_id),
    (extraordinary_income_category_id, tax_refund_tag_id),
    (extraordinary_income_category_id, asset_sales_tag_id);
END $$;