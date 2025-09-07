-- Fix security issue by adding search_path to the function
CREATE OR REPLACE FUNCTION public.auto_translate_user_tag()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    "cartao": {"en": "Credit Card", "es": "Tarjeta de Crédito"}
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
$$;