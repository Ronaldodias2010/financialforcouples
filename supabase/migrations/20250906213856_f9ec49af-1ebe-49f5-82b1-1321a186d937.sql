-- Migração para limpar tags duplicadas
-- Manter versões capitalizadas, remover minúsculas

-- 1. Criar tabela temporária para mapear tags duplicadas
CREATE TEMP TABLE duplicate_tags_mapping AS
SELECT 
  lower_tag.id as lower_id,
  upper_tag.id as upper_id,
  lower_tag.name_pt as lower_name,
  upper_tag.name_pt as upper_name
FROM category_tags lower_tag
JOIN category_tags upper_tag ON (
  LOWER(lower_tag.name_pt) = LOWER(upper_tag.name_pt) 
  AND lower_tag.id != upper_tag.id
  AND lower_tag.name_pt != upper_tag.name_pt
  AND lower_tag.name_pt = LOWER(lower_tag.name_pt) -- tag minúscula
  AND upper_tag.name_pt != LOWER(upper_tag.name_pt) -- tag capitalizada
);

-- 2. Migrar relações de categoria das tags minúsculas para capitalizadas
UPDATE category_tag_relations 
SET tag_id = (
  SELECT upper_id 
  FROM duplicate_tags_mapping 
  WHERE lower_id = category_tag_relations.tag_id
)
WHERE tag_id IN (SELECT lower_id FROM duplicate_tags_mapping);

-- 3. Migrar exclusões de usuário das tags minúsculas para capitalizadas
UPDATE user_category_tag_exclusions 
SET excluded_tag_id = (
  SELECT upper_id 
  FROM duplicate_tags_mapping 
  WHERE lower_id = user_category_tag_exclusions.excluded_tag_id
)
WHERE excluded_tag_id IN (SELECT lower_id FROM duplicate_tags_mapping)
AND NOT EXISTS (
  -- Evitar duplicatas se já existe exclusão para a tag capitalizada
  SELECT 1 FROM user_category_tag_exclusions ue2 
  WHERE ue2.user_id = user_category_tag_exclusions.user_id 
  AND ue2.category_id = user_category_tag_exclusions.category_id 
  AND ue2.excluded_tag_id = (
    SELECT upper_id 
    FROM duplicate_tags_mapping 
    WHERE lower_id = user_category_tag_exclusions.excluded_tag_id
  )
  AND ue2.id != user_category_tag_exclusions.id
);

-- 4. Remover exclusões duplicadas que não puderam ser migradas
DELETE FROM user_category_tag_exclusions 
WHERE excluded_tag_id IN (SELECT lower_id FROM duplicate_tags_mapping);

-- 5. Remover relações de categoria para tags que serão deletadas
DELETE FROM category_tag_relations 
WHERE tag_id IN (SELECT lower_id FROM duplicate_tags_mapping);

-- 6. Remover as tags duplicadas minúsculas
DELETE FROM category_tags 
WHERE id IN (SELECT lower_id FROM duplicate_tags_mapping);

-- 7. Verificação final - mostrar quantas tags foram limpas
DO $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO cleaned_count FROM duplicate_tags_mapping;
  RAISE NOTICE 'Tags duplicadas limpas: %', cleaned_count;
END $$;