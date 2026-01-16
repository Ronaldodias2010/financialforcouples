-- Corrigir telefones que estão sem o código do país 55
-- Telefones brasileiros têm 11 dígitos (2 DDD + 9 número)
UPDATE profiles 
SET phone_number = '55' || phone_number,
    updated_at = NOW()
WHERE phone_number IS NOT NULL 
  AND phone_number != ''
  AND LENGTH(phone_number) = 11 
  AND phone_number NOT LIKE '55%'
  AND phone_number ~ '^[0-9]+$';