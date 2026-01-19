-- Add multilingual columns to educational_content table
ALTER TABLE public.educational_content
ADD COLUMN IF NOT EXISTS title_pt TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS title_en TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS title_es TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS description_pt TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS description_en TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS description_es TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS web_content_pt TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS web_content_en TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS web_content_es TEXT DEFAULT NULL;

-- Migrate existing data (Portuguese as default)
UPDATE public.educational_content 
SET 
  title_pt = title,
  description_pt = description,
  web_content_pt = web_content
WHERE title_pt IS NULL AND title IS NOT NULL;