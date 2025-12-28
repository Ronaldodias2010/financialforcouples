
-- Corrigir as views para usar SECURITY INVOKER (padrão seguro)
-- Isso garante que as políticas RLS do usuário que consulta sejam aplicadas

DROP VIEW IF EXISTS public.active_transactions;
DROP VIEW IF EXISTS public.active_accounts;
DROP VIEW IF EXISTS public.active_cards;
DROP VIEW IF EXISTS public.active_categories;
DROP VIEW IF EXISTS public.active_investments;

-- Recriar com SECURITY INVOKER (comportamento padrão e seguro)
CREATE VIEW public.active_transactions 
WITH (security_invoker = true) AS
SELECT * FROM public.transactions WHERE deleted_at IS NULL;

CREATE VIEW public.active_accounts 
WITH (security_invoker = true) AS
SELECT * FROM public.accounts WHERE deleted_at IS NULL;

CREATE VIEW public.active_cards 
WITH (security_invoker = true) AS
SELECT * FROM public.cards WHERE deleted_at IS NULL;

CREATE VIEW public.active_categories 
WITH (security_invoker = true) AS
SELECT * FROM public.categories WHERE deleted_at IS NULL;

CREATE VIEW public.active_investments 
WITH (security_invoker = true) AS
SELECT * FROM public.investments WHERE deleted_at IS NULL;

-- Adicionar comentários explicativos
COMMENT ON VIEW public.active_transactions IS 'View com transações ativas (não deletadas) - respeita RLS do usuário';
COMMENT ON VIEW public.active_accounts IS 'View com contas ativas (não deletadas) - respeita RLS do usuário';
COMMENT ON VIEW public.active_cards IS 'View com cartões ativos (não deletados) - respeita RLS do usuário';
COMMENT ON VIEW public.active_categories IS 'View com categorias ativas (não deletadas) - respeita RLS do usuário';
COMMENT ON VIEW public.active_investments IS 'View com investimentos ativos (não deletados) - respeita RLS do usuário';
