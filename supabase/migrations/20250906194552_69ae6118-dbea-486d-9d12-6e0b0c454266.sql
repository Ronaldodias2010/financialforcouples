-- Add the missing default_category_id column and related functionality
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS default_category_id uuid;

ALTER TABLE public.categories
  ADD CONSTRAINT IF NOT EXISTS fk_categories_default_category
    FOREIGN KEY (default_category_id) REFERENCES public.default_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_categories_default_category ON public.categories(default_category_id);

-- Update existing categories to map to default categories
DO $$
DECLARE
  v_food uuid;
  v_health uuid;
  v_transport uuid;
  v_entertainment uuid;
  v_housing uuid;
  v_education uuid;
  v_shopping uuid;
  v_others uuid;
BEGIN
  -- Get default category IDs
  SELECT id INTO v_food FROM public.default_categories WHERE name_pt = 'Alimentação' LIMIT 1;
  SELECT id INTO v_health FROM public.default_categories WHERE name_pt = 'Saúde' LIMIT 1;
  SELECT id INTO v_transport FROM public.default_categories WHERE name_pt = 'Transporte' LIMIT 1;
  SELECT id INTO v_entertainment FROM public.default_categories WHERE name_pt = 'Lazer & Entretenimento' LIMIT 1;
  SELECT id INTO v_housing FROM public.default_categories WHERE name_pt = 'Moradia' LIMIT 1;
  SELECT id INTO v_education FROM public.default_categories WHERE name_pt = 'Educação' LIMIT 1;
  SELECT id INTO v_shopping FROM public.default_categories WHERE name_pt = 'Compras Pessoais' LIMIT 1;
  SELECT id INTO v_others FROM public.default_categories WHERE name_pt = 'Outros' LIMIT 1;

  -- Map existing categories to default categories
  UPDATE public.categories 
  SET default_category_id = v_food
  WHERE category_type = 'expense' 
    AND lower(public.normalize_text_simple(name)) IN (
      'alimentação','alimentacao','alimentación','comida','food',
      'restaurante','restaurant','supermercado','groceries','mercado',
      'padaria','bakery','lanchonete','snack bar','delivery','feira'
    );

  UPDATE public.categories 
  SET default_category_id = v_health
  WHERE category_type = 'expense'
    AND lower(public.normalize_text_simple(name)) IN (
      'saúde','saude','salud','health','academia','gym','farmacia','pharmacy',
      'medico','doctor','hospital','consulta'
    );

  UPDATE public.categories 
  SET default_category_id = v_transport
  WHERE category_type = 'expense'
    AND lower(public.normalize_text_simple(name)) IN (
      'transporte','transport','combustível','combustivel','fuel','gasolina',
      'uber','taxi','onibus','metro','carro','car'
    );

  UPDATE public.categories 
  SET default_category_id = v_entertainment
  WHERE category_type = 'expense'
    AND lower(public.normalize_text_simple(name)) IN (
      'entretenimento','entertainment','lazer','cinema','netflix','spotify',
      'show','teatro','diversão','diversao','festa','bar'
    );

  UPDATE public.categories 
  SET default_category_id = v_housing
  WHERE category_type = 'expense'
    AND lower(public.normalize_text_simple(name)) IN (
      'moradia','housing','aluguel','rent','condominio','agua','luz','gas',
      'internet','telefone','celular'
    );

  UPDATE public.categories 
  SET default_category_id = v_education
  WHERE category_type = 'expense'
    AND lower(public.normalize_text_simple(name)) IN (
      'educação','educacao','education','curso','faculdade','escola','livros'
    );

  UPDATE public.categories 
  SET default_category_id = v_shopping
  WHERE category_type = 'expense'
    AND lower(public.normalize_text_simple(name)) IN (
      'compras','shopping','roupas','clothes','sapatos','shoes','cosmeticos'
    );

  -- Set remaining unmapped categories to "Outros"
  UPDATE public.categories 
  SET default_category_id = v_others
  WHERE category_type = 'expense' 
    AND default_category_id IS NULL;

END;
$$;