-- ============================================
-- MIGRAÇÃO 1: FASE 0 - INFRAESTRUTURA DE AUDITORIA
-- ============================================
-- Rollback: DROP TABLE IF EXISTS public.migration_audit_log CASCADE;

-- Criar tabela de auditoria da migração
CREATE TABLE IF NOT EXISTS public.migration_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase TEXT NOT NULL,
  action TEXT NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  executed_by TEXT NOT NULL DEFAULT 'system',
  status TEXT NOT NULL DEFAULT 'pending',
  affected_rows INTEGER DEFAULT 0,
  notes TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_migration_audit_phase ON public.migration_audit_log(phase);
CREATE INDEX IF NOT EXISTS idx_migration_audit_status ON public.migration_audit_log(status);
CREATE INDEX IF NOT EXISTS idx_migration_audit_executed_at ON public.migration_audit_log(executed_at DESC);

-- Habilitar RLS
ALTER TABLE public.migration_audit_log ENABLE ROW LEVEL SECURITY;

-- Política para service_role (acesso total)
CREATE POLICY "Service role full access to migration_audit_log"
ON public.migration_audit_log
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Política para admins visualizarem
CREATE POLICY "Admins can view migration_audit_log"
ON public.migration_audit_log
FOR SELECT
USING (is_admin_user());

-- Registrar início da migração
INSERT INTO public.migration_audit_log (phase, action, status, notes)
VALUES 
  ('0', 'migration_start', 'completed', 'Início do plano de migração estrutural - Projeto Couples'),
  ('0', 'audit_table_created', 'completed', 'Tabela migration_audit_log criada com sucesso');