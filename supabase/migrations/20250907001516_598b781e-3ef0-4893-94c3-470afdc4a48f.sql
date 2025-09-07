-- Add multilingual support to user_category_tags
ALTER TABLE public.user_category_tags 
ADD COLUMN tag_name_en TEXT,
ADD COLUMN tag_name_es TEXT;

-- Update existing tags to have English and Spanish translations
UPDATE public.user_category_tags 
SET 
  tag_name_en = CASE 
    WHEN LOWER(tag_name) = 'supermercado' THEN 'Supermarket'
    WHEN LOWER(tag_name) = 'restaurante' THEN 'Restaurant'
    WHEN LOWER(tag_name) = 'delivery' THEN 'Delivery'
    WHEN LOWER(tag_name) = 'lanchonete' THEN 'Snack Bar'
    WHEN LOWER(tag_name) = 'escola' THEN 'School'
    WHEN LOWER(tag_name) = 'brinquedos' THEN 'Toys'
    WHEN LOWER(tag_name) = 'academia' THEN 'Gym'
    WHEN LOWER(tag_name) = 'farmacia' THEN 'Pharmacy'
    WHEN LOWER(tag_name) = 'livraria' THEN 'Bookstore'
    WHEN LOWER(tag_name) = 'posto' THEN 'Gas Station'
    WHEN LOWER(tag_name) = 'cinema' THEN 'Cinema'
    WHEN LOWER(tag_name) = 'teatro' THEN 'Theater'
    WHEN LOWER(tag_name) = 'shopping' THEN 'Mall'
    WHEN LOWER(tag_name) = 'padaria' THEN 'Bakery'
    WHEN LOWER(tag_name) = 'mercado' THEN 'Market'
    WHEN LOWER(tag_name) = 'streaming' THEN 'Streaming'
    WHEN LOWER(tag_name) = 'assinatura' THEN 'Subscription'
    WHEN LOWER(tag_name) = 'telefone' THEN 'Phone'
    WHEN LOWER(tag_name) = 'internet' THEN 'Internet'
    WHEN LOWER(tag_name) = 'agua' THEN 'Water'
    WHEN LOWER(tag_name) = 'luz' THEN 'Electricity'
    WHEN LOWER(tag_name) = 'gas' THEN 'Gas'
    WHEN LOWER(tag_name) = 'condominio' THEN 'Condominium'
    WHEN LOWER(tag_name) = 'iptu' THEN 'Property Tax'
    WHEN LOWER(tag_name) = 'ipva' THEN 'Vehicle Tax'
    WHEN LOWER(tag_name) = 'seguro' THEN 'Insurance'
    WHEN LOWER(tag_name) = 'financiamento' THEN 'Financing'
    WHEN LOWER(tag_name) = 'emprestimo' THEN 'Loan'
    WHEN LOWER(tag_name) = 'cartao' THEN 'Credit Card'
    ELSE tag_name
  END,
  tag_name_es = CASE 
    WHEN LOWER(tag_name) = 'supermercado' THEN 'Supermercado'
    WHEN LOWER(tag_name) = 'restaurante' THEN 'Restaurante'
    WHEN LOWER(tag_name) = 'delivery' THEN 'Delivery'
    WHEN LOWER(tag_name) = 'lanchonete' THEN 'Snack Bar'
    WHEN LOWER(tag_name) = 'escola' THEN 'Escuela'
    WHEN LOWER(tag_name) = 'brinquedos' THEN 'Juguetes'
    WHEN LOWER(tag_name) = 'academia' THEN 'Gimnasio'
    WHEN LOWER(tag_name) = 'farmacia' THEN 'Farmacia'
    WHEN LOWER(tag_name) = 'livraria' THEN 'Librería'
    WHEN LOWER(tag_name) = 'posto' THEN 'Gasolinera'
    WHEN LOWER(tag_name) = 'cinema' THEN 'Cine'
    WHEN LOWER(tag_name) = 'teatro' THEN 'Teatro'
    WHEN LOWER(tag_name) = 'shopping' THEN 'Centro Comercial'
    WHEN LOWER(tag_name) = 'padaria' THEN 'Panadería'
    WHEN LOWER(tag_name) = 'mercado' THEN 'Mercado'
    WHEN LOWER(tag_name) = 'streaming' THEN 'Streaming'
    WHEN LOWER(tag_name) = 'assinatura' THEN 'Suscripción'
    WHEN LOWER(tag_name) = 'telefone' THEN 'Teléfono'
    WHEN LOWER(tag_name) = 'internet' THEN 'Internet'
    WHEN LOWER(tag_name) = 'agua' THEN 'Agua'
    WHEN LOWER(tag_name) = 'luz' THEN 'Electricidad'
    WHEN LOWER(tag_name) = 'gas' THEN 'Gas'
    WHEN LOWER(tag_name) = 'condominio' THEN 'Condominio'
    WHEN LOWER(tag_name) = 'iptu' THEN 'Impuesto Inmobiliario'
    WHEN LOWER(tag_name) = 'ipva' THEN 'Impuesto Vehicular'
    WHEN LOWER(tag_name) = 'seguro' THEN 'Seguro'
    WHEN LOWER(tag_name) = 'financiamento' THEN 'Financiamiento'
    WHEN LOWER(tag_name) = 'emprestimo' THEN 'Préstamo'
    WHEN LOWER(tag_name) = 'cartao' THEN 'Tarjeta de Crédito'
    ELSE tag_name
  END;

-- Create function to auto-translate new tags
CREATE OR REPLACE FUNCTION public.auto_translate_user_tag()
RETURNS TRIGGER AS $$
DECLARE
  tag_translations JSONB := '{
    "supermercado": {"en": "Supermarket", "es": "Supermercado"},
    "restaurante": {"en": "Restaurant", "es": "Restaurante"},
    "delivery": {"en": "Delivery", "es": "Delivery"},
    "lanchonete": {"en": "Snack Bar", "es": "Snack Bar"},
    "escola": {"en": "School", "es": "Escuela"},
    "brinquedos": {"en": "Toys", "es": "Juguetes"},
    "academia": {"en": "Gym", "es": "Gimnasio"},
    "farmacia": {"en": "Pharmacy", "es": "Farmacia"},
    "livraria": {"en": "Bookstore", "es": "Librería"},
    "posto": {"en": "Gas Station", "es": "Gasolinera"},
    "cinema": {"en": "Cinema", "es": "Cine"},
    "teatro": {"en": "Theater", "es": "Teatro"},
    "shopping": {"en": "Mall", "es": "Centro Comercial"},
    "padaria": {"en": "Bakery", "es": "Panadería"},
    "mercado": {"en": "Market", "es": "Mercado"},
    "streaming": {"en": "Streaming", "es": "Streaming"},
    "assinatura": {"en": "Subscription", "es": "Suscripción"},
    "telefone": {"en": "Phone", "es": "Teléfono"},
    "internet": {"en": "Internet", "es": "Internet"},
    "agua": {"en": "Water", "es": "Agua"},
    "luz": {"en": "Electricity", "es": "Electricidad"},
    "gas": {"en": "Gas", "es": "Gas"},
    "condominio": {"en": "Condominium", "es": "Condominio"},
    "iptu": {"en": "Property Tax", "es": "Impuesto Inmobiliario"},
    "ipva": {"en": "Vehicle Tax", "es": "Impuesto Vehicular"},
    "seguro": {"en": "Insurance", "es": "Seguro"},
    "financiamento": {"en": "Financing", "es": "Financiamiento"},
    "emprestimo": {"en": "Loan", "es": "Préstamo"},
    "cartao": {"en": "Credit Card", "es": "Tarjeta de Crédito"},
    "banco": {"en": "Bank", "es": "Banco"},
    "pix": {"en": "PIX Transfer", "es": "Transferencia PIX"},
    "ted": {"en": "TED Transfer", "es": "Transferencia TED"},
    "doc": {"en": "DOC Transfer", "es": "Transferencia DOC"},
    "uber": {"en": "Uber", "es": "Uber"},
    "taxi": {"en": "Taxi", "es": "Taxi"},
    "onibus": {"en": "Bus", "es": "Autobús"},
    "metro": {"en": "Subway", "es": "Metro"},
    "aplicativo": {"en": "App", "es": "Aplicación"},
    "saude": {"en": "Health", "es": "Salud"},
    "medico": {"en": "Doctor", "es": "Médico"},
    "dentista": {"en": "Dentist", "es": "Dentista"},
    "hospital": {"en": "Hospital", "es": "Hospital"},
    "laboratorio": {"en": "Laboratory", "es": "Laboratorio"},
    "remedio": {"en": "Medicine", "es": "Medicina"},
    "curso": {"en": "Course", "es": "Curso"},
    "livro": {"en": "Book", "es": "Libro"},
    "material": {"en": "Material", "es": "Material"},
    "uniforme": {"en": "Uniform", "es": "Uniforme"},
    "festa": {"en": "Party", "es": "Fiesta"},
    "viagem": {"en": "Travel", "es": "Viaje"},
    "hotel": {"en": "Hotel", "es": "Hotel"},
    "passagem": {"en": "Ticket", "es": "Boleto"},
    "combustivel": {"en": "Fuel", "es": "Combustible"},
    "estacionamento": {"en": "Parking", "es": "Estacionamiento"},
    "pedagio": {"en": "Toll", "es": "Peaje"},
    "manutencao": {"en": "Maintenance", "es": "Mantenimiento"},
    "roupa": {"en": "Clothing", "es": "Ropa"},
    "sapato": {"en": "Shoes", "es": "Zapatos"},
    "acessorio": {"en": "Accessory", "es": "Accesorio"},
    "presente": {"en": "Gift", "es": "Regalo"},
    "decoracao": {"en": "Decoration", "es": "Decoración"},
    "movel": {"en": "Furniture", "es": "Mueble"},
    "eletronico": {"en": "Electronics", "es": "Electrónicos"},
    "celular": {"en": "Phone", "es": "Celular"},
    "computador": {"en": "Computer", "es": "Computadora"},
    "limpeza": {"en": "Cleaning", "es": "Limpieza"},
    "jardinagem": {"en": "Gardening", "es": "Jardinería"},
    "pet": {"en": "Pet", "es": "Mascota"},
    "veterinario": {"en": "Veterinarian", "es": "Veterinario"},
    "racao": {"en": "Pet Food", "es": "Comida para Mascotas"},
    "brinquedo": {"en": "Toy", "es": "Juguete"},
    "jogo": {"en": "Game", "es": "Juego"},
    "esporte": {"en": "Sports", "es": "Deportes"},
    "mensalidade": {"en": "Monthly Fee", "es": "Mensualidad"},
    "taxa": {"en": "Fee", "es": "Tasa"},
    "multa": {"en": "Fine", "es": "Multa"},
    "doacao": {"en": "Donation", "es": "Donación"},
    "igreja": {"en": "Church", "es": "Iglesia"},
    "caridade": {"en": "Charity", "es": "Caridad"}
  }'::JSONB;
  
  normalized_name TEXT;
  translation JSONB;
BEGIN
  -- Normalize the tag name for lookup
  normalized_name := LOWER(TRIM(NEW.tag_name));
  
  -- Get translation if available
  translation := tag_translations->normalized_name;
  
  -- Set translations if found
  IF translation IS NOT NULL THEN
    NEW.tag_name_en := translation->>'en';
    NEW.tag_name_es := translation->>'es';
  ELSE
    -- Default to original name if no translation
    NEW.tag_name_en := NEW.tag_name;
    NEW.tag_name_es := NEW.tag_name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto translation
CREATE TRIGGER auto_translate_user_tag_trigger
  BEFORE INSERT OR UPDATE ON public.user_category_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_translate_user_tag();