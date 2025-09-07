-- Primeiro, adicionar as novas tags para despesas
INSERT INTO public.category_tags (name_pt, name_en, name_es, color, icon, keywords_pt, keywords_en, keywords_es) VALUES

-- Alimentação
('supermercado', 'supermarket', 'supermercado', '#10b981', 'ShoppingCart', ARRAY['supermercado', 'compras', 'mercado'], ARRAY['supermarket', 'grocery', 'shopping'], ARRAY['supermercado', 'compras', 'mercado']),
('padaria', 'bakery', 'panadería', '#f59e0b', 'Coffee', ARRAY['padaria', 'pão', 'doces'], ARRAY['bakery', 'bread', 'pastry'], ARRAY['panadería', 'pan', 'dulces']),
('restaurante', 'restaurant', 'restaurante', '#ef4444', 'UtensilsCrossed', ARRAY['restaurante', 'jantar', 'comida'], ARRAY['restaurant', 'dining', 'food'], ARRAY['restaurante', 'cena', 'comida']),
('lanchonete', 'snack bar', 'cafetería', '#f97316', 'Coffee', ARRAY['lanchonete', 'lanche', 'snack'], ARRAY['snack bar', 'snack', 'cafe'], ARRAY['cafetería', 'merienda', 'snack']),
('delivery', 'delivery', 'entrega', '#8b5cf6', 'Truck', ARRAY['delivery', 'entrega', 'ifood'], ARRAY['delivery', 'takeout', 'order'], ARRAY['entrega', 'pedido', 'delivery']),
('feira', 'market', 'feria', '#22c55e', 'Apple', ARRAY['feira', 'frutas', 'verduras'], ARRAY['market', 'fruits', 'vegetables'], ARRAY['feria', 'frutas', 'verduras']),
('café', 'coffee', 'café', '#92400e', 'Coffee', ARRAY['café', 'cafeteria', 'cappuccino'], ARRAY['coffee', 'cafe', 'espresso'], ARRAY['café', 'cafetería', 'cappuccino']),
('fast food', 'fast food', 'comida rápida', '#dc2626', 'Zap', ARRAY['fast food', 'mcdonald', 'burger'], ARRAY['fast food', 'burger', 'quick'], ARRAY['comida rápida', 'hamburguesa', 'rápido']),

-- Transporte
('combustível', 'fuel', 'combustible', '#374151', 'Fuel', ARRAY['combustível', 'gasolina', 'etanol'], ARRAY['fuel', 'gas', 'gasoline'], ARRAY['combustible', 'gasolina', 'etanol']),
('uber/99', 'rideshare', 'transporte compartido', '#1f2937', 'Car', ARRAY['uber', '99', 'corrida'], ARRAY['uber', 'lyft', 'rideshare'], ARRAY['uber', '99', 'viaje']),
('ônibus', 'bus', 'autobús', '#059669', 'Bus', ARRAY['ônibus', 'transporte público', 'bilhete'], ARRAY['bus', 'public transport', 'ticket'], ARRAY['autobús', 'transporte público', 'billete']),
('metrô', 'subway', 'metro', '#0369a1', 'Train', ARRAY['metrô', 'metro', 'trem'], ARRAY['subway', 'metro', 'train'], ARRAY['metro', 'tren', 'subterráneo']),
('pedágio', 'toll', 'peaje', '#7c2d12', 'Coins', ARRAY['pedágio', 'taxa', 'estrada'], ARRAY['toll', 'highway', 'fee'], ARRAY['peaje', 'autopista', 'tasa']),
('estacionamento', 'parking', 'estacionamiento', '#4b5563', 'ParkingCircle', ARRAY['estacionamento', 'parking', 'vaga'], ARRAY['parking', 'lot', 'space'], ARRAY['estacionamiento', 'parking', 'espacio']),
('manutenção veículo', 'vehicle maintenance', 'mantenimiento vehículo', '#991b1b', 'Wrench', ARRAY['manutenção', 'oficina', 'reparo'], ARRAY['maintenance', 'repair', 'garage'], ARRAY['mantenimiento', 'taller', 'reparación']),
('táxi', 'taxi', 'taxi', '#fbbf24', 'Car', ARRAY['táxi', 'corrida', 'transporte'], ARRAY['taxi', 'cab', 'ride'], ARRAY['taxi', 'viaje', 'transporte']),

-- Moradia
('aluguel', 'rent', 'alquiler', '#1e40af', 'Home', ARRAY['aluguel', 'moradia', 'casa'], ARRAY['rent', 'housing', 'home'], ARRAY['alquiler', 'vivienda', 'casa']),
('condomínio', 'condo fee', 'condominio', '#059669', 'Building', ARRAY['condomínio', 'taxa', 'prédio'], ARRAY['condo fee', 'building', 'maintenance'], ARRAY['condominio', 'tasa', 'edificio']),
('luz', 'electricity', 'electricidad', '#eab308', 'Zap', ARRAY['luz', 'energia', 'conta'], ARRAY['electricity', 'power', 'bill'], ARRAY['electricidad', 'energía', 'factura']),
('água', 'water', 'agua', '#0ea5e9', 'Droplets', ARRAY['água', 'saneamento', 'conta'], ARRAY['water', 'utility', 'bill'], ARRAY['agua', 'servicio', 'factura']),
('gás', 'gas', 'gas', '#f97316', 'Flame', ARRAY['gás', 'cozinha', 'conta'], ARRAY['gas', 'cooking', 'bill'], ARRAY['gas', 'cocina', 'factura']),
('internet', 'internet', 'internet', '#7c3aed', 'Wifi', ARRAY['internet', 'wifi', 'banda larga'], ARRAY['internet', 'wifi', 'broadband'], ARRAY['internet', 'wifi', 'banda ancha']),
('telefone fixo', 'landline', 'teléfono fijo', '#6b7280', 'Phone', ARRAY['telefone', 'fixo', 'linha'], ARRAY['landline', 'phone', 'line'], ARRAY['teléfono', 'fijo', 'línea']),
('manutenção', 'maintenance', 'mantenimiento', '#78716c', 'Wrench', ARRAY['manutenção', 'reparo', 'reforma'], ARRAY['maintenance', 'repair', 'fix'], ARRAY['mantenimiento', 'reparación', 'arreglo']),
('móveis', 'furniture', 'muebles', '#a855f7', 'Armchair', ARRAY['móveis', 'casa', 'decoração'], ARRAY['furniture', 'home', 'decor'], ARRAY['muebles', 'casa', 'decoración']),
('eletrodomésticos', 'appliances', 'electrodomésticos', '#64748b', 'Zap', ARRAY['eletrodomésticos', 'geladeira', 'fogão'], ARRAY['appliances', 'refrigerator', 'stove'], ARRAY['electrodomésticos', 'refrigerador', 'estufa']),

-- Saúde  
('farmácia', 'pharmacy', 'farmacia', '#dc2626', 'Pill', ARRAY['farmácia', 'remédio', 'medicamento'], ARRAY['pharmacy', 'medicine', 'drug'], ARRAY['farmacia', 'medicina', 'medicamento']),
('plano de saúde', 'health insurance', 'seguro de salud', '#059669', 'Shield', ARRAY['plano', 'saúde', 'convênio'], ARRAY['health insurance', 'medical', 'coverage'], ARRAY['seguro de salud', 'médico', 'cobertura']),
('exames', 'medical tests', 'exámenes', '#0369a1', 'Stethoscope', ARRAY['exames', 'laboratório', 'análise'], ARRAY['medical tests', 'lab', 'analysis'], ARRAY['exámenes', 'laboratorio', 'análisis']),
('consultas', 'appointments', 'consultas', '#7c3aed', 'UserCheck', ARRAY['consultas', 'médico', 'especialista'], ARRAY['appointments', 'doctor', 'specialist'], ARRAY['consultas', 'médico', 'especialista']),
('academia', 'gym', 'gimnasio', '#f59e0b', 'Dumbbell', ARRAY['academia', 'ginástica', 'musculação'], ARRAY['gym', 'fitness', 'workout'], ARRAY['gimnasio', 'fitness', 'ejercicio']),
('hospital', 'hospital', 'hospital', '#ef4444', 'Hospital', ARRAY['hospital', 'emergência', 'internação'], ARRAY['hospital', 'emergency', 'admission'], ARRAY['hospital', 'emergencia', 'internación']),
('terapia', 'therapy', 'terapia', '#8b5cf6', 'Brain', ARRAY['terapia', 'psicólogo', 'tratamento'], ARRAY['therapy', 'psychologist', 'treatment'], ARRAY['terapia', 'psicólogo', 'tratamiento']),

-- Educação
('faculdade', 'college', 'universidad', '#1d4ed8', 'GraduationCap', ARRAY['faculdade', 'universidade', 'mensalidade'], ARRAY['college', 'university', 'tuition'], ARRAY['universidad', 'colegio', 'matrícula']),
('curso online', 'online course', 'curso en línea', '#059669', 'Monitor', ARRAY['curso', 'online', 'udemy'], ARRAY['online course', 'e-learning', 'mooc'], ARRAY['curso en línea', 'aprendizaje', 'digital']),
('livros', 'books', 'libros', '#92400e', 'Book', ARRAY['livros', 'literatura', 'estudo'], ARRAY['books', 'literature', 'study'], ARRAY['libros', 'literatura', 'estudio']),
('material escolar', 'school supplies', 'material escolar', '#7c2d12', 'PenTool', ARRAY['material', 'escolar', 'caderno'], ARRAY['school supplies', 'notebook', 'pen'], ARRAY['material escolar', 'cuaderno', 'bolígrafo']),
('palestras', 'lectures', 'conferencias', '#0d9488', 'Presentation', ARRAY['palestras', 'eventos', 'workshop'], ARRAY['lectures', 'events', 'workshop'], ARRAY['conferencias', 'eventos', 'taller']),
('treinamentos', 'training', 'entrenamiento', '#ea580c', 'Target', ARRAY['treinamentos', 'capacitação', 'curso'], ARRAY['training', 'development', 'course'], ARRAY['entrenamiento', 'capacitación', 'curso']);

-- Continuar com as demais categorias...
INSERT INTO public.category_tags (name_pt, name_en, name_es, color, icon, keywords_pt, keywords_en, keywords_es) VALUES

-- Lazer & Entretenimento
('cinema', 'cinema', 'cine', '#dc2626', 'Film', ARRAY['cinema', 'filme', 'ingresso'], ARRAY['cinema', 'movie', 'ticket'], ARRAY['cine', 'película', 'entrada']),
('shows', 'concerts', 'conciertos', '#7c3aed', 'Music', ARRAY['shows', 'música', 'ingresso'], ARRAY['concerts', 'music', 'ticket'], ARRAY['conciertos', 'música', 'entrada']),
('streaming', 'streaming', 'streaming', '#ef4444', 'Play', ARRAY['streaming', 'netflix', 'spotify'], ARRAY['streaming', 'netflix', 'spotify'], ARRAY['streaming', 'netflix', 'spotify']),
('bar', 'bar', 'bar', '#f59e0b', 'Wine', ARRAY['bar', 'bebida', 'happy hour'], ARRAY['bar', 'drink', 'happy hour'], ARRAY['bar', 'bebida', 'hora feliz']),
('viagem', 'travel', 'viaje', '#0ea5e9', 'Plane', ARRAY['viagem', 'turismo', 'férias'], ARRAY['travel', 'tourism', 'vacation'], ARRAY['viaje', 'turismo', 'vacaciones']),
('festas', 'parties', 'fiestas', '#ec4899', 'PartyPopper', ARRAY['festas', 'comemoração', 'evento'], ARRAY['parties', 'celebration', 'event'], ARRAY['fiestas', 'celebración', 'evento']),
('hobbies', 'hobbies', 'aficiones', '#8b5cf6', 'Palette', ARRAY['hobbies', 'passatempo', 'lazer'], ARRAY['hobbies', 'pastime', 'leisure'], ARRAY['aficiones', 'pasatiempo', 'ocio']),
('esportes', 'sports', 'deportes', '#059669', 'Trophy', ARRAY['esportes', 'futebol', 'atividade'], ARRAY['sports', 'football', 'activity'], ARRAY['deportes', 'fútbol', 'actividad']),

-- Compras Pessoais
('roupas', 'clothing', 'ropa', '#ec4899', 'Shirt', ARRAY['roupas', 'vestuário', 'moda'], ARRAY['clothing', 'apparel', 'fashion'], ARRAY['ropa', 'vestimenta', 'moda']),
('calçados', 'shoes', 'calzado', '#7c2d12', 'ShirtIcon', ARRAY['calçados', 'sapatos', 'tênis'], ARRAY['shoes', 'footwear', 'sneakers'], ARRAY['calzado', 'zapatos', 'zapatillas']),
('acessórios', 'accessories', 'accesorios', '#a855f7', 'Watch', ARRAY['acessórios', 'relógio', 'bolsa'], ARRAY['accessories', 'watch', 'bag'], ARRAY['accesorios', 'reloj', 'bolso']),
('eletrônicos', 'electronics', 'electrónicos', '#374151', 'Smartphone', ARRAY['eletrônicos', 'celular', 'tablet'], ARRAY['electronics', 'phone', 'tablet'], ARRAY['electrónicos', 'celular', 'tableta']),
('cosméticos', 'cosmetics', 'cosméticos', '#f97316', 'Sparkles', ARRAY['cosméticos', 'maquiagem', 'beleza'], ARRAY['cosmetics', 'makeup', 'beauty'], ARRAY['cosméticos', 'maquillaje', 'belleza']),
('perfumaria', 'perfumery', 'perfumería', '#be185d', 'Flower', ARRAY['perfumaria', 'perfume', 'fragrância'], ARRAY['perfumery', 'perfume', 'fragrance'], ARRAY['perfumería', 'perfume', 'fragancia']),

-- Família & Filhos
('escola', 'school', 'escuela', '#1d4ed8', 'School', ARRAY['escola', 'educação', 'mensalidade'], ARRAY['school', 'education', 'tuition'], ARRAY['escuela', 'educación', 'matrícula']),
('creche', 'daycare', 'guardería', '#059669', 'Baby', ARRAY['creche', 'berçário', 'cuidados'], ARRAY['daycare', 'nursery', 'childcare'], ARRAY['guardería', 'nursería', 'cuidado']),
('brinquedos', 'toys', 'juguetes', '#f59e0b', 'Gamepad2', ARRAY['brinquedos', 'jogos', 'diversão'], ARRAY['toys', 'games', 'fun'], ARRAY['juguetes', 'juegos', 'diversión']),
('roupas infantis', 'children clothes', 'ropa infantil', '#ec4899', 'Baby', ARRAY['roupas', 'infantis', 'criança'], ARRAY['children clothes', 'kids', 'baby'], ARRAY['ropa infantil', 'niños', 'bebé']),
('mesada', 'allowance', 'mesada', '#10b981', 'PiggyBank', ARRAY['mesada', 'dinheiro', 'filhos'], ARRAY['allowance', 'money', 'children'], ARRAY['mesada', 'dinero', 'hijos']),
('cuidados', 'childcare', 'cuidados', '#7c3aed', 'Heart', ARRAY['cuidados', 'babá', 'criança'], ARRAY['childcare', 'babysitter', 'child'], ARRAY['cuidados', 'niñera', 'niño']),

-- Finanças & Serviços
('taxas bancárias', 'bank fees', 'tasas bancarias', '#374151', 'CreditCard', ARRAY['taxas', 'banco', 'tarifa'], ARRAY['bank fees', 'charges', 'banking'], ARRAY['tasas bancarias', 'cargos', 'banco']),
('seguros', 'insurance', 'seguros', '#059669', 'Shield', ARRAY['seguros', 'proteção', 'apólice'], ARRAY['insurance', 'protection', 'policy'], ARRAY['seguros', 'protección', 'póliza']),
('investimentos', 'investments', 'inversiones', '#10b981', 'TrendingUp', ARRAY['investimentos', 'aplicação', 'renda'], ARRAY['investments', 'portfolio', 'returns'], ARRAY['inversiones', 'cartera', 'rendimientos']),
('impostos', 'taxes', 'impuestos', '#dc2626', 'Receipt', ARRAY['impostos', 'ir', 'declaração'], ARRAY['taxes', 'irs', 'return'], ARRAY['impuestos', 'declaración', 'hacienda']),
('mensalidades', 'subscriptions', 'suscripciones', '#8b5cf6', 'Calendar', ARRAY['mensalidades', 'assinatura', 'recorrente'], ARRAY['subscriptions', 'membership', 'recurring'], ARRAY['suscripciones', 'membresía', 'recurrente']),
('assinatura de serviços', 'service subscriptions', 'suscripciones de servicios', '#0ea5e9', 'Repeat', ARRAY['assinatura', 'serviços', 'mensal'], ARRAY['subscriptions', 'services', 'monthly'], ARRAY['suscripciones', 'servicios', 'mensual']);

-- Continuar com mais categorias...
INSERT INTO public.category_tags (name_pt, name_en, name_es, color, icon, keywords_pt, keywords_en, keywords_es) VALUES

-- Trabalho & Negócios
('coworking', 'coworking', 'coworking', '#0369a1', 'Building2', ARRAY['coworking', 'escritório', 'trabalho'], ARRAY['coworking', 'office', 'workspace'], ARRAY['coworking', 'oficina', 'trabajo']),
('software', 'software', 'software', '#7c3aed', 'Code', ARRAY['software', 'programa', 'licença'], ARRAY['software', 'program', 'license'], ARRAY['software', 'programa', 'licencia']),
('equipamentos', 'equipment', 'equipos', '#374151', 'Monitor', ARRAY['equipamentos', 'computador', 'escritório'], ARRAY['equipment', 'computer', 'office'], ARRAY['equipos', 'computadora', 'oficina']),
('viagens de trabalho', 'business travel', 'viajes de trabajo', '#0ea5e9', 'Briefcase', ARRAY['viagens', 'trabalho', 'negócios'], ARRAY['business travel', 'work', 'trips'], ARRAY['viajes de trabajo', 'negocios', 'viajes']),
('marketing', 'marketing', 'marketing', '#f59e0b', 'Megaphone', ARRAY['marketing', 'publicidade', 'propaganda'], ARRAY['marketing', 'advertising', 'promotion'], ARRAY['marketing', 'publicidad', 'promoción']),
('impostos PJ', 'business taxes', 'impuestos empresariales', '#dc2626', 'FileText', ARRAY['impostos', 'pj', 'empresa'], ARRAY['business taxes', 'corporate', 'company'], ARRAY['impuestos empresariales', 'corporativo', 'empresa']),

-- Doações & Presentes
('presentes', 'gifts', 'regalos', '#ec4899', 'Gift', ARRAY['presentes', 'presente', 'aniversário'], ARRAY['gifts', 'present', 'birthday'], ARRAY['regalos', 'regalo', 'cumpleaños']),
('doações', 'donations', 'donaciones', '#10b981', 'Heart', ARRAY['doações', 'caridade', 'ong'], ARRAY['donations', 'charity', 'ngo'], ARRAY['donaciones', 'caridad', 'ong']),
('caridade', 'charity', 'caridad', '#059669', 'HandHeart', ARRAY['caridade', 'ajuda', 'solidariedade'], ARRAY['charity', 'help', 'solidarity'], ARRAY['caridad', 'ayuda', 'solidaridad']),
('festas de aniversário', 'birthday parties', 'fiestas de cumpleaños', '#f97316', 'Cake', ARRAY['aniversário', 'festa', 'comemoração'], ARRAY['birthday', 'party', 'celebration'], ARRAY['cumpleaños', 'fiesta', 'celebración']),
('casamentos', 'weddings', 'bodas', '#be185d', 'Heart', ARRAY['casamentos', 'cerimônia', 'festa'], ARRAY['weddings', 'ceremony', 'party'], ARRAY['bodas', 'ceremonia', 'fiesta']),

-- Outros
('emergências', 'emergencies', 'emergencias', '#dc2626', 'AlertTriangle', ARRAY['emergências', 'urgente', 'imprevisto'], ARRAY['emergencies', 'urgent', 'unexpected'], ARRAY['emergencias', 'urgente', 'imprevisto']),
('imprevistos', 'unexpected', 'imprevistos', '#f59e0b', 'Zap', ARRAY['imprevistos', 'surpresa', 'eventual'], ARRAY['unexpected', 'surprise', 'occasional'], ARRAY['imprevistos', 'sorpresa', 'eventual']),
('não categorizados', 'uncategorized', 'sin categorizar', '#6b7280', 'HelpCircle', ARRAY['outros', 'diversos', 'geral'], ARRAY['others', 'miscellaneous', 'general'], ARRAY['otros', 'varios', 'general']),

-- Investimentos (categoria específica)
('ações', 'stocks', 'acciones', '#10b981', 'TrendingUp', ARRAY['ações', 'bolsa', 'papéis'], ARRAY['stocks', 'shares', 'equity'], ARRAY['acciones', 'bolsa', 'valores']),
('fundos imobiliários', 'real estate funds', 'fondos inmobiliarios', '#059669', 'Building', ARRAY['fiis', 'imobiliário', 'fundos'], ARRAY['reits', 'real estate', 'funds'], ARRAY['fondos inmobiliarios', 'bienes raíces', 'fondos']),
('criptomoedas', 'cryptocurrency', 'criptomonedas', '#f59e0b', 'Bitcoin', ARRAY['crypto', 'bitcoin', 'ethereum'], ARRAY['crypto', 'bitcoin', 'ethereum'], ARRAY['crypto', 'bitcoin', 'ethereum']),
('renda fixa', 'fixed income', 'renta fija', '#0369a1', 'PiggyBank', ARRAY['renda fixa', 'cdb', 'poupança'], ARRAY['fixed income', 'bonds', 'savings'], ARRAY['renta fija', 'bonos', 'ahorro']),
('previdência privada', 'private pension', 'pensión privada', '#7c3aed', 'Shield', ARRAY['previdência', 'aposentadoria', 'pgbl'], ARRAY['pension', 'retirement', 'private'], ARRAY['pensión privada', 'jubilación', 'retiro']),
('tesouro direto', 'government bonds', 'bonos del tesoro', '#1d4ed8', 'Landmark', ARRAY['tesouro', 'governo', 'títulos'], ARRAY['treasury', 'government', 'bonds'], ARRAY['tesoro', 'gobierno', 'bonos']),
('corretagem', 'brokerage', 'corretaje', '#374151', 'Calculator', ARRAY['corretagem', 'taxa', 'broker'], ARRAY['brokerage', 'fees', 'broker'], ARRAY['corretaje', 'tarifas', 'corredor']),

-- Animais de Estimação
('ração', 'pet food', 'comida para mascotas', '#92400e', 'Heart', ARRAY['ração', 'comida', 'pet'], ARRAY['pet food', 'food', 'pet'], ARRAY['comida para mascotas', 'comida', 'mascota']),
('pet shop', 'pet store', 'tienda de mascotas', '#059669', 'Store', ARRAY['pet shop', 'loja', 'animais'], ARRAY['pet store', 'shop', 'animals'], ARRAY['tienda de mascotas', 'tienda', 'animales']),
('veterinário', 'veterinarian', 'veterinario', '#dc2626', 'Stethoscope', ARRAY['veterinário', 'vet', 'consulta'], ARRAY['veterinarian', 'vet', 'checkup'], ARRAY['veterinario', 'vet', 'consulta']),
('vacinas', 'vaccines', 'vacunas', '#0ea5e9', 'Syringe', ARRAY['vacinas', 'imunização', 'prevenção'], ARRAY['vaccines', 'immunization', 'prevention'], ARRAY['vacunas', 'inmunización', 'prevención']),
('banho & tosa', 'grooming', 'peluquería', '#ec4899', 'Scissors', ARRAY['banho', 'tosa', 'higiene'], ARRAY['grooming', 'bath', 'hygiene'], ARRAY['peluquería', 'baño', 'higiene']),
('acessórios', 'pet accessories', 'accesorios para mascotas', '#a855f7', 'Heart', ARRAY['acessórios', 'coleira', 'brinquedos'], ARRAY['accessories', 'collar', 'toys'], ARRAY['accesorios', 'collar', 'juguetes']);

-- Continuar com as últimas categorias...
INSERT INTO public.category_tags (name_pt, name_en, name_es, color, icon, keywords_pt, keywords_en, keywords_es) VALUES

-- Viagens (separada de Lazer)
('passagens aéreas', 'flights', 'vuelos', '#0ea5e9', 'Plane', ARRAY['passagens', 'aéreas', 'voo'], ARRAY['flights', 'airfare', 'tickets'], ARRAY['vuelos', 'pasajes', 'aéreos']),
('hospedagem', 'accommodation', 'alojamiento', '#059669', 'Bed', ARRAY['hospedagem', 'hotel', 'pousada'], ARRAY['accommodation', 'hotel', 'lodging'], ARRAY['alojamiento', 'hotel', 'hospedaje']),
('seguro viagem', 'travel insurance', 'seguro de viaje', '#7c3aed', 'Shield', ARRAY['seguro', 'viagem', 'proteção'], ARRAY['travel insurance', 'protection', 'coverage'], ARRAY['seguro de viaje', 'protección', 'cobertura']),
('aluguel de carro', 'car rental', 'alquiler de auto', '#374151', 'Car', ARRAY['aluguel', 'carro', 'locadora'], ARRAY['car rental', 'rental', 'vehicle'], ARRAY['alquiler de auto', 'renta', 'vehículo']),
('pacotes turísticos', 'tour packages', 'paquetes turísticos', '#f59e0b', 'MapPin', ARRAY['pacotes', 'turismo', 'excursão'], ARRAY['tour packages', 'tourism', 'excursion'], ARRAY['paquetes turísticos', 'turismo', 'excursión']),
('alimentação viagem', 'travel meals', 'comidas de viaje', '#ef4444', 'UtensilsCrossed', ARRAY['alimentação', 'viagem', 'restaurante'], ARRAY['travel meals', 'dining', 'restaurant'], ARRAY['comidas de viaje', 'restaurante', 'comida']),

-- Beleza & Cuidados Pessoais
('salão de beleza', 'beauty salon', 'salón de belleza', '#ec4899', 'Scissors', ARRAY['salão', 'beleza', 'cabelo'], ARRAY['beauty salon', 'hair', 'beauty'], ARRAY['salón de belleza', 'cabello', 'belleza']),
('barbearia', 'barbershop', 'barbería', '#78716c', 'Scissors', ARRAY['barbearia', 'cabelo', 'barba'], ARRAY['barbershop', 'hair', 'beard'], ARRAY['barbería', 'cabello', 'barba']),
('manicure', 'manicure', 'manicura', '#f97316', 'Sparkles', ARRAY['manicure', 'unhas', 'esmalte'], ARRAY['manicure', 'nails', 'polish'], ARRAY['manicura', 'uñas', 'esmalte']),
('estética', 'aesthetics', 'estética', '#be185d', 'Sparkles', ARRAY['estética', 'tratamentos', 'beleza'], ARRAY['aesthetics', 'treatments', 'beauty'], ARRAY['estética', 'tratamientos', 'belleza']),
('produtos de higiene', 'hygiene products', 'productos de higiene', '#0ea5e9', 'Droplets', ARRAY['higiene', 'produtos', 'limpeza'], ARRAY['hygiene', 'products', 'cleansing'], ARRAY['higiene', 'productos', 'limpieza']),
('maquiagem', 'makeup', 'maquillaje', '#ec4899', 'Palette', ARRAY['maquiagem', 'cosméticos', 'beleza'], ARRAY['makeup', 'cosmetics', 'beauty'], ARRAY['maquillaje', 'cosméticos', 'belleza']),

-- Tecnologia & Assinaturas Digitais
('celular', 'mobile phone', 'teléfono móvil', '#374151', 'Smartphone', ARRAY['celular', 'telefone', 'conta'], ARRAY['mobile phone', 'cell', 'bill'], ARRAY['teléfono móvil', 'celular', 'factura']),
('notebook', 'laptop', 'portátil', '#64748b', 'Laptop', ARRAY['notebook', 'computador', 'laptop'], ARRAY['laptop', 'computer', 'notebook'], ARRAY['portátil', 'computadora', 'laptop']),
('aplicativos', 'apps', 'aplicaciones', '#7c3aed', 'Smartphone', ARRAY['aplicativos', 'apps', 'assinatura'], ARRAY['apps', 'applications', 'subscription'], ARRAY['aplicaciones', 'apps', 'suscripción']),
('antivírus', 'antivirus', 'antivirus', '#dc2626', 'Shield', ARRAY['antivírus', 'segurança', 'proteção'], ARRAY['antivirus', 'security', 'protection'], ARRAY['antivirus', 'seguridad', 'protección']),
('softwares', 'software', 'software', '#0369a1', 'Code', ARRAY['softwares', 'programas', 'licença'], ARRAY['software', 'programs', 'license'], ARRAY['software', 'programas', 'licencia']),
('domínio/site', 'domain/website', 'dominio/sitio web', '#10b981', 'Globe', ARRAY['domínio', 'site', 'hospedagem'], ARRAY['domain', 'website', 'hosting'], ARRAY['dominio', 'sitio web', 'hosting']),
('armazenamento em nuvem', 'cloud storage', 'almacenamiento en nube', '#0ea5e9', 'Cloud', ARRAY['nuvem', 'storage', 'backup'], ARRAY['cloud', 'storage', 'backup'], ARRAY['nube', 'almacenamiento', 'respaldo']),

-- Reforma & Construção
('material de construção', 'construction material', 'material de construcción', '#78716c', 'Hammer', ARRAY['material', 'construção', 'obra'], ARRAY['construction', 'material', 'building'], ARRAY['material de construcción', 'construcción', 'obra']),
('ferramentas', 'tools', 'herramientas', '#374151', 'Wrench', ARRAY['ferramentas', 'equipamentos', 'obra'], ARRAY['tools', 'equipment', 'construction'], ARRAY['herramientas', 'equipos', 'construcción']),
('mão de obra', 'labor', 'mano de obra', '#92400e', 'Users', ARRAY['mão de obra', 'trabalhadores', 'serviços'], ARRAY['labor', 'workers', 'services'], ARRAY['mano de obra', 'trabajadores', 'servicios']),
('decoração', 'decoration', 'decoración', '#a855f7', 'Palette', ARRAY['decoração', 'ornamentos', 'casa'], ARRAY['decoration', 'ornaments', 'home'], ARRAY['decoración', 'ornamentos', 'casa']),
('jardinagem', 'gardening', 'jardinería', '#22c55e', 'Flower', ARRAY['jardinagem', 'plantas', 'jardim'], ARRAY['gardening', 'plants', 'garden'], ARRAY['jardinería', 'plantas', 'jardín']),
('elétrica', 'electrical', 'eléctrica', '#eab308', 'Zap', ARRAY['elétrica', 'instalação', 'eletricista'], ARRAY['electrical', 'installation', 'electrician'], ARRAY['eléctrica', 'instalación', 'electricista']),
('hidráulica', 'plumbing', 'fontanería', '#0ea5e9', 'Droplets', ARRAY['hidráulica', 'encanamento', 'encanador'], ARRAY['plumbing', 'pipes', 'plumber'], ARRAY['fontanería', 'tuberías', 'fontanero']),

-- Tags para Receita Extraordinária
('herança', 'inheritance', 'herencia', '#10b981', 'Gift', ARRAY['herança', 'legado', 'família'], ARRAY['inheritance', 'legacy', 'family'], ARRAY['herencia', 'legado', 'familia']),
('doações recebidas', 'donations received', 'donaciones recibidas', '#059669', 'Heart', ARRAY['doações', 'recebidas', 'ajuda'], ARRAY['donations', 'received', 'help'], ARRAY['donaciones', 'recibidas', 'ayuda']),
('loteria', 'lottery', 'lotería', '#f59e0b', 'Trophy', ARRAY['loteria', 'prêmio', 'sorte'], ARRAY['lottery', 'prize', 'luck'], ARRAY['lotería', 'premio', 'suerte']),
('indenizações', 'compensations', 'indemnizaciones', '#7c3aed', 'Scale', ARRAY['indenizações', 'compensação', 'seguro'], ARRAY['compensations', 'settlement', 'insurance'], ARRAY['indemnizaciones', 'compensación', 'seguro']),
('restituição de impostos', 'tax refund', 'devolución de impuestos', '#0369a1', 'RefreshCw', ARRAY['restituição', 'imposto', 'devolução'], ARRAY['tax refund', 'refund', 'return'], ARRAY['devolución', 'impuestos', 'reembolso']);

-- Agora criar as associações entre as categorias e tags
-- Primeiro, buscar as categorias existentes e associar com as novas tags