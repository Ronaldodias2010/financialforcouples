
-- COMPREHENSIVE DUPLICATE TAG CLEANUP
-- Step 1: For each duplicate group, migrate all relations to the best tag (most keywords)
-- Step 2: Delete orphaned relations
-- Step 3: Delete duplicate tags

-- Create temp table with keeper and duplicates
CREATE TEMP TABLE tag_cleanup AS
WITH ranked AS (
  SELECT id, name_pt, name_en,
    ROW_NUMBER() OVER (
      PARTITION BY name_pt, name_en 
      ORDER BY COALESCE(array_length(keywords_pt,1),0) DESC, created_at ASC
    ) as rn
  FROM public.category_tags
)
SELECT id, name_pt, name_en, rn,
  FIRST_VALUE(id) OVER (PARTITION BY name_pt, name_en ORDER BY rn) as keep_id
FROM ranked
WHERE name_pt IN (
  SELECT name_pt FROM public.category_tags 
  GROUP BY name_pt, name_en HAVING COUNT(*) > 1
);

-- Step 1: Migrate relations from duplicates to keeper (avoid conflicts)
INSERT INTO public.category_tag_relations (category_id, tag_id, is_active)
SELECT DISTINCT ctr.category_id, tc.keep_id, ctr.is_active
FROM tag_cleanup tc
JOIN public.category_tag_relations ctr ON ctr.tag_id = tc.id
WHERE tc.rn > 1
  AND NOT EXISTS (
    SELECT 1 FROM public.category_tag_relations existing
    WHERE existing.category_id = ctr.category_id
      AND existing.tag_id = tc.keep_id
  );

-- Step 2: Delete relations pointing to duplicate tags
DELETE FROM public.category_tag_relations
WHERE tag_id IN (SELECT id FROM tag_cleanup WHERE rn > 1);

-- Step 3: Delete the duplicate tags themselves
DELETE FROM public.category_tags
WHERE id IN (SELECT id FROM tag_cleanup WHERE rn > 1);

-- Cleanup temp table
DROP TABLE tag_cleanup;
