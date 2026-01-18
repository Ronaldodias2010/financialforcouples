
-- Regra Internacional para Caixa Platinum (Priscila)
INSERT INTO card_mileage_rules (
  user_id, card_id, bank_name, card_brand, 
  miles_per_amount, amount_threshold, currency, 
  is_active, existing_miles, purchase_type
)
SELECT 
  user_id, card_id, bank_name, card_brand,
  miles_per_amount, amount_threshold, currency,
  true, 0, 'international'
FROM card_mileage_rules 
WHERE id = 'bc662acc-5bd4-4c4d-a48f-3af46548f57b';

-- Regra Internacional para Sicredi Gold (Ronaldo)
INSERT INTO card_mileage_rules (
  user_id, card_id, bank_name, card_brand,
  miles_per_amount, amount_threshold, currency,
  is_active, existing_miles, purchase_type
)
SELECT 
  user_id, card_id, bank_name, card_brand,
  miles_per_amount, amount_threshold, currency,
  true, 0, 'international'
FROM card_mileage_rules 
WHERE id = 'bbd4f757-2bb2-44a8-937d-d8b2c17bfade';
