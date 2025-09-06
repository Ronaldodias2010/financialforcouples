-- Limpar tags duplicadas - versão final
-- Script para consolidar tags duplicadas mantendo a versão capitalizada

DO $$
DECLARE
    duplicate_record RECORD;
    lowercase_tag_id UUID;
    capitalized_tag_id UUID;
BEGIN
    -- Para cada grupo de tags duplicadas (lowercase vs capitalized)
    FOR duplicate_record IN 
        SELECT 
            LOWER(name_pt) as normalized_name,
            array_agg(id ORDER BY name_pt) as tag_ids,
            array_agg(name_pt ORDER BY name_pt) as tag_names
        FROM category_tags 
        GROUP BY LOWER(name_pt) 
        HAVING COUNT(*) > 1
    LOOP
        -- Identificar qual é a versão lowercase e qual é a capitalizada
        IF duplicate_record.tag_names[1] = LOWER(duplicate_record.tag_names[1]) THEN
            lowercase_tag_id := duplicate_record.tag_ids[1];
            capitalized_tag_id := duplicate_record.tag_ids[2];
        ELSE
            lowercase_tag_id := duplicate_record.tag_ids[2];
            capitalized_tag_id := duplicate_record.tag_ids[1];
        END IF;
        
        RAISE NOTICE 'Processando: % -> %, lowercase_id: %, capitalized_id: %', 
            duplicate_record.tag_names, duplicate_record.normalized_name, 
            lowercase_tag_id, capitalized_tag_id;
        
        -- 1. Remover relações duplicadas (caso existam)
        DELETE FROM category_tag_relations 
        WHERE tag_id = lowercase_tag_id 
        AND category_id IN (
            SELECT category_id 
            FROM category_tag_relations 
            WHERE tag_id = capitalized_tag_id
        );
        
        -- 2. Migrar relações restantes da tag lowercase para a capitalizada
        UPDATE category_tag_relations 
        SET tag_id = capitalized_tag_id 
        WHERE tag_id = lowercase_tag_id;
        
        -- 3. Remover exclusões duplicadas de user_system_tag_exclusions
        DELETE FROM user_system_tag_exclusions 
        WHERE system_tag_id = lowercase_tag_id 
        AND (user_id, category_id) IN (
            SELECT user_id, category_id
            FROM user_system_tag_exclusions 
            WHERE system_tag_id = capitalized_tag_id
        );
        
        -- 4. Migrar exclusões restantes
        UPDATE user_system_tag_exclusions 
        SET system_tag_id = capitalized_tag_id 
        WHERE system_tag_id = lowercase_tag_id;
        
        -- 5. Deletar a tag lowercase (agora sem referências)
        DELETE FROM category_tags WHERE id = lowercase_tag_id;
        
        RAISE NOTICE 'Tag % (%) removida com sucesso', 
            (SELECT name_pt FROM category_tags WHERE id = lowercase_tag_id LIMIT 1), 
            lowercase_tag_id;
    END LOOP;
    
    RAISE NOTICE 'Limpeza de tags duplicadas concluída!';
END $$;