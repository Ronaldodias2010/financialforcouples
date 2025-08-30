-- Fix incorrect promo code value for SILVA2101
UPDATE promo_codes 
SET discount_value = 179.80
WHERE code = 'SILVA2101' AND discount_value = 5;