-- Fix security issues by setting search_path for functions that need it
-- This addresses the "Function Search Path Mutable" warnings

-- Function 1: Fix public.handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
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

-- Function 2: Fix public.update_updated_at_column function  
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;