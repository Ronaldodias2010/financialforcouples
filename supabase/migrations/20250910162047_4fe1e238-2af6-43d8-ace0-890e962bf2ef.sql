-- Fase 1: Criar tabela para dados brutos da Moblix
CREATE TABLE public.moblix_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text UNIQUE NOT NULL,
  raw_data jsonb NOT NULL,
  processed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS na tabela moblix_offers
ALTER TABLE public.moblix_offers ENABLE ROW LEVEL SECURITY;

-- Política para que apenas service role possa gerenciar dados Moblix
CREATE POLICY "Service role can manage moblix offers" 
ON public.moblix_offers 
FOR ALL 
USING (auth.role() = 'service_role');

-- Adicionar colunas na airline_promotions para identificar origem dos dados
ALTER TABLE public.airline_promotions 
ADD COLUMN IF NOT EXISTS data_source text DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS external_reference text,
ADD COLUMN IF NOT EXISTS raw_price numeric,
ADD COLUMN IF NOT EXISTS boarding_tax numeric,
ADD COLUMN IF NOT EXISTS departure_date date,
ADD COLUMN IF NOT EXISTS return_date date,
ADD COLUMN IF NOT EXISTS is_round_trip boolean DEFAULT true;

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_airline_promotions_data_source ON public.airline_promotions(data_source);
CREATE INDEX IF NOT EXISTS idx_airline_promotions_external_ref ON public.airline_promotions(external_reference);
CREATE INDEX IF NOT EXISTS idx_moblix_offers_external_id ON public.moblix_offers(external_id);
CREATE INDEX IF NOT EXISTS idx_moblix_offers_processed ON public.moblix_offers(processed);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_moblix_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_moblix_offers_updated_at
  BEFORE UPDATE ON public.moblix_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_moblix_offers_updated_at();