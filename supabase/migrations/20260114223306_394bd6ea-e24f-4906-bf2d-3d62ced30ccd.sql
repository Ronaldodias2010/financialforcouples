-- Atualizar o telefone da Priscila nas configurações de 2FA para usar o número correto
UPDATE user_2fa_settings 
SET phone_number = '+5511983288852', updated_at = now()
WHERE user_id = 'a46d7924-c398-4b18-a795-73e248fa10c2';