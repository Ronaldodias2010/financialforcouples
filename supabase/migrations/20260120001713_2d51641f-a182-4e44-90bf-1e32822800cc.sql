-- Migrar tags existentes para a tabela subcategories
INSERT INTO subcategories (user_id, category_id, name, name_en, name_es, color, is_system, source_tag_id)
SELECT 
  uct.user_id,
  uct.category_id,
  uct.tag_name as name,
  COALESCE(uct.tag_name_en, uct.tag_name) as name_en,
  COALESCE(uct.tag_name_es, uct.tag_name) as name_es,
  COALESCE(uct.color, '#6366f1') as color,
  false as is_system,
  uct.id as source_tag_id
FROM user_category_tags uct
WHERE NOT EXISTS (
  SELECT 1 FROM subcategories s 
  WHERE s.user_id = uct.user_id 
  AND s.category_id = uct.category_id 
  AND s.name = uct.tag_name
  AND s.deleted_at IS NULL
)