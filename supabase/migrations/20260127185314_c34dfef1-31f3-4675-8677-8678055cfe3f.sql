-- Add columns for provisional login flow
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS provisional_login boolean DEFAULT true;

-- Update existing profiles to have email_verified = true (existing users are confirmed)
UPDATE public.profiles 
SET email_verified = true, provisional_login = false 
WHERE email_verified IS NULL OR email_verified = false;

-- Create function to mark email as verified
CREATE OR REPLACE FUNCTION public.verify_user_email(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles 
  SET email_verified = true, provisional_login = false, updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- Create function to check if user email is verified
CREATE OR REPLACE FUNCTION public.is_email_verified(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_verified boolean;
BEGIN
  SELECT email_verified INTO v_verified 
  FROM profiles 
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_verified, false);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.verify_user_email(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_email_verified(uuid) TO authenticated;