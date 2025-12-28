-- =====================================================
-- MIGRATION: Idempotência Completa para WhatsApp Input
-- =====================================================

-- 1. Adicionar constraint UNIQUE em (user_id, whatsapp_message_id)
-- Primeiro dropar se existir para evitar erro
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'incoming_financial_inputs_user_whatsapp_msg_unique'
  ) THEN
    ALTER TABLE public.incoming_financial_inputs
    ADD CONSTRAINT incoming_financial_inputs_user_whatsapp_msg_unique 
    UNIQUE (user_id, whatsapp_message_id);
  END IF;
END $$;

-- 2. Adicionar campo payment_method se não existir
ALTER TABLE public.incoming_financial_inputs
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- 3. Adicionar constraint de payment_method
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'incoming_financial_inputs_payment_method_check'
  ) THEN
    ALTER TABLE public.incoming_financial_inputs
    ADD CONSTRAINT incoming_financial_inputs_payment_method_check
    CHECK (payment_method IS NULL OR payment_method IN ('cash', 'pix', 'debit_card', 'credit_card'));
  END IF;
END $$;

-- 4. Adicionar external_reference_id na tabela transactions para idempotência
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS external_reference_id TEXT;

-- 5. Adicionar constraint UNIQUE em external_reference_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'transactions_external_reference_unique'
  ) THEN
    ALTER TABLE public.transactions
    ADD CONSTRAINT transactions_external_reference_unique 
    UNIQUE (external_reference_id);
  END IF;
END $$;

-- 6. Criar índice para busca rápida por external_reference_id
CREATE INDEX IF NOT EXISTS idx_transactions_external_reference 
ON public.transactions(external_reference_id) 
WHERE external_reference_id IS NOT NULL;

-- 7. Criar índice para busca rápida por whatsapp_message_id
CREATE INDEX IF NOT EXISTS idx_incoming_inputs_whatsapp_msg 
ON public.incoming_financial_inputs(user_id, whatsapp_message_id) 
WHERE whatsapp_message_id IS NOT NULL;