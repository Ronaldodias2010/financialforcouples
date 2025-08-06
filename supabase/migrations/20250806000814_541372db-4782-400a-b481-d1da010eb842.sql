-- Limpeza do banco de dados para liberar emails específicos para reutilização
-- Emails a serem limpos: ronadias2010@gmail.com, priscila.serone@gmail.com, ronaldo.silva@arxexperience.com.br

-- 1. Primeiro, vamos identificar os user_ids associados a esses emails
-- e armazenar em uma tabela temporária
CREATE TEMP TABLE users_to_clean AS
SELECT au.id as user_id, au.email
FROM auth.users au 
WHERE au.email IN (
  'ronadias2010@gmail.com', 
  'priscila.serone@gmail.com', 
  'ronaldo.silva@arxexperience.com.br'
);

-- 2. Remover dados financeiros associados
DELETE FROM public.transactions 
WHERE user_id IN (SELECT user_id FROM users_to_clean);

DELETE FROM public.cards 
WHERE user_id IN (SELECT user_id FROM users_to_clean);

DELETE FROM public.accounts 
WHERE user_id IN (SELECT user_id FROM users_to_clean);

DELETE FROM public.categories 
WHERE user_id IN (SELECT user_id FROM users_to_clean);

DELETE FROM public.subcategories 
WHERE user_id IN (SELECT user_id FROM users_to_clean);

DELETE FROM public.recurring_expenses 
WHERE user_id IN (SELECT user_id FROM users_to_clean);

-- 3. Remover dados de investimentos
DELETE FROM public.investment_performance 
WHERE investment_id IN (
  SELECT id FROM public.investments 
  WHERE user_id IN (SELECT user_id FROM users_to_clean)
);

DELETE FROM public.investments 
WHERE user_id IN (SELECT user_id FROM users_to_clean);

DELETE FROM public.investment_goals 
WHERE user_id IN (SELECT user_id FROM users_to_clean);

-- 4. Remover dados de milhas
DELETE FROM public.mileage_history 
WHERE user_id IN (SELECT user_id FROM users_to_clean);

DELETE FROM public.mileage_goals 
WHERE user_id IN (SELECT user_id FROM users_to_clean);

DELETE FROM public.card_mileage_rules 
WHERE user_id IN (SELECT user_id FROM users_to_clean);

-- 5. Remover relacionamentos de casais
DELETE FROM public.user_couples 
WHERE user1_id IN (SELECT user_id FROM users_to_clean) 
   OR user2_id IN (SELECT user_id FROM users_to_clean);

-- 6. Remover convites pendentes (tanto como convidador quanto convidado)
DELETE FROM public.user_invites 
WHERE inviter_user_id IN (SELECT user_id FROM users_to_clean)
   OR invitee_email IN (
     'ronadias2010@gmail.com', 
     'priscila.serone@gmail.com', 
     'ronaldo.silva@arxexperience.com.br'
   );

-- 7. Remover assinaturas
DELETE FROM public.subscribers 
WHERE user_id IN (SELECT user_id FROM users_to_clean)
   OR email IN (
     'ronadias2010@gmail.com', 
     'priscila.serone@gmail.com', 
     'ronaldo.silva@arxexperience.com.br'
   );

-- 8. Remover acessos premium manuais
DELETE FROM public.manual_premium_access 
WHERE user_id IN (SELECT user_id FROM users_to_clean)
   OR email IN (
     'ronadias2010@gmail.com', 
     'priscila.serone@gmail.com', 
     'ronaldo.silva@arxexperience.com.br'
   );

-- 9. Remover perfis de usuário
DELETE FROM public.profiles 
WHERE user_id IN (SELECT user_id FROM users_to_clean);

-- 10. Finalmente, remover usuários da auth.users
-- NOTA: Isto irá remover permanentemente as contas de usuário
DELETE FROM auth.users 
WHERE email IN (
  'ronadias2010@gmail.com', 
  'priscila.serone@gmail.com', 
  'ronaldo.silva@arxexperience.com.br'
);

-- Limpar tabela temporária
DROP TABLE users_to_clean;