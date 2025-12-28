-- Add whatsapp_verified_at column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS whatsapp_verified_at timestamp with time zone DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.profiles.whatsapp_verified_at IS 'Timestamp when WhatsApp number was verified for financial input via WhatsApp';

-- Create index for faster lookups by phone_number
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON public.profiles(phone_number) WHERE phone_number IS NOT NULL;

-- Create index for verified WhatsApp users
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp_verified ON public.profiles(phone_number, whatsapp_verified_at) WHERE whatsapp_verified_at IS NOT NULL;