-- Create phone_verifications table for SMS verification
CREATE TABLE public.phone_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

-- Create policies for phone verifications
CREATE POLICY "Users can create phone verifications"
ON public.phone_verifications
FOR INSERT
WITH CHECK (true); -- Allow anyone to create verifications for security

CREATE POLICY "System can read and update phone verifications"
ON public.phone_verifications
FOR ALL
USING (true); -- System needs full access for verification process

-- Create index for faster lookups
CREATE INDEX idx_phone_verifications_phone_code ON public.phone_verifications(phone_number, verification_code);
CREATE INDEX idx_phone_verifications_expires ON public.phone_verifications(expires_at);

-- Update handle_new_user function to save phone number from auth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, display_name, phone_number)
    VALUES (
        NEW.id, 
        COALESCE(
            NEW.raw_user_meta_data ->> 'display_name',
            NEW.raw_user_meta_data ->> 'full_name', 
            NEW.raw_user_meta_data ->> 'name',
            NEW.email
        ),
        NEW.raw_user_meta_data ->> 'phone_number'
    );
    RETURN NEW;
END;
$$;