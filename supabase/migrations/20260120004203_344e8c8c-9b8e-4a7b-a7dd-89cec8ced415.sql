-- =====================================================
-- REGRA 4: Garantir traduções (BEFORE INSERT/UPDATE)
-- =====================================================
CREATE OR REPLACE FUNCTION ensure_subcategory_translations()
RETURNS TRIGGER AS $$
BEGIN
  -- Se não tiver tradução EN, usar nome PT como fallback
  IF NEW.name_en IS NULL OR NEW.name_en = '' THEN
    NEW.name_en := NEW.name;
  END IF;
  
  -- Se não tiver tradução ES, usar nome PT como fallback
  IF NEW.name_es IS NULL OR NEW.name_es = '' THEN
    NEW.name_es := NEW.name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_ensure_subcategory_translations
  BEFORE INSERT OR UPDATE ON subcategories
  FOR EACH ROW
  EXECUTE FUNCTION ensure_subcategory_translations();

-- =====================================================
-- REGRA 2: Subcategoria não pode ser uma categoria
-- =====================================================
CREATE OR REPLACE FUNCTION validate_subcategory_not_category()
RETURNS TRIGGER AS $$
DECLARE
  v_category_exists BOOLEAN;
  v_category_name TEXT;
BEGIN
  -- Verificar se o nome existe como categoria do usuário ou do parceiro
  SELECT EXISTS (
    SELECT 1 FROM categories 
    WHERE deleted_at IS NULL
      AND (user_id = NEW.user_id 
           OR user_id IN (
             SELECT CASE WHEN user1_id = NEW.user_id THEN user2_id ELSE user1_id END
             FROM user_couples WHERE status = 'active' 
               AND (user1_id = NEW.user_id OR user2_id = NEW.user_id)
           ))
      AND (LOWER(TRIM(name)) = LOWER(TRIM(NEW.name)) 
           OR LOWER(TRIM(name)) = LOWER(TRIM(NEW.name_en))
           OR LOWER(TRIM(name)) = LOWER(TRIM(NEW.name_es)))
  ) INTO v_category_exists;
  
  IF v_category_exists THEN
    SELECT name INTO v_category_name FROM categories 
    WHERE deleted_at IS NULL
      AND (LOWER(TRIM(name)) = LOWER(TRIM(NEW.name)) 
           OR LOWER(TRIM(name)) = LOWER(TRIM(NEW.name_en))
           OR LOWER(TRIM(name)) = LOWER(TRIM(NEW.name_es)))
    LIMIT 1;
    
    RAISE EXCEPTION 'SUBCATEGORY_IS_CATEGORY:O nome "%" já existe como categoria', COALESCE(v_category_name, NEW.name);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_validate_subcategory_not_category
  BEFORE INSERT OR UPDATE ON subcategories
  FOR EACH ROW
  EXECUTE FUNCTION validate_subcategory_not_category();

-- =====================================================
-- REGRA 3: Subcategoria única entre categorias
-- =====================================================
CREATE OR REPLACE FUNCTION validate_subcategory_unique_across_categories()
RETURNS TRIGGER AS $$
DECLARE
  v_duplicate_exists BOOLEAN;
  v_existing_category TEXT;
  v_existing_subcategory TEXT;
BEGIN
  -- Buscar se já existe em outra categoria (do usuário ou parceiro)
  SELECT EXISTS (
    SELECT 1 FROM subcategories s
    WHERE s.deleted_at IS NULL
      AND s.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND s.category_id != NEW.category_id
      AND (s.user_id = NEW.user_id 
           OR s.user_id IN (
             SELECT CASE WHEN user1_id = NEW.user_id THEN user2_id ELSE user1_id END
             FROM user_couples WHERE status = 'active' 
               AND (user1_id = NEW.user_id OR user2_id = NEW.user_id)
           ))
      AND (LOWER(TRIM(s.name)) = LOWER(TRIM(NEW.name))
           OR LOWER(TRIM(s.name)) = LOWER(TRIM(NEW.name_en))
           OR LOWER(TRIM(s.name)) = LOWER(TRIM(NEW.name_es))
           OR LOWER(TRIM(s.name_en)) = LOWER(TRIM(NEW.name))
           OR LOWER(TRIM(s.name_es)) = LOWER(TRIM(NEW.name)))
  ) INTO v_duplicate_exists;
  
  IF v_duplicate_exists THEN
    -- Buscar em qual categoria já existe
    SELECT c.name, s.name INTO v_existing_category, v_existing_subcategory
    FROM subcategories s
    JOIN categories c ON s.category_id = c.id
    WHERE s.deleted_at IS NULL
      AND s.category_id != NEW.category_id
      AND (LOWER(TRIM(s.name)) = LOWER(TRIM(NEW.name))
           OR LOWER(TRIM(s.name)) = LOWER(TRIM(NEW.name_en))
           OR LOWER(TRIM(s.name)) = LOWER(TRIM(NEW.name_es)))
    LIMIT 1;
    
    RAISE EXCEPTION 'SUBCATEGORY_DUPLICATE:Subcategoria "%" já existe na categoria "%"', COALESCE(v_existing_subcategory, NEW.name), v_existing_category;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_validate_subcategory_unique_across_categories
  BEFORE INSERT OR UPDATE ON subcategories
  FOR EACH ROW
  EXECUTE FUNCTION validate_subcategory_unique_across_categories();

-- =====================================================
-- REGRA 1: Sincronizar subcategoria com parceiro (AFTER INSERT)
-- =====================================================
CREATE OR REPLACE FUNCTION sync_subcategory_to_partner()
RETURNS TRIGGER AS $$
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
  FROM user_couples
  WHERE status = 'active' 
    AND (user1_id = NEW.user_id OR user2_id = NEW.user_id);
  
  IF v_partner_id IS NOT NULL THEN
    -- Buscar default_category_id da categoria original
    SELECT default_category_id INTO v_default_category_id
    FROM categories WHERE id = NEW.category_id;
    
    -- Encontrar categoria equivalente do parceiro
    SELECT id INTO v_partner_category_id
    FROM categories 
    WHERE user_id = v_partner_id 
      AND default_category_id = v_default_category_id
      AND deleted_at IS NULL;
    
    -- Inserir subcategoria para o parceiro (se não existir)
    IF v_partner_category_id IS NOT NULL THEN
      INSERT INTO subcategories (user_id, category_id, name, name_en, name_es, color, icon, is_system)
      VALUES (v_partner_id, v_partner_category_id, NEW.name, NEW.name_en, NEW.name_es, NEW.color, NEW.icon, NEW.is_system)
      ON CONFLICT (user_id, category_id, name) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_sync_subcategory_to_partner
  AFTER INSERT ON subcategories
  FOR EACH ROW
  EXECUTE FUNCTION sync_subcategory_to_partner();

-- =====================================================
-- Correção: Traduzir subcategoria existente
-- =====================================================
UPDATE subcategories 
SET name_en = 'Parking Reimbursement',
    name_es = 'Reembolso de Estacionamiento'
WHERE LOWER(name) = 'reembolso de estacionamento'
  AND (name_en IS NULL OR name_en = '' OR name_en = name);

-- Corrigir todas as subcategorias que estão sem tradução adequada
UPDATE subcategories 
SET name_en = name,
    name_es = name
WHERE (name_en IS NULL OR name_en = '')
   OR (name_es IS NULL OR name_es = '');