-- Remover completamente o usuário ronadias2010@gmail.com do sistema

-- Primeiro, vamos obter o user_id para facilitar as operações
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Obter o user_id do email
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'ronadias2010@gmail.com';
    
    IF target_user_id IS NOT NULL THEN
        -- Deletar de todas as tabelas relacionadas
        DELETE FROM profiles WHERE user_id = target_user_id;
        DELETE FROM subscribers WHERE email = 'ronadias2010@gmail.com' OR user_id = target_user_id;
        DELETE FROM user_invites WHERE invitee_email = 'ronadias2010@gmail.com' OR inviter_user_id = target_user_id;
        DELETE FROM manual_premium_access WHERE email = 'ronadias2010@gmail.com' OR user_id = target_user_id;
        DELETE FROM user_couples WHERE user1_id = target_user_id OR user2_id = target_user_id;
        
        -- Deletar transações e dados financeiros
        DELETE FROM transactions WHERE user_id = target_user_id;
        DELETE FROM accounts WHERE user_id = target_user_id;
        DELETE FROM cards WHERE user_id = target_user_id;
        DELETE FROM categories WHERE user_id = target_user_id;
        DELETE FROM subcategories WHERE user_id = target_user_id;
        DELETE FROM recurring_expenses WHERE user_id = target_user_id;
        DELETE FROM investments WHERE user_id = target_user_id;
        DELETE FROM investment_goals WHERE user_id = target_user_id;
        DELETE FROM mileage_goals WHERE user_id = target_user_id;
        DELETE FROM mileage_history WHERE user_id = target_user_id;
        DELETE FROM card_mileage_rules WHERE user_id = target_user_id;
        
        -- Por último, deletar o usuário da tabela auth.users
        DELETE FROM auth.users WHERE id = target_user_id;
        
        RAISE NOTICE 'Usuário ronadias2010@gmail.com removido completamente do sistema';
    ELSE
        RAISE NOTICE 'Usuário ronadias2010@gmail.com não encontrado';
    END IF;
END $$;