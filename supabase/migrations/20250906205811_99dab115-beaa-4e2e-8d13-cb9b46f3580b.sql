-- Create user_category_tags table for custom user tags
CREATE TABLE IF NOT EXISTS public.user_category_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_id, tag_name)
);

-- Enable RLS on user_category_tags
ALTER TABLE public.user_category_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_category_tags
CREATE POLICY "Users can view their own category tags"
ON public.user_category_tags
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own category tags"
ON public.user_category_tags
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own category tags"
ON public.user_category_tags
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own category tags"
ON public.user_category_tags
FOR DELETE
USING (auth.uid() = user_id);

-- Add couples access for tags
CREATE POLICY "Users can view couple category tags"
ON public.user_category_tags
FOR SELECT
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM user_couples 
    WHERE status = 'active' 
    AND ((user1_id = auth.uid() AND user2_id = user_category_tags.user_id) 
         OR (user2_id = auth.uid() AND user1_id = user_category_tags.user_id))
  )
);

-- Create index for performance
CREATE INDEX idx_user_category_tags_user_category ON public.user_category_tags(user_id, category_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_category_tags_updated_at
BEFORE UPDATE ON public.user_category_tags
FOR EACH ROW
EXECUTE FUNCTION public.update_user_category_tags_updated_at();

-- Insert system tags for the 12 default categories
INSERT INTO public.category_tags (name_pt, name_en, name_es, color, keywords_pt, keywords_en, keywords_es) VALUES
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
('eletrodomésticos', 'appliances', 'electrodomésticos', '#10b981', ARRAY['geladeira', 'fogão', 'máquina'], ARRAY['refrigerator', 'stove', 'washing machine'], ARRAY['refrigerador', 'estufa', 'lavadora']),

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
('treinamentos', 'training', 'entrenamientos', '#06b6d4', ARRAY['treinamento', 'capacitação', 'workshop'], ARRAY['training', 'workshop', 'skills'], ARRAY['entrenamiento', 'capacitación', 'taller']),

-- Lazer & Entretenimento tags
('cinema', 'cinema', 'cine', '#8b5cf6', ARRAY['cinema', 'filme', 'pipoca'], ARRAY['cinema', 'movie', 'popcorn'], ARRAY['cine', 'película', 'palomitas']),
('shows', 'shows', 'espectáculos', '#ec4899', ARRAY['show', 'concerto', 'música'], ARRAY['show', 'concert', 'music'], ARRAY['espectáculo', 'concierto', 'música']),
('streaming', 'streaming', 'streaming', '#f59e0b', ARRAY['netflix', 'spotify', 'amazon'], ARRAY['netflix', 'spotify', 'amazon'], ARRAY['netflix', 'spotify', 'amazon']),
('bar', 'bar', 'bar', '#dc2626', ARRAY['bar', 'bebida', 'cerveja'], ARRAY['bar', 'drink', 'beer'], ARRAY['bar', 'bebida', 'cerveza']),
('viagem', 'travel', 'viaje', '#f97316', ARRAY['viagem', 'hotel', 'passagem'], ARRAY['travel', 'hotel', 'ticket'], ARRAY['viaje', 'hotel', 'boleto']),
('festas', 'parties', 'fiestas', '#eab308', ARRAY['festa', 'aniversário', 'celebração'], ARRAY['party', 'birthday', 'celebration'], ARRAY['fiesta', 'cumpleaños', 'celebración']),
('hobbies', 'hobbies', 'aficiones', '#84cc16', ARRAY['hobby', 'passatempo', 'lazer'], ARRAY['hobby', 'pastime', 'leisure'], ARRAY['afición', 'pasatiempo', 'ocio']),
('esportes', 'sports', 'deportes', '#06b6d4', ARRAY['esporte', 'futebol', 'tênis'], ARRAY['sport', 'football', 'tennis'], ARRAY['deporte', 'fútbol', 'tenis']),

-- Compras Pessoais tags
('roupas', 'clothes', 'ropa', '#8b5cf6', ARRAY['roupa', 'camisa', 'calça'], ARRAY['clothes', 'shirt', 'pants'], ARRAY['ropa', 'camisa', 'pantalón']),
('calçados', 'shoes', 'calzado', '#ec4899', ARRAY['sapato', 'tênis', 'sandália'], ARRAY['shoes', 'sneakers', 'sandals'], ARRAY['zapatos', 'tenis', 'sandalias']),
('acessórios', 'accessories', 'accesorios', '#f59e0b', ARRAY['acessório', 'bolsa', 'relógio'], ARRAY['accessory', 'bag', 'watch'], ARRAY['accesorio', 'bolsa', 'reloj']),
('eletrônicos', 'electronics', 'electrónicos', '#dc2626', ARRAY['celular', 'notebook', 'fone'], ARRAY['phone', 'laptop', 'headphones'], ARRAY['teléfono', 'laptop', 'auriculares']),
('cosméticos', 'cosmetics', 'cosméticos', '#f97316', ARRAY['maquiagem', 'creme', 'shampoo'], ARRAY['makeup', 'cream', 'shampoo'], ARRAY['maquillaje', 'crema', 'champú']),
('perfumaria', 'perfumery', 'perfumería', '#eab308', ARRAY['perfume', 'colônia', 'fragrância'], ARRAY['perfume', 'cologne', 'fragrance'], ARRAY['perfume', 'colonia', 'fragancia']),

-- Família & Filhos tags
('escola', 'school', 'escuela', '#84cc16', ARRAY['escola', 'colégio', 'ensino'], ARRAY['school', 'education', 'tuition'], ARRAY['escuela', 'colegio', 'enseñanza']),
('creche', 'daycare', 'guardería', '#06b6d4', ARRAY['creche', 'berçário', 'cuidado'], ARRAY['daycare', 'nursery', 'childcare'], ARRAY['guardería', 'cuidado infantil', 'niños']),
('brinquedos', 'toys', 'juguetes', '#8b5cf6', ARRAY['brinquedo', 'boneca', 'carrinho'], ARRAY['toy', 'doll', 'car'], ARRAY['juguete', 'muñeca', 'carro']),
('roupas infantis', 'kids clothes', 'ropa infantil', '#ec4899', ARRAY['roupa criança', 'infantil', 'bebê'], ARRAY['kids clothes', 'children', 'baby'], ARRAY['ropa niños', 'infantil', 'bebé']),
('mesada', 'allowance', 'mesada', '#f59e0b', ARRAY['mesada', 'dinheiro', 'criança'], ARRAY['allowance', 'pocket money', 'kids'], ARRAY['mesada', 'dinero', 'niños']),
('cuidados', 'childcare', 'cuidados', '#dc2626', ARRAY['babá', 'cuidado', 'criança'], ARRAY['babysitter', 'childcare', 'nanny'], ARRAY['niñera', 'cuidado', 'niños']),

-- Finanças & Serviços tags
('taxas bancárias', 'bank fees', 'comisiones bancarias', '#f97316', ARRAY['taxa', 'banco', 'anuidade'], ARRAY['fee', 'bank', 'annual'], ARRAY['comisión', 'banco', 'anual']),
('seguros', 'insurance', 'seguros', '#eab308', ARRAY['seguro', 'vida', 'auto'], ARRAY['insurance', 'life', 'auto'], ARRAY['seguro', 'vida', 'auto']),
('investimentos', 'investments', 'inversiones', '#84cc16', ARRAY['investimento', 'aplicação', 'poupança'], ARRAY['investment', 'savings', 'fund'], ARRAY['inversión', 'ahorro', 'fondo']),
('impostos', 'taxes', 'impuestos', '#06b6d4', ARRAY['imposto', 'ir', 'ipva'], ARRAY['tax', 'income tax', 'property'], ARRAY['impuesto', 'renta', 'propiedad']),
('mensalidades', 'subscriptions', 'suscripciones', '#8b5cf6', ARRAY['mensalidade', 'assinatura', 'recorrente'], ARRAY['subscription', 'monthly', 'recurring'], ARRAY['suscripción', 'mensual', 'recurrente']),
('assinatura de serviços', 'service subscriptions', 'servicios de suscripción', '#ec4899', ARRAY['assinatura', 'serviço', 'plano'], ARRAY['subscription', 'service', 'plan'], ARRAY['suscripción', 'servicio', 'plan']),

-- Trabalho & Negócios tags
('coworking', 'coworking', 'coworking', '#f59e0b', ARRAY['coworking', 'escritório', 'trabalho'], ARRAY['coworking', 'office', 'workspace'], ARRAY['coworking', 'oficina', 'trabajo']),
('software', 'software', 'software', '#dc2626', ARRAY['software', 'programa', 'licença'], ARRAY['software', 'program', 'license'], ARRAY['software', 'programa', 'licencia']),
('equipamentos', 'equipment', 'equipos', '#f97316', ARRAY['equipamento', 'computador', 'impressora'], ARRAY['equipment', 'computer', 'printer'], ARRAY['equipo', 'computadora', 'impresora']),
('viagens de trabalho', 'business travel', 'viajes de trabajo', '#eab308', ARRAY['viagem', 'trabalho', 'hotel'], ARRAY['travel', 'business', 'hotel'], ARRAY['viaje', 'trabajo', 'hotel']),
('marketing', 'marketing', 'marketing', '#84cc16', ARRAY['marketing', 'publicidade', 'anúncio'], ARRAY['marketing', 'advertising', 'ad'], ARRAY['marketing', 'publicidad', 'anuncio']),
('impostos PJ', 'business taxes', 'impuestos empresariales', '#06b6d4', ARRAY['imposto', 'pj', 'empresa'], ARRAY['tax', 'business', 'corporate'], ARRAY['impuesto', 'empresa', 'corporativo']),

-- Doações & Presentes tags
('presentes', 'gifts', 'regalos', '#8b5cf6', ARRAY['presente', 'gift', 'lembrança'], ARRAY['gift', 'present', 'souvenir'], ARRAY['regalo', 'presente', 'recuerdo']),
('doações', 'donations', 'donaciones', '#ec4899', ARRAY['doação', 'caridade', 'ong'], ARRAY['donation', 'charity', 'ngo'], ARRAY['donación', 'caridad', 'ong']),
('caridade', 'charity', 'caridad', '#f59e0b', ARRAY['caridade', 'solidariedade', 'ajuda'], ARRAY['charity', 'solidarity', 'help'], ARRAY['caridad', 'solidaridad', 'ayuda']),
('festas de aniversário', 'birthday parties', 'fiestas de cumpleaños', '#dc2626', ARRAY['aniversário', 'festa', 'bolo'], ARRAY['birthday', 'party', 'cake'], ARRAY['cumpleaños', 'fiesta', 'pastel']),
('casamentos', 'weddings', 'bodas', '#f97316', ARRAY['casamento', 'noiva', 'cerimônia'], ARRAY['wedding', 'bride', 'ceremony'], ARRAY['boda', 'novia', 'ceremonia']),

-- Outros tags
('emergências', 'emergencies', 'emergencias', '#eab308', ARRAY['emergência', 'urgente', 'imprevisto'], ARRAY['emergency', 'urgent', 'unexpected'], ARRAY['emergencia', 'urgente', 'imprevisto']),
('imprevistos', 'unexpected', 'imprevistos', '#84cc16', ARRAY['imprevisto', 'surpresa', 'inesperado'], ARRAY['unexpected', 'surprise', 'unforeseen'], ARRAY['imprevisto', 'sorpresa', 'inesperado']),
('não categorizados', 'uncategorized', 'sin categorizar', '#06b6d4', ARRAY['outros', 'diverso', 'geral'], ARRAY['other', 'misc', 'general'], ARRAY['otros', 'diverso', 'general']);

-- Link tags to categories
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
      WHEN dc.name_pt = 'Lazer & Entretenimento' THEN ARRAY['cinema', 'shows', 'streaming', 'bar', 'viagem', 'festas', 'hobbies', 'esportes']
      WHEN dc.name_pt = 'Compras Pessoais' THEN ARRAY['roupas', 'calçados', 'acessórios', 'eletrônicos', 'cosméticos', 'perfumaria']
      WHEN dc.name_pt = 'Família & Filhos' THEN ARRAY['escola', 'creche', 'brinquedos', 'roupas infantis', 'mesada', 'cuidados']
      WHEN dc.name_pt = 'Finanças & Serviços' THEN ARRAY['taxas bancárias', 'seguros', 'investimentos', 'impostos', 'mensalidades', 'assinatura de serviços']
      WHEN dc.name_pt = 'Trabalho & Negócios' THEN ARRAY['coworking', 'software', 'equipamentos', 'viagens de trabalho', 'marketing', 'impostos PJ']
      WHEN dc.name_pt = 'Doações & Presentes' THEN ARRAY['presentes', 'doações', 'caridade', 'festas de aniversário', 'casamentos']
      WHEN dc.name_pt = 'Outros' THEN ARRAY['emergências', 'imprevistos', 'não categorizados']
      ELSE ARRAY[]::text[]
    END as tag_names
  FROM public.default_categories dc
  WHERE dc.category_type = 'expense'
)
INSERT INTO public.category_tag_relations (category_id, tag_id, is_active)
SELECT 
  cm.default_category_id,
  ct.id,
  true
FROM category_mappings cm
CROSS JOIN LATERAL unnest(cm.tag_names) as tag_name
JOIN public.category_tags ct ON ct.name_pt = tag_name;