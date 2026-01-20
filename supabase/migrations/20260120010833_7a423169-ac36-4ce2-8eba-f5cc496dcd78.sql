-- Drop the old function and create fixed version with correct columns
DROP FUNCTION IF EXISTS migrate_all_tags_to_subcategories();

CREATE OR REPLACE FUNCTION migrate_all_tags_to_subcategories()
RETURNS TABLE(migrated_count INTEGER, skipped_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category RECORD;
  v_tag RECORD;
  v_user_tag RECORD;
  v_migrated INTEGER := 0;
  v_skipped INTEGER := 0;
  v_exists BOOLEAN;
BEGIN
  -- Process users WITHOUT couples first
  FOR v_category IN 
    SELECT c.id, c.user_id, c.default_category_id 
    FROM categories c 
    WHERE c.deleted_at IS NULL 
    AND c.default_category_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM user_couples uc 
      WHERE (uc.user1_id = c.user_id OR uc.user2_id = c.user_id)
      AND uc.status = 'active'
    )
  LOOP
    FOR v_tag IN 
      SELECT ct.id, ct.name_pt, ct.name_en, ct.name_es, ct.color, ct.icon
      FROM category_tags ct
      JOIN category_tag_relations ctr ON ct.id = ctr.tag_id
      WHERE ctr.category_id = v_category.default_category_id
      AND ctr.is_active = true
    LOOP
      SELECT EXISTS (
        SELECT 1 FROM categories 
        WHERE user_id = v_category.user_id 
        AND LOWER(TRIM(name)) = LOWER(TRIM(v_tag.name_pt))
        AND deleted_at IS NULL
      ) INTO v_exists;
      
      IF v_exists THEN
        v_skipped := v_skipped + 1;
        CONTINUE;
      END IF;
      
      SELECT EXISTS (
        SELECT 1 FROM subcategories s
        WHERE s.user_id = v_category.user_id
        AND LOWER(TRIM(s.name)) = LOWER(TRIM(v_tag.name_pt))
        AND s.deleted_at IS NULL
      ) INTO v_exists;
      
      IF v_exists THEN
        v_skipped := v_skipped + 1;
        CONTINUE;
      END IF;
      
      BEGIN
        INSERT INTO subcategories (name, name_en, name_es, category_id, user_id, is_system, color, icon)
        VALUES (v_tag.name_pt, v_tag.name_en, v_tag.name_es, v_category.id, v_category.user_id, true, v_tag.color, v_tag.icon);
        v_migrated := v_migrated + 1;
      EXCEPTION WHEN OTHERS THEN
        v_skipped := v_skipped + 1;
      END;
    END LOOP;
  END LOOP;

  -- Process ONLY user1 from each couple
  FOR v_category IN 
    SELECT c.id, c.user_id, c.default_category_id, uc.user2_id as partner_id
    FROM categories c 
    JOIN user_couples uc ON uc.user1_id = c.user_id AND uc.status = 'active'
    WHERE c.deleted_at IS NULL 
    AND c.default_category_id IS NOT NULL
  LOOP
    FOR v_tag IN 
      SELECT ct.id, ct.name_pt, ct.name_en, ct.name_es, ct.color, ct.icon
      FROM category_tags ct
      JOIN category_tag_relations ctr ON ct.id = ctr.tag_id
      WHERE ctr.category_id = v_category.default_category_id
      AND ctr.is_active = true
    LOOP
      SELECT EXISTS (
        SELECT 1 FROM categories 
        WHERE user_id IN (v_category.user_id, v_category.partner_id)
        AND LOWER(TRIM(name)) = LOWER(TRIM(v_tag.name_pt))
        AND deleted_at IS NULL
      ) INTO v_exists;
      
      IF v_exists THEN
        v_skipped := v_skipped + 1;
        CONTINUE;
      END IF;
      
      SELECT EXISTS (
        SELECT 1 FROM subcategories s
        WHERE s.user_id IN (v_category.user_id, v_category.partner_id)
        AND LOWER(TRIM(s.name)) = LOWER(TRIM(v_tag.name_pt))
        AND s.deleted_at IS NULL
      ) INTO v_exists;
      
      IF v_exists THEN
        v_skipped := v_skipped + 1;
        CONTINUE;
      END IF;
      
      BEGIN
        INSERT INTO subcategories (name, name_en, name_es, category_id, user_id, is_system, color, icon)
        VALUES (v_tag.name_pt, v_tag.name_en, v_tag.name_es, v_category.id, v_category.user_id, true, v_tag.color, v_tag.icon);
        v_migrated := v_migrated + 1;
      EXCEPTION WHEN OTHERS THEN
        v_skipped := v_skipped + 1;
      END;
    END LOOP;
  END LOOP;

  -- Migrate user_category_tags (columns: id, user_id, category_id, tag_name, color, tag_name_en, tag_name_es)
  FOR v_user_tag IN 
    SELECT uct.id, uct.tag_name, uct.tag_name_en, uct.tag_name_es, 
           uct.category_id, uct.user_id, uct.color,
           COALESCE(
             (SELECT user2_id FROM user_couples WHERE user1_id = uct.user_id AND status = 'active'),
             (SELECT user1_id FROM user_couples WHERE user2_id = uct.user_id AND status = 'active')
           ) as partner_id
    FROM user_category_tags uct
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM categories 
      WHERE user_id IN (v_user_tag.user_id, COALESCE(v_user_tag.partner_id, v_user_tag.user_id))
      AND LOWER(TRIM(name)) = LOWER(TRIM(v_user_tag.tag_name))
      AND deleted_at IS NULL
    ) INTO v_exists;
    
    IF v_exists THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;
    
    SELECT EXISTS (
      SELECT 1 FROM subcategories s
      WHERE s.user_id IN (v_user_tag.user_id, COALESCE(v_user_tag.partner_id, v_user_tag.user_id))
      AND LOWER(TRIM(s.name)) = LOWER(TRIM(v_user_tag.tag_name))
      AND s.deleted_at IS NULL
    ) INTO v_exists;
    
    IF v_exists THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;
    
    BEGIN
      INSERT INTO subcategories (name, name_en, name_es, category_id, user_id, is_system, color)
      VALUES (v_user_tag.tag_name, v_user_tag.tag_name_en, v_user_tag.tag_name_es, v_user_tag.category_id, v_user_tag.user_id, false, v_user_tag.color);
      v_migrated := v_migrated + 1;
    EXCEPTION WHEN OTHERS THEN
      v_skipped := v_skipped + 1;
    END;
  END LOOP;

  RETURN QUERY SELECT v_migrated, v_skipped;
END;
$$;

-- Execute the migration
SELECT * FROM migrate_all_tags_to_subcategories();

-- Mark legacy tables as deprecated
COMMENT ON TABLE category_tags IS 'DEPRECATED: Use subcategories table instead.';
COMMENT ON TABLE user_category_tags IS 'DEPRECATED: Use subcategories table instead.';
COMMENT ON TABLE category_tag_relations IS 'DEPRECATED: Use subcategories table instead.';