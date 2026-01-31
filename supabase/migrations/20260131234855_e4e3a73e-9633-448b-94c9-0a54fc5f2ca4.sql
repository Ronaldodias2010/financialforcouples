-- =====================================================
-- Fase 1: Tabelas para o Agente de Promoções de Milhas
-- =====================================================

-- 1.1 Tabela de promoções coletadas via scraping
CREATE TABLE public.scraped_promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  programa TEXT NOT NULL,
  origem TEXT,
  destino TEXT NOT NULL,
  milhas_min INTEGER NOT NULL,
  link TEXT NOT NULL,
  titulo TEXT,
  descricao TEXT,
  data_coleta DATE NOT NULL DEFAULT CURRENT_DATE,
  fonte TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  external_hash TEXT UNIQUE
);

-- 1.2 Tabela de sugestões personalizadas por usuário
CREATE TABLE public.user_travel_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  promotion_id UUID NOT NULL REFERENCES public.scraped_promotions(id) ON DELETE CASCADE,
  saldo_usuario INTEGER NOT NULL,
  programa_usuario TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  is_viewed BOOLEAN NOT NULL DEFAULT false,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, promotion_id)
);

-- 1.3 Tabela de log de jobs de scraping
CREATE TABLE public.scraping_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  pages_scraped INTEGER DEFAULT 0,
  promotions_found INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- Índices para performance
-- =====================================================
CREATE INDEX idx_scraped_promotions_programa ON public.scraped_promotions(programa);
CREATE INDEX idx_scraped_promotions_destino ON public.scraped_promotions(destino);
CREATE INDEX idx_scraped_promotions_milhas ON public.scraped_promotions(milhas_min);
CREATE INDEX idx_scraped_promotions_active ON public.scraped_promotions(is_active);
CREATE INDEX idx_scraped_promotions_fonte ON public.scraped_promotions(fonte);
CREATE INDEX idx_user_travel_suggestions_user ON public.user_travel_suggestions(user_id);
CREATE INDEX idx_user_travel_suggestions_viewed ON public.user_travel_suggestions(is_viewed);
CREATE INDEX idx_scraping_jobs_status ON public.scraping_jobs(status);

-- =====================================================
-- RLS Policies
-- =====================================================

-- scraped_promotions: Leitura pública para promoções ativas
ALTER TABLE public.scraped_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active promotions"
  ON public.scraped_promotions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role can manage promotions"
  ON public.scraped_promotions FOR ALL
  USING (true)
  WITH CHECK (true);

-- user_travel_suggestions: Apenas próprio usuário
ALTER TABLE public.user_travel_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own suggestions"
  ON public.user_travel_suggestions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own suggestions"
  ON public.user_travel_suggestions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage suggestions"
  ON public.user_travel_suggestions FOR ALL
  USING (true)
  WITH CHECK (true);

-- scraping_jobs: Apenas leitura para admin (service role gerencia)
ALTER TABLE public.scraping_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage scraping jobs"
  ON public.scraping_jobs FOR ALL
  USING (true)
  WITH CHECK (true);