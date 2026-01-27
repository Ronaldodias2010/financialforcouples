-- =====================================================
-- FIX: Permitir subcategorias com mesmo nome em categorias diferentes
-- durante a criação inicial do usuário (handle_new_user)
-- =====================================================

-- Dropar o trigger existente que impede duplicação entre categorias
DROP TRIGGER IF EXISTS tr_validate_subcategory_unique_across_categories ON public.subcategories;

-- Dropar a função antiga
DROP FUNCTION IF EXISTS public.validate_subcategory_unique_across_categories();

-- Criar nova função que só valida duplicatas DENTRO da mesma categoria
-- (permite "manutenção" em Moradia e também em Veículos)
CREATE OR REPLACE FUNCTION public.validate_subcategory_unique_in_category()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_duplicate_exists BOOLEAN;
BEGIN
  -- Verificar se já existe subcategoria com o mesmo nome NA MESMA CATEGORIA
  SELECT EXISTS (
    SELECT 1 FROM public.subcategories s
    WHERE s.deleted_at IS NULL
      AND s.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND s.category_id = NEW.category_id  -- Mesma categoria
      AND s.user_id = NEW.user_id          -- Mesmo usuário
      AND LOWER(TRIM(s.name)) = LOWER(TRIM(NEW.name))
  ) INTO v_duplicate_exists;
  
  IF v_duplicate_exists THEN
    RAISE EXCEPTION 'SUBCATEGORY_DUPLICATE:Subcategoria "%" já existe nesta categoria', NEW.name;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar novo trigger que valida apenas dentro da mesma categoria
CREATE TRIGGER tr_validate_subcategory_unique_in_category
BEFORE INSERT OR UPDATE ON public.subcategories
FOR EACH ROW
EXECUTE FUNCTION public.validate_subcategory_unique_in_category();