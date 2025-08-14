-- Add existing_miles column to card_mileage_rules table
ALTER TABLE public.card_mileage_rules 
ADD COLUMN existing_miles numeric DEFAULT 0;