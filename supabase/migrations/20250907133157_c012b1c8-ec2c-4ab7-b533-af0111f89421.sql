-- Clean duplicate tags and normalize to lowercase
-- Step 1: Normalize existing tags to lowercase
UPDATE category_tags 
SET 
  name_pt = LOWER(name_pt),
  name_en = LOWER(name_en),
  name_es = LOWER(name_es),
  updated_at = now();

-- Step 2: Normalize user category tags
UPDATE user_category_tags 
SET 
  tag_name = LOWER(tag_name),
  tag_name_en = CASE WHEN tag_name_en IS NOT NULL THEN LOWER(tag_name_en) ELSE NULL END,
  tag_name_es = CASE WHEN tag_name_es IS NOT NULL THEN LOWER(tag_name_es) ELSE NULL END,
  updated_at = now();

-- Step 3: Create function for case-insensitive tag search
CREATE OR REPLACE FUNCTION find_tag_case_insensitive(
  search_name TEXT,
  search_lang TEXT DEFAULT 'pt'
) RETURNS SETOF category_tags
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM category_tags 
  WHERE 
    CASE 
      WHEN search_lang = 'en' THEN LOWER(name_en) = LOWER(search_name)
      WHEN search_lang = 'es' THEN LOWER(name_es) = LOWER(search_name)  
      ELSE LOWER(name_pt) = LOWER(search_name)
    END;
$$;

-- Step 4: Create function for normalized tag insertion
CREATE OR REPLACE FUNCTION insert_normalized_user_tag(
  p_user_id UUID,
  p_category_id UUID,
  p_tag_name TEXT,
  p_color TEXT DEFAULT '#6366f1'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tag_id UUID;
  v_normalized_name TEXT;
BEGIN
  -- Normalize tag name to lowercase
  v_normalized_name := LOWER(TRIM(p_tag_name));
  
  -- Check if tag already exists for this category (case-insensitive)
  IF EXISTS (
    SELECT 1 FROM user_category_tags 
    WHERE user_id = p_user_id 
      AND category_id = p_category_id 
      AND LOWER(tag_name) = v_normalized_name
  ) THEN
    RAISE EXCEPTION 'Tag already exists for this category';
  END IF;
  
  -- Insert normalized tag
  INSERT INTO user_category_tags (
    user_id, category_id, tag_name, color
  ) VALUES (
    p_user_id, p_category_id, v_normalized_name, p_color
  ) RETURNING id INTO v_tag_id;
  
  RETURN v_tag_id;
END;
$$;