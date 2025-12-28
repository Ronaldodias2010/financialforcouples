-- Adicionar campo source em transactions para rastreabilidade
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'app';

-- Criar CHECK constraint para valores válidos
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_source_check 
CHECK (source IN ('app', 'whatsapp', 'import', 'api', 'recurring'));

-- Criar índice para queries por source
CREATE INDEX IF NOT EXISTS idx_transactions_source ON public.transactions(source);

-- Comentário para documentação
COMMENT ON COLUMN public.transactions.source IS 'Origin of transaction: app (manual), whatsapp (N8N), import (file), api (external), recurring (auto-generated)';