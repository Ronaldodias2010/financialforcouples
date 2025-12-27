-- Tabela para controle de rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limit_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  function_name TEXT NOT NULL,
  request_count INT DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.rate_limit_entries ENABLE ROW LEVEL SECURITY;

-- Política para permitir que edge functions acessem (service role bypassa RLS)
-- Mas bloqueamos acesso direto de usuários anônimos
CREATE POLICY "Service role full access" ON public.rate_limit_entries
  FOR ALL USING (auth.role() = 'service_role');

-- Índice composto para buscas rápidas por identifier + function_name + window
CREATE INDEX IF NOT EXISTS idx_rate_limit_lookup 
ON public.rate_limit_entries(identifier, function_name, window_start DESC);

-- Índice para limpeza por data
CREATE INDEX IF NOT EXISTS idx_rate_limit_cleanup 
ON public.rate_limit_entries(window_start);

-- Função de limpeza de entradas antigas (>24h)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.rate_limit_entries 
  WHERE window_start < now() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Cleaned up % old rate limit entries', deleted_count;
  
  RETURN deleted_count;
END;
$$;

-- Adicionar índice na tabela security_audit_log para melhorar performance
CREATE INDEX IF NOT EXISTS idx_security_audit_created 
ON public.security_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_audit_user 
ON public.security_audit_log(user_id, action_type);

CREATE INDEX IF NOT EXISTS idx_security_audit_ip 
ON public.security_audit_log(ip_address);