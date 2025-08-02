-- Add second_user_email column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN second_user_email TEXT;