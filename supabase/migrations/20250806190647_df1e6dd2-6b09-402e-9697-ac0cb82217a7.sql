-- Criar vínculo de casal entre o usuário atual e um usuário existente para teste
INSERT INTO public.user_couples (user1_id, user2_id, status, created_at, updated_at)
VALUES 
  ('9a225939-4198-41ca-a08b-ececaf05749c', '91b37387-dee2-401e-93f7-3d8b15f39a20', 'active', now(), now())
ON CONFLICT DO NOTHING;