-- Tabela de logs de sincronização da extensão
CREATE TABLE IF NOT EXISTS public.extension_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  program_code TEXT NOT NULL,
  program_name TEXT NOT NULL,
  balance INTEGER NOT NULL,
  raw_text TEXT,
  source_url TEXT,
  ip_address TEXT,
  user_agent TEXT,
  extension_version TEXT,
  sync_status TEXT DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.extension_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own sync logs"
ON public.extension_sync_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync logs"
ON public.extension_sync_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_extension_sync_logs_user_program ON public.extension_sync_logs(user_id, program_code);
CREATE INDEX idx_extension_sync_logs_created_at ON public.extension_sync_logs(created_at DESC);

-- Adicionar coluna sync_source na tabela mileage_programs se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'mileage_programs' 
    AND column_name = 'sync_source'
  ) THEN
    ALTER TABLE public.mileage_programs ADD COLUMN sync_source TEXT DEFAULT 'manual';
  END IF;
END $$;

-- Adicionar coluna last_synced_at na tabela mileage_programs se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'mileage_programs' 
    AND column_name = 'last_synced_at'
  ) THEN
    ALTER TABLE public.mileage_programs ADD COLUMN last_synced_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;