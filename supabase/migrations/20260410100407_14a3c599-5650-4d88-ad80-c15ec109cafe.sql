-- Add missing keywords to the "manutenção" tag (linked to Veículos & Financiamentos)
UPDATE category_tags 
SET keywords_pt = ARRAY['manutenção', 'reparo', 'conserto', 'mecânico', 'mecanico', 'oficina', 'borracheiro', 'funilaria', 'lanternagem', 'autopeças', 'autopecas', 'lava jato', 'lavagem', 'polimento', 'alinhamento', 'balanceamento', 'troca de oleo', 'troca de óleo', 'revisão', 'revisao', 'pneu', 'freio', 'embreagem', 'suspensão', 'amortecedor'],
    keywords_en = ARRAY['maintenance', 'repair', 'mechanic', 'garage', 'workshop', 'tire', 'oil change', 'service', 'parts', 'car wash', 'detailing', 'alignment', 'brake', 'suspension'],
    keywords_es = ARRAY['mantenimiento', 'reparación', 'mecánico', 'taller', 'llanta', 'cambio de aceite', 'revisión', 'repuestos', 'lavado', 'freno', 'suspensión'],
    updated_at = now()
WHERE id = 'd4d76674-ab06-4095-9a96-ae88f87d0e7a';

-- Add keywords to combustível tag if missing
UPDATE category_tags 
SET keywords_en = ARRAY['fuel', 'gasoline', 'gas station', 'petrol', 'diesel', 'fill up', 'tank'],
    keywords_es = ARRAY['combustible', 'gasolina', 'gasolinera', 'diésel', 'tanque', 'llenar'],
    updated_at = now()
WHERE id = '310c61db-9c98-4402-bd3e-6699af249841' AND (keywords_en IS NULL OR array_length(keywords_en, 1) IS NULL);

-- Add keywords to other Veículos tags that are missing keywords
UPDATE category_tags 
SET keywords_pt = ARRAY['prestação', 'financiamento', 'parcela carro', 'parcela veículo', 'consórcio'],
    keywords_en = ARRAY['car payment', 'auto loan', 'vehicle financing', 'installment'],
    keywords_es = ARRAY['cuota', 'financiamiento', 'préstamo auto'],
    updated_at = now()
WHERE id = '1dcfa476-f11e-40e9-a279-9e84562c8cf2' AND keywords_pt IS NULL;

UPDATE category_tags 
SET keywords_pt = ARRAY['seguro auto', 'seguro carro', 'seguro veículo', 'apólice', 'sinistro', 'franquia'],
    keywords_en = ARRAY['car insurance', 'auto insurance', 'vehicle insurance', 'policy', 'premium'],
    keywords_es = ARRAY['seguro auto', 'seguro vehículo', 'póliza', 'prima'],
    updated_at = now()
WHERE id = '8b7e86e2-5bca-4fc8-9e48-1daca0b35730' AND keywords_pt IS NULL;

UPDATE category_tags 
SET keywords_pt = ARRAY['ipva', 'imposto veículo', 'imposto carro'],
    keywords_en = ARRAY['vehicle tax', 'car tax', 'road tax'],
    keywords_es = ARRAY['impuesto vehicular', 'tenencia'],
    updated_at = now()
WHERE id = '4e6111e7-377b-429d-9caf-dffccb0f7403' AND keywords_pt IS NULL;

UPDATE category_tags 
SET keywords_pt = ARRAY['licenciamento', 'crlv', 'documento veículo', 'detran', 'emplacamento'],
    keywords_en = ARRAY['vehicle registration', 'license', 'registration'],
    keywords_es = ARRAY['licencia', 'registro vehicular', 'matriculación'],
    updated_at = now()
WHERE id = 'e470939a-6cec-49d7-b3eb-afda795f6e14' AND keywords_pt IS NULL;