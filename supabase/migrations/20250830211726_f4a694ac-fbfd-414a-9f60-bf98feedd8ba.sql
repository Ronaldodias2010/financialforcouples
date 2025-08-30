-- Add payment_info column to partnership_applications table
ALTER TABLE public.partnership_applications 
ADD COLUMN payment_info TEXT;