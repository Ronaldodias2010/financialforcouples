-- Soft delete all subcategories that have the same name as an existing category
-- This fixes the duplicate "reembolso" subcategory vs "Reembolso" category issue

UPDATE subcategories
SET deleted_at = NOW()
WHERE deleted_at IS NULL
  AND id IN (
    SELECT DISTINCT s.id
    FROM subcategories s
    JOIN categories c ON s.category_id = c.id
    JOIN categories cat_dup ON LOWER(TRIM(s.name)) = LOWER(TRIM(cat_dup.name))
    WHERE s.deleted_at IS NULL
      AND c.deleted_at IS NULL
      AND cat_dup.deleted_at IS NULL
  );

-- Also clean up from default_subcategories to prevent future replication
DELETE FROM default_subcategories
WHERE id IN (
  SELECT ds.id
  FROM default_subcategories ds
  JOIN default_categories dc ON LOWER(TRIM(ds.name)) = LOWER(TRIM(dc.name_pt))
     OR LOWER(TRIM(ds.name)) = LOWER(TRIM(dc.name_en))
     OR LOWER(TRIM(ds.name)) = LOWER(TRIM(dc.name_es))
);

-- Create or replace the validation trigger to prevent this in the future
CREATE OR REPLACE FUNCTION validate_subcategory_not_category()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if subcategory name matches any category name (case-insensitive)
  IF EXISTS (
    SELECT 1 FROM categories 
    WHERE deleted_at IS NULL
      AND LOWER(TRIM(name)) = LOWER(TRIM(NEW.name))
  ) THEN
    RAISE EXCEPTION 'Subcategory name cannot match an existing category name: %', NEW.name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger to ensure it's active
DROP TRIGGER IF EXISTS validate_subcategory_not_category_trigger ON subcategories;

CREATE TRIGGER validate_subcategory_not_category_trigger
BEFORE INSERT OR UPDATE ON subcategories
FOR EACH ROW
EXECUTE FUNCTION validate_subcategory_not_category();