-- ============================================
-- PARTE 1: REMOVER TAG "aposentadoria" CONFLITANTE
-- ============================================

-- Remover relações da tag "aposentadoria"
DELETE FROM category_tag_relations 
WHERE tag_id = '339c30ed-5d17-4689-8fbb-ede540a5759d';

-- Remover a tag "aposentadoria" de category_tags
DELETE FROM category_tags 
WHERE id = '339c30ed-5d17-4689-8fbb-ede540a5759d';

-- ============================================
-- PARTE 2: TRIGGER PARA category_tags (tags de sistema)
-- ============================================

CREATE OR REPLACE FUNCTION validate_category_tag_not_category()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conflict_exists BOOLEAN;
BEGIN
  -- Verificar se conflita com alguma default_category
  SELECT EXISTS (
    SELECT 1 FROM public.default_categories 
    WHERE LOWER(TRIM(name_pt)) = LOWER(TRIM(NEW.name_pt))
       OR LOWER(TRIM(name_en)) = LOWER(TRIM(NEW.name_en))
       OR LOWER(TRIM(name_es)) = LOWER(TRIM(NEW.name_es))
  ) INTO v_conflict_exists;
  
  IF v_conflict_exists THEN
    RAISE EXCEPTION 'TAG_IS_CATEGORY:O nome "%" já existe como categoria', NEW.name_pt;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_validate_category_tag_not_category ON category_tags;
CREATE TRIGGER tr_validate_category_tag_not_category
  BEFORE INSERT OR UPDATE ON category_tags
  FOR EACH ROW
  EXECUTE FUNCTION validate_category_tag_not_category();

-- ============================================
-- PARTE 3: TRIGGER PARA user_category_tags (tags do usuário)
-- ============================================

CREATE OR REPLACE FUNCTION validate_user_tag_not_category()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conflict_exists BOOLEAN;
BEGIN
  -- Verificar se conflita com categorias do usuário
  SELECT EXISTS (
    SELECT 1 FROM public.categories 
    WHERE deleted_at IS NULL
      AND user_id = NEW.user_id
      AND LOWER(TRIM(name)) = LOWER(TRIM(NEW.tag_name))
  ) INTO v_conflict_exists;
  
  IF v_conflict_exists THEN
    RAISE EXCEPTION 'TAG_IS_CATEGORY:O nome "%" já existe como categoria', NEW.tag_name;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_validate_user_tag_not_category ON user_category_tags;
CREATE TRIGGER tr_validate_user_tag_not_category
  BEFORE INSERT OR UPDATE ON user_category_tags
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_tag_not_category();

-- ============================================
-- PARTE 4: TRIGGER DE SINCRONIZAÇÃO user_category_tags
-- ============================================

CREATE OR REPLACE FUNCTION sync_user_tag_to_partner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_partner_id UUID;
  v_partner_category_id UUID;
  v_default_category_id UUID;
BEGIN
  -- Buscar parceiro do casal
  SELECT CASE 
    WHEN user1_id = NEW.user_id THEN user2_id 
    ELSE user1_id 
  END INTO v_partner_id
  FROM public.user_couples
  WHERE status = 'active' 
    AND (user1_id = NEW.user_id OR user2_id = NEW.user_id);
  
  IF v_partner_id IS NOT NULL THEN
    -- Buscar default_category_id da categoria original
    SELECT default_category_id INTO v_default_category_id
    FROM public.categories WHERE id = NEW.category_id;
    
    -- Encontrar categoria equivalente do parceiro
    SELECT id INTO v_partner_category_id
    FROM public.categories 
    WHERE user_id = v_partner_id 
      AND default_category_id = v_default_category_id
      AND deleted_at IS NULL;
    
    -- Inserir tag para o parceiro (se não existir)
    IF v_partner_category_id IS NOT NULL THEN
      INSERT INTO public.user_category_tags (user_id, category_id, tag_name, tag_name_en, tag_name_es, color)
      VALUES (v_partner_id, v_partner_category_id, NEW.tag_name, NEW.tag_name_en, NEW.tag_name_es, NEW.color)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_sync_user_tag_to_partner ON user_category_tags;
CREATE TRIGGER tr_sync_user_tag_to_partner
  AFTER INSERT ON user_category_tags
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_tag_to_partner();