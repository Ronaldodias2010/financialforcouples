-- Otimizar apenas nossas tabelas para reduzir consultas lentas

-- Otimizar consultas de transactions por usuário e data (mais comum)
CREATE INDEX IF NOT EXISTS idx_transactions_user_date_performance 
ON public.transactions (user_id, transaction_date DESC, type)
WHERE transaction_date >= CURRENT_DATE - INTERVAL '3 months';

-- Otimizar consultas de accounts por usuário
CREATE INDEX IF NOT EXISTS idx_accounts_user_model_performance
ON public.accounts (user_id, account_model)
WHERE account_model = 'personal';

-- Otimizar consultas de couples por usuário
CREATE INDEX IF NOT EXISTS idx_user_couples_performance
ON public.user_couples (user1_id, user2_id, status)
WHERE status = 'active';

-- Índice para profiles por preferred_currency
CREATE INDEX IF NOT EXISTS idx_profiles_currency_performance
ON public.profiles (user_id, preferred_currency)
WHERE preferred_currency IS NOT NULL;

-- Configurar REPLICA IDENTITY para melhor performance em real-time
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.accounts REPLICA IDENTITY FULL;
ALTER TABLE public.user_couples REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;