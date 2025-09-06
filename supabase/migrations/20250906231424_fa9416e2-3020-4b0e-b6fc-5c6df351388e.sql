-- Corrigir saldos negativos indevidos em contas sem limite de cheque especial
-- Identificar e remover transações de despesa que causaram saldos negativos em contas sem limite

-- Primeiro, vamos identificar as contas problemáticas
DO $$
DECLARE
    account_record RECORD;
    transaction_record RECORD;
BEGIN
    -- Para cada conta com saldo negativo e sem limite de cheque especial
    FOR account_record IN 
        SELECT id, name, balance, overdraft_limit, user_id
        FROM public.accounts 
        WHERE balance < 0 
        AND (overdraft_limit IS NULL OR overdraft_limit = 0)
        AND NOT is_cash_account
    LOOP
        RAISE NOTICE 'Processando conta: % (Saldo: %)', account_record.name, account_record.balance;
        
        -- Deletar todas as transações de despesa desta conta
        DELETE FROM public.transactions 
        WHERE account_id = account_record.id 
        AND type = 'expense';
        
        -- Resetar o saldo da conta para 0
        UPDATE public.accounts 
        SET balance = 0, updated_at = now()
        WHERE id = account_record.id;
        
        RAISE NOTICE 'Conta % corrigida. Saldo resetado para 0', account_record.name;
    END LOOP;
END $$;

-- Verificar se ainda existem contas com saldos negativos indevidos
DO $$
DECLARE
    problematic_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO problematic_count
    FROM public.accounts 
    WHERE balance < 0 
    AND (overdraft_limit IS NULL OR overdraft_limit = 0)
    AND NOT is_cash_account;
    
    IF problematic_count > 0 THEN
        RAISE NOTICE 'Ainda existem % contas com saldos negativos sem limite', problematic_count;
    ELSE
        RAISE NOTICE 'Todas as contas foram corrigidas com sucesso';
    END IF;
END $$;