-- Tabela de configuração do relatório de IR por ano
CREATE TABLE public.tax_report_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tax_year INTEGER NOT NULL,
  declaration_type TEXT NOT NULL DEFAULT 'individual',
  primary_declarant TEXT NOT NULL DEFAULT 'user1',
  dependents JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'incomplete',
  progress_percentage INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tax_year)
);

-- Tabela de documentos de deduções
CREATE TABLE public.tax_deduction_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tax_year INTEGER NOT NULL,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  document_url TEXT,
  document_name TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  provider_name TEXT,
  provider_cpf_cnpj TEXT,
  owner_user TEXT DEFAULT 'user1',
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de bens e direitos para IR
CREATE TABLE public.tax_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tax_year INTEGER NOT NULL,
  asset_type TEXT NOT NULL,
  asset_code TEXT,
  description TEXT NOT NULL,
  location TEXT DEFAULT 'Brasil',
  acquisition_date DATE,
  acquisition_value NUMERIC DEFAULT 0,
  value_at_year_start NUMERIC DEFAULT 0,
  value_at_year_end NUMERIC DEFAULT 0,
  owner_user TEXT DEFAULT 'user1',
  source_table TEXT,
  source_id UUID,
  ir_description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tax_report_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_deduction_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tax_report_config
CREATE POLICY "Users can view their own tax config"
ON public.tax_report_config FOR SELECT
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.user_couples
  WHERE status = 'active'
  AND ((user1_id = auth.uid() AND user2_id = tax_report_config.user_id)
    OR (user2_id = auth.uid() AND user1_id = tax_report_config.user_id))
));

CREATE POLICY "Users can insert their own tax config"
ON public.tax_report_config FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tax config"
ON public.tax_report_config FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tax config"
ON public.tax_report_config FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for tax_deduction_documents
CREATE POLICY "Users can view their own tax documents"
ON public.tax_deduction_documents FOR SELECT
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.user_couples
  WHERE status = 'active'
  AND ((user1_id = auth.uid() AND user2_id = tax_deduction_documents.user_id)
    OR (user2_id = auth.uid() AND user1_id = tax_deduction_documents.user_id))
));

CREATE POLICY "Users can insert their own tax documents"
ON public.tax_deduction_documents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tax documents"
ON public.tax_deduction_documents FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tax documents"
ON public.tax_deduction_documents FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for tax_assets
CREATE POLICY "Users can view their own tax assets"
ON public.tax_assets FOR SELECT
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.user_couples
  WHERE status = 'active'
  AND ((user1_id = auth.uid() AND user2_id = tax_assets.user_id)
    OR (user2_id = auth.uid() AND user1_id = tax_assets.user_id))
));

CREATE POLICY "Users can insert their own tax assets"
ON public.tax_assets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tax assets"
ON public.tax_assets FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tax assets"
ON public.tax_assets FOR DELETE
USING (auth.uid() = user_id);