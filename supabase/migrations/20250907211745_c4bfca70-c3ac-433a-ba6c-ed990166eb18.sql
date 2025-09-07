-- Create new "Veículos & Financiamentos" category
INSERT INTO public.default_categories (
  name_pt, name_en, name_es, 
  color, icon, category_type,
  description_pt, description_en, description_es
) VALUES (
  'Veículos & Financiamentos', 
  'Vehicles & Financing', 
  'Vehículos y Financiación',
  '#DC2626', 
  'car', 
  'expense',
  'Gastos relacionados a veículos próprios e financiamentos',
  'Expenses related to personal vehicles and financing',
  'Gastos relacionados con vehículos propios y financiación'
);

-- Get the ID of the new category
DO $$
DECLARE
  vehicles_category_id UUID;
  transport_category_id UUID;
  
  -- Tag IDs for new vehicle tags
  prestacao_veiculo_id UUID := gen_random_uuid();
  seguro_veiculo_id UUID := gen_random_uuid();
  manutencao_id UUID := gen_random_uuid();
  ipva_id UUID := gen_random_uuid();
  licenciamento_id UUID := gen_random_uuid();
  combustivel_id UUID := gen_random_uuid();
  
  -- Tag IDs for transport tags
  uber_id UUID := gen_random_uuid();
  onibus_id UUID := gen_random_uuid();
  metro_id UUID := gen_random_uuid();
  estacionamento_id UUID := gen_random_uuid();
  taxi_id UUID := gen_random_uuid();
  pedagio_id UUID := gen_random_uuid();
  
BEGIN
  -- Get category IDs
  SELECT id INTO vehicles_category_id 
  FROM public.default_categories 
  WHERE name_pt = 'Veículos & Financiamentos';
  
  SELECT id INTO transport_category_id 
  FROM public.default_categories 
  WHERE name_pt = 'Transporte';

  -- Create tags for "Veículos & Financiamentos"
  INSERT INTO public.category_tags (id, name_pt, name_en, name_es, color, icon) VALUES
  (prestacao_veiculo_id, 'prestação veículo', 'vehicle installment', 'cuota vehículo', '#DC2626', 'credit-card'),
  (seguro_veiculo_id, 'seguro veículo', 'vehicle insurance', 'seguro vehículo', '#DC2626', 'shield'),
  (manutencao_id, 'manutenção', 'maintenance', 'mantenimiento', '#DC2626', 'wrench'),
  (ipva_id, 'IPVA', 'vehicle tax', 'impuesto vehicular', '#DC2626', 'receipt'),
  (licenciamento_id, 'licenciamento', 'vehicle licensing', 'licenciamiento vehicular', '#DC2626', 'file-text'),
  (combustivel_id, 'combustível', 'fuel', 'combustible', '#DC2626', 'fuel');

  -- Create tag relations for "Veículos & Financiamentos"
  INSERT INTO public.category_tag_relations (category_id, tag_id) VALUES
  (vehicles_category_id, prestacao_veiculo_id),
  (vehicles_category_id, seguro_veiculo_id),
  (vehicles_category_id, manutencao_id),
  (vehicles_category_id, ipva_id),
  (vehicles_category_id, licenciamento_id),
  (vehicles_category_id, combustivel_id);

  -- Create tags for reorganized "Transporte"
  INSERT INTO public.category_tags (id, name_pt, name_en, name_es, color, icon) VALUES
  (uber_id, 'uber/99', 'rideshare', 'transporte compartido', '#10B981', 'car'),
  (onibus_id, 'ônibus', 'bus', 'autobús', '#10B981', 'bus'),
  (metro_id, 'metrô', 'subway', 'metro', '#10B981', 'train'),
  (estacionamento_id, 'estacionamento', 'parking', 'estacionamiento', '#10B981', 'parking-circle'),
  (taxi_id, 'táxi', 'taxi', 'taxi', '#10B981', 'car'),
  (pedagio_id, 'pedágio', 'toll', 'peaje', '#10B981', 'coin');

  -- Remove existing relations for Transporte to clean up
  DELETE FROM public.category_tag_relations 
  WHERE category_id = transport_category_id;

  -- Create new tag relations for "Transporte"
  INSERT INTO public.category_tag_relations (category_id, tag_id) VALUES
  (transport_category_id, uber_id),
  (transport_category_id, onibus_id),
  (transport_category_id, metro_id),
  (transport_category_id, estacionamento_id),
  (transport_category_id, taxi_id),
  (transport_category_id, pedagio_id);

END $$;