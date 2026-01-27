
-- =====================================================
-- FIX: Remover subcategorias default duplicadas que causam erro no signup
-- =====================================================

-- Remover duplicatas de "diversos" (manter apenas uma)
DELETE FROM public.default_subcategories
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY default_category_id, LOWER(TRIM(name)) ORDER BY created_at) as rn
    FROM public.default_subcategories
  ) duplicates
  WHERE rn > 1
);

-- Verificar se ainda há duplicatas e remover por ID específico se necessário
DELETE FROM public.default_subcategories 
WHERE id = 'dbd3d325-243c-47d9-80da-7cd19bf8eea8'; -- Segunda cópia de "diversos"

DELETE FROM public.default_subcategories 
WHERE id = '97bf94f6-f7de-4de9-90e5-0e9d2b47bd93'; -- Segunda cópia de "não categorizado"

-- Adicionar constraint UNIQUE para evitar duplicatas futuras
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_default_subcategory_per_category'
  ) THEN
    ALTER TABLE public.default_subcategories 
    ADD CONSTRAINT unique_default_subcategory_per_category 
    UNIQUE (default_category_id, name);
  END IF;
END $$;
