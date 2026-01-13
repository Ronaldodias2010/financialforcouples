
-- Corrigir telefone específico do usuário Gabriel
UPDATE profiles
SET phone_number = '5511994433352'
WHERE user_id = '80145997-572d-4f4d-af15-4aad74eed0b9'
  AND phone_number = '11994433352';
