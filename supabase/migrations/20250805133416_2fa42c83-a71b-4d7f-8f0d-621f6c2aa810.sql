-- Limpeza completa dos dados dos emails ronadias2010@gmail.com e priscila.serone@gmail.com

-- 1. Remover convites pendentes
DELETE FROM user_invites 
WHERE invitee_email IN ('ronadias2010@gmail.com', 'priscila.serone@gmail.com');

-- 2. Remover dados de assinatura
DELETE FROM subscribers 
WHERE email IN ('ronadias2010@gmail.com', 'priscila.serone@gmail.com');

-- 3. Limpar second_user_email da tabela profiles
UPDATE profiles 
SET second_user_email = NULL, second_user_name = NULL 
WHERE second_user_email IN ('ronadias2010@gmail.com', 'priscila.serone@gmail.com');

-- 4. Remover relacionamentos de casais se existirem
DELETE FROM user_couples 
WHERE user1_id = '3eee367d-9572-4561-952f-297fc4ae4128' 
   OR user2_id = '3eee367d-9572-4561-952f-297fc4ae4128';

-- 5. Limpar dados financeiros do usuário se necessário
DELETE FROM transactions WHERE user_id = '3eee367d-9572-4561-952f-297fc4ae4128';
DELETE FROM accounts WHERE user_id = '3eee367d-9572-4561-952f-297fc4ae4128';
DELETE FROM cards WHERE user_id = '3eee367d-9572-4561-952f-297fc4ae4128';
DELETE FROM categories WHERE user_id = '3eee367d-9572-4561-952f-297fc4ae4128';
DELETE FROM investments WHERE user_id = '3eee367d-9572-4561-952f-297fc4ae4128';
DELETE FROM investment_goals WHERE user_id = '3eee367d-9572-4561-952f-297fc4ae4128';
DELETE FROM recurring_expenses WHERE user_id = '3eee367d-9572-4561-952f-297fc4ae4128';
DELETE FROM mileage_goals WHERE user_id = '3eee367d-9572-4561-952f-297fc4ae4128';
DELETE FROM mileage_history WHERE user_id = '3eee367d-9572-4561-952f-297fc4ae4128';
DELETE FROM card_mileage_rules WHERE user_id = '3eee367d-9572-4561-952f-297fc4ae4128';

-- 6. Finalmente, remover o perfil do usuário
DELETE FROM profiles WHERE user_id = '3eee367d-9572-4561-952f-297fc4ae4128';