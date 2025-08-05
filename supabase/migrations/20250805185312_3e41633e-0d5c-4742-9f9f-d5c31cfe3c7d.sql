-- Deletar registros relacionados aos emails especificados
DELETE FROM profiles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('ronadias2010@gmail.com', 'priscila.serone@gmail.com')
);

DELETE FROM subscribers WHERE email IN ('ronadias2010@gmail.com', 'priscila.serone@gmail.com');

DELETE FROM user_invites WHERE invitee_email IN ('ronadias2010@gmail.com', 'priscila.serone@gmail.com');

DELETE FROM manual_premium_access WHERE email IN ('ronadias2010@gmail.com', 'priscila.serone@gmail.com');