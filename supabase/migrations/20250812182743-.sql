-- Fix functions that reference the non-existent temp_password column

-- Update the hash_temp_password_trigger function to only work with temp_password_hash
CREATE OR REPLACE FUNCTION public.hash_temp_password_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only hash if temp_password_hash is being set directly as plaintext
  -- This function is now mainly for consistency, since we handle hashing in other functions
  RETURN NEW;
END;
$function$;

-- Update the create_manual_premium_access function to ensure it works correctly
CREATE OR REPLACE FUNCTION public.create_manual_premium_access(
  p_email text, 
  p_user_id uuid, 
  p_start_date date DEFAULT CURRENT_DATE, 
  p_end_date date DEFAULT (CURRENT_DATE + '1 year'::interval)
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_temp_password TEXT;
  v_record_id UUID;
BEGIN
  -- Only admins can call this function
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Validate inputs
  IF p_email IS NULL OR p_email = '' OR p_user_id IS NULL THEN
    RAISE EXCEPTION 'Email and user_id are required';
  END IF;
  
  IF p_end_date <= p_start_date THEN
    RAISE EXCEPTION 'End date must be after start date';
  END IF;
  
  -- Generate secure temporary password
  v_temp_password := public.generate_temp_password();
  
  -- Insert record with hashed password
  INSERT INTO public.manual_premium_access (
    email,
    user_id,
    start_date,
    end_date,
    temp_password_hash,
    status,
    created_by_admin_id
  ) VALUES (
    p_email,
    p_user_id,
    p_start_date,
    p_end_date,
    public.hash_temp_password(v_temp_password),
    'active',
    auth.uid()
  ) RETURNING id INTO v_record_id;
  
  -- Return the ID (not the password for security)
  RETURN v_record_id;
END;
$function$;