-- Criar um usuário de teste para demonstrar o sistema de casal
-- Primeiro, vamos criar um perfil de teste
INSERT INTO public.profiles (user_id, display_name, preferred_currency, created_at, updated_at)
VALUES 
  ('12345678-1234-1234-1234-123456789012', 'Usuário Teste 2', 'BRL', now(), now())
ON CONFLICT (user_id) DO UPDATE SET 
  display_name = EXCLUDED.display_name,
  updated_at = now();

-- Agora vamos criar o vínculo de casal entre o usuário atual e o usuário de teste
INSERT INTO public.user_couples (user1_id, user2_id, status, created_at, updated_at)
VALUES 
  ('9a225939-4198-41ca-a08b-ececaf05749c', '12345678-1234-1234-1234-123456789012', 'active', now(), now())
ON CONFLICT DO NOTHING;