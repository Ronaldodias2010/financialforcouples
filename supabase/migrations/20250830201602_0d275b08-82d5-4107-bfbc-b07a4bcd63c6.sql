-- Update existing NULL social_media records with a default message
UPDATE public.partnership_applications 
SET social_media = 'Não informado durante o cadastro'
WHERE social_media IS NULL;

-- Make social_media column NOT NULL
ALTER TABLE public.partnership_applications 
ALTER COLUMN social_media SET NOT NULL;