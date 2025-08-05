-- Fix function search path security warnings
-- Update existing functions to include search_path parameter

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Fix handle_auth_user_new function if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'handle_auth_user_new'
    ) THEN
        EXECUTE '
        CREATE OR REPLACE FUNCTION public.handle_auth_user_new()
        RETURNS trigger
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $func$
        BEGIN
            INSERT INTO public.profiles (user_id, display_name)
            VALUES (NEW.id, NEW.email);
            RETURN NEW;
        END;
        $func$;';
    END IF;
END $$;

-- Fix handle_new_user function if it exists  
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
    ) THEN
        EXECUTE '
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS trigger
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $func$
        BEGIN
            INSERT INTO public.profiles (user_id, display_name)
            VALUES (NEW.id, NEW.email);
            RETURN NEW;
        END;
        $func$;';
    END IF;
END $$;