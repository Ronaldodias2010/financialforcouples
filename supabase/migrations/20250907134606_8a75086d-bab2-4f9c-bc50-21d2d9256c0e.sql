-- Safe, idempotent migration to deduplicate tags and fix relations without violating unique constraints

-- 1) Create or replace normalized insert function for user tags
CREATE OR REPLACE FUNCTION public.insert_normalized_user_tag(
  p_user_id uuid,
  p_category_id uuid,
  p_tag_name text,
  p_color text DEFAULT '#6366f1'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_normalized_name text;
  v_existing_id uuid;
  v_new_id uuid;
BEGIN
  v_normalized_name := lower(trim(p_tag_name));

  SELECT id INTO v_existing_id
  FROM public.user_category_tags
  WHERE user_id = p_user_id
    AND category_id = p_category_id
    AND lower(trim(tag_name)) = v_normalized_name
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN v_existing_id;
  END IF;

  INSERT INTO public.user_category_tags (
    user_id, category_id, tag_name, tag_name_en, tag_name_es, color
  ) VALUES (
    p_user_id, p_category_id, v_normalized_name, v_normalized_name, v_normalized_name, p_color
  ) RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$function$;

-- 2) Normalize existing user tag names to lowercase (idempotent)
UPDATE public.user_category_tags
SET tag_name = lower(trim(tag_name)),
    tag_name_en = lower(trim(COALESCE(tag_name_en, tag_name))),
    tag_name_es = lower(trim(COALESCE(tag_name_es, tag_name)));

-- 3) Remove duplicate user tags keeping the earliest
WITH duplicates AS (
  SELECT 
    user_id, category_id, lower(trim(tag_name)) AS normalized_name,
    array_agg(id ORDER BY created_at) AS tag_ids
  FROM public.user_category_tags
  GROUP BY user_id, category_id, lower(trim(tag_name))
  HAVING count(*) > 1
)
DELETE FROM public.user_category_tags uct
USING duplicates d
WHERE uct.id = ANY(d.tag_ids[2:]);

-- 4) Prepare canonical mapping for duplicate system tags by names
WITH system_duplicates AS (
  SELECT 
    lower(trim(name_pt)) AS normalized_pt,
    lower(trim(name_en)) AS normalized_en,
    lower(trim(name_es)) AS normalized_es,
    array_agg(id ORDER BY created_at) AS tag_ids
  FROM public.category_tags
  GROUP BY lower(trim(name_pt)), lower(trim(name_en)), lower(trim(name_es))
  HAVING count(*) > 1
),
canonical_tags AS (
  SELECT 
    normalized_pt, normalized_en, normalized_es,
    tag_ids[1] AS canonical_id,
    array_remove(tag_ids, tag_ids[1]) AS duplicate_ids
  FROM system_duplicates
)
-- 4a) Update relations to canonical where it won't violate unique constraint
UPDATE public.category_tag_relations ctr
SET tag_id = ct.canonical_id
FROM canonical_tags ct
WHERE ctr.tag_id = ANY(ct.duplicate_ids)
  AND NOT EXISTS (
    SELECT 1 FROM public.category_tag_relations ctr2
    WHERE ctr2.category_id = ctr.category_id
      AND ctr2.tag_id = ct.canonical_id
  );

-- 4b) Delete remaining relations that still reference duplicate_ids (now safe to remove)
DELETE FROM public.category_tag_relations ctr
USING canonical_tags ct
WHERE ctr.tag_id = ANY(ct.duplicate_ids);

-- 4c) Delete duplicate system tags
DELETE FROM public.category_tags ctg
USING (
  SELECT 
    tag_ids[1] AS canonical_id,
    array_remove(tag_ids, tag_ids[1]) AS duplicate_ids
  FROM (
    SELECT array_agg(id ORDER BY created_at) AS tag_ids
    FROM public.category_tags
    GROUP BY lower(trim(name_pt)), lower(trim(name_en)), lower(trim(name_es))
    HAVING count(*) > 1
  ) x
) dup
WHERE ctg.id = ANY(dup.duplicate_ids);

-- 5) Normalize system tag names (idempotent)
UPDATE public.category_tags
SET name_pt = lower(trim(name_pt)),
    name_en = lower(trim(name_en)),
    name_es = lower(trim(name_es));

-- 6) Unique indexes to prevent future duplicates (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_category_tags_unique 
ON public.user_category_tags (user_id, category_id, lower(trim(tag_name)));

CREATE UNIQUE INDEX IF NOT EXISTS idx_category_tags_unique 
ON public.category_tags (lower(trim(name_pt)), lower(trim(name_en)), lower(trim(name_es)));

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_tag_exclusions_unique 
ON public.user_category_tag_exclusions (user_id, category_id, system_tag_id);
