-- Add second_user_name column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN second_user_name TEXT;