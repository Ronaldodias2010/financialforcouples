-- Add the missing default_category_id column
ALTER TABLE public.categories
  ADD COLUMN default_category_id uuid;

-- Add foreign key constraint
ALTER TABLE public.categories
  ADD CONSTRAINT fk_categories_default_category
    FOREIGN KEY (default_category_id) REFERENCES public.default_categories(id) ON DELETE SET NULL;

-- Create index
CREATE INDEX idx_categories_default_category ON public.categories(default_category_id);

-- Update existing categories to map to default categories
UPDATE public.categories 
SET default_category_id = (
  SELECT id FROM public.default_categories WHERE name_pt = 'Alimentação' LIMIT 1
)
WHERE category_type = 'expense' 
  AND lower(public.normalize_text_simple(name)) IN (
    'alimentação','alimentacao','alimentación','comida','food',
    'restaurante','restaurant','supermercado','groceries','mercado',
    'padaria','bakery','lanchonete','snack bar','delivery','feira'
  );

UPDATE public.categories 
SET default_category_id = (
  SELECT id FROM public.default_categories WHERE name_pt = 'Saúde' LIMIT 1
)
WHERE category_type = 'expense'
  AND lower(public.normalize_text_simple(name)) IN (
    'saúde','saude','salud','health','academia','gym','farmacia','pharmacy',
    'medico','doctor','hospital','consulta'
  );

-- Set remaining unmapped categories to "Outros"
UPDATE public.categories 
SET default_category_id = (
  SELECT id FROM public.default_categories WHERE name_pt = 'Outros' LIMIT 1
)
WHERE category_type = 'expense' 
  AND default_category_id IS NULL;