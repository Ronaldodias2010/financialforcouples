-- Adicionar colunas para suporte multi-moedas na tabela transactions
-- Permite rastrear valor original, moeda original e taxa de câmbio usada

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS amount_original numeric,
ADD COLUMN IF NOT EXISTS currency_original text,
ADD COLUMN IF NOT EXISTS exchange_rate_used numeric;

-- Adicionar comentários explicativos
COMMENT ON COLUMN public.transactions.amount_original IS 'Valor original na moeda de origem (antes da conversão)';
COMMENT ON COLUMN public.transactions.currency_original IS 'Moeda original do gasto (ex: USD, EUR)';
COMMENT ON COLUMN public.transactions.exchange_rate_used IS 'Taxa de câmbio usada na conversão (moeda original -> moeda da conta)';