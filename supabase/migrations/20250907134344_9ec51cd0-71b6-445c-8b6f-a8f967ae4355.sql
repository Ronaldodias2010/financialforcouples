-- Fix duplicate tags and add proper normalized functions

-- Create function to insert normalized user tag (prevent duplicates)
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
  -- Normalize the tag name (lowercase, trimmed)
  v_normalized_name := lower(trim(p_tag_name));
  
  -- Check if tag already exists for this user/category (case-insensitive)
  SELECT id INTO v_existing_id
  FROM public.user_category_tags
  WHERE user_id = p_user_id 
    AND category_id = p_category_id
    AND lower(trim(tag_name)) = v_normalized_name
  LIMIT 1;
  
  -- If exists, return existing ID
  IF v_existing_id IS NOT NULL THEN
    RETURN v_existing_id;
  END IF;
  
  -- Create new tag with normalized name
  INSERT INTO public.user_category_tags (
    user_id,
    category_id,
    tag_name,
    tag_name_en,
    tag_name_es,
    color
  ) VALUES (
    p_user_id,
    p_category_id,
    v_normalized_name,
    v_normalized_name, -- Default to same name for other languages
    v_normalized_name,
    p_color
  ) RETURNING id INTO v_new_id;
  
  RETURN v_new_id;
END;
$function$;

-- Clean up existing duplicate user tags
WITH duplicates AS (
  SELECT 
    user_id,
    category_id,
    lower(trim(tag_name)) as normalized_name,
    array_agg(id ORDER BY created_at) as tag_ids
  FROM public.user_category_tags
  GROUP BY user_id, category_id, lower(trim(tag_name))
  HAVING count(*) > 1
)
DELETE FROM public.user_category_tags
WHERE id IN (
  SELECT unnest(tag_ids[2:]) -- Keep the first one, delete the rest
  FROM duplicates
);

-- Normalize existing user tag names to lowercase
UPDATE public.user_category_tags
SET tag_name = lower(trim(tag_name)),
    tag_name_en = lower(trim(COALESCE(tag_name_en, tag_name))),
    tag_name_es = lower(trim(COALESCE(tag_name_es, tag_name)));

-- Clean up duplicate system tags (category_tags)
WITH system_duplicates AS (
  SELECT 
    lower(trim(name_pt)) as normalized_pt,
    lower(trim(name_en)) as normalized_en,
    lower(trim(name_es)) as normalized_es,
    array_agg(id ORDER BY created_at) as tag_ids
  FROM public.category_tags
  GROUP BY lower(trim(name_pt)), lower(trim(name_en)), lower(trim(name_es))
  HAVING count(*) > 1
),
canonical_tags AS (
  SELECT 
    normalized_pt,
    normalized_en,
    normalized_es,
    tag_ids[1] as canonical_id,
    array_remove(tag_ids, tag_ids[1]) as duplicate_ids
  FROM system_duplicates
)
-- Update relations to point to canonical tag
UPDATE public.category_tag_relations 
SET tag_id = canonical_tags.canonical_id
FROM canonical_tags
WHERE tag_id = ANY(canonical_tags.duplicate_ids);

-- Delete duplicate system tags after updating relations
WITH system_duplicates AS (
  SELECT 
    lower(trim(name_pt)) as normalized_pt,
    lower(trim(name_en)) as normalized_en,
    lower(trim(name_es)) as normalized_es,
    array_agg(id ORDER BY created_at) as tag_ids
  FROM public.category_tags
  GROUP BY lower(trim(name_pt)), lower(trim(name_en)), lower(trim(name_es))
  HAVING count(*) > 1
)
DELETE FROM public.category_tags
WHERE id IN (
  SELECT unnest(tag_ids[2:]) -- Keep the first one, delete the rest
  FROM system_duplicates
);

-- Normalize existing system tag names to lowercase
UPDATE public.category_tags
SET name_pt = lower(trim(name_pt)),
    name_en = lower(trim(name_en)),
    name_es = lower(trim(name_es));

-- Add unique constraints to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_category_tags_unique 
ON public.user_category_tags (user_id, category_id, lower(trim(tag_name)));

CREATE UNIQUE INDEX IF NOT EXISTS idx_category_tags_unique 
ON public.category_tags (lower(trim(name_pt)), lower(trim(name_en)), lower(trim(name_es)));

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_tag_exclusions_unique 
ON public.user_category_tag_exclusions (user_id, category_id, system_tag_id);

-- Create function to search tags case-insensitively
CREATE OR REPLACE FUNCTION public.search_tags_for_category(
  p_category_id uuid,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  name_pt text,
  name_en text,
  name_es text,
  color text,
  is_user_tag boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Return system tags for this category
  RETURN QUERY
  SELECT 
    ct.id,
    ct.name_pt,
    ct.name_en,
    ct.name_es,
    ct.color,
    false as is_user_tag
  FROM public.category_tags ct
  JOIN public.category_tag_relations ctr ON ct.id = ctr.tag_id
  WHERE ctr.category_id = p_category_id
    AND ctr.is_active = true
  ORDER BY ct.name_pt;
  
  -- Return user tags if user_id provided
  IF p_user_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      uct.id,
      uct.tag_name as name_pt,
      COALESCE(uct.tag_name_en, uct.tag_name) as name_en,
      COALESCE(uct.tag_name_es, uct.tag_name) as name_es,
      uct.color,
      true as is_user_tag
    FROM public.user_category_tags uct
    WHERE uct.category_id = p_category_id
      AND uct.user_id = p_user_id
    ORDER BY uct.tag_name;
  END IF;
END;
$function$;