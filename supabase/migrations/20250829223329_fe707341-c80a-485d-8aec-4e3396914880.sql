-- Fix hash_temp_password function to use correct schema for pgcrypto functions
CREATE OR REPLACE FUNCTION public.hash_temp_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Use extensions.crypt with extensions.gen_salt for secure hashing
  RETURN extensions.crypt(password, extensions.gen_salt('bf', 10));
END;
$function$;

-- Fix verify_temp_password function to use correct schema
CREATE OR REPLACE FUNCTION public.verify_temp_password(password text, hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verify password against hash using extensions.crypt
  RETURN (hash = extensions.crypt(password, hash));
END;
$function$;

-- Update the trigger function to handle hashing properly
CREATE OR REPLACE FUNCTION public.hash_temp_password_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Hash temp_password_hash if it's being set as plaintext
  IF NEW.temp_password_hash IS NOT NULL AND OLD.temp_password_hash IS DISTINCT FROM NEW.temp_password_hash THEN
    -- Only hash if it doesn't look like it's already hashed (bcrypt hashes start with $2)
    IF NEW.temp_password_hash !~ '^\$2[aby]?\$[0-9]+\$' THEN
      NEW.temp_password_hash := public.hash_temp_password(NEW.temp_password_hash);
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;