-- Otimizar performance com índices simples e configurações de realtime

-- Índices para otimizar consultas mais comuns
CREATE INDEX IF NOT EXISTS idx_transactions_user_type_date 
ON public.transactions (user_id, type, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_accounts_user_model
ON public.accounts (user_id, account_model);

CREATE INDEX IF NOT EXISTS idx_user_couples_active
ON public.user_couples (user1_id, user2_id) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_profiles_user_currency
ON public.profiles (user_id, preferred_currency);

-- Configurar REPLICA IDENTITY para otimizar real-time performance
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.accounts REPLICA IDENTITY FULL;
ALTER TABLE public.user_couples REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;